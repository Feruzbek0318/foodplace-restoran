export interface StorageProvider {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  async save(key: string, data: any): Promise<void> {
    const serialized = JSON.stringify(data);
    localStorage.setItem('foodplace_v1_' + key, serialized);
  }

  async load(key: string): Promise<any> {
    const item = localStorage.getItem('foodplace_v1_' + key);
    return item ? JSON.parse(item) : null;
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem('foodplace_v1_' + key);
  }
}

export class GoogleDriveProvider implements StorageProvider {
  private accessToken: string | null = null;
  private folderId: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  async save(key: string, data: any): Promise<void> {
    if (!this.accessToken) return;
    // Implement real Google Drive API upload to appDataFolder
    try {
      const fileId = await this.getFileId(key);
      const metadata = { name: `${key}.json`, mimeType: 'application/json', parents: ['appDataFolder'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
      
      const url = fileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
      const method = fileId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form,
      });
      if (!res.ok) throw new Error('Drive API error');
    } catch (e) {
      console.error('Drive save error:', e);
      throw e;
    }
  }

  async load(key: string): Promise<any> {
    if (!this.accessToken) return null;
    try {
      const fileId = await this.getFileId(key);
      if (!fileId) return null;
      
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) throw new Error('Drive fetch error');
      return await res.json();
    } catch (e) {
      console.error('Drive load error:', e);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.accessToken) return;
    try {
      const fileId = await this.getFileId(key);
      if (fileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  private async getFileId(key: string): Promise<string | null> {
    const q = encodeURIComponent(`name='${key}.json' and spaces='appDataFolder' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const data = await res.json();
    if (data && data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }
}

export type SyncStatus = 'disconnected' | 'connected' | 'syncing' | 'synced' | 'error';

class StorageAdapterClass {
  private local = new LocalStorageProvider();
  private drive = new GoogleDriveProvider();
  
  public syncStatus: SyncStatus = 'disconnected';
  private listeners: Array<(status: SyncStatus) => void> = [];

  subscribe(fn: (status: SyncStatus) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach(l => l(status));
  }

  connectDrive(token: string) {
    this.drive.setToken(token);
    this.setStatus('connected');
    localStorage.setItem('gdrive_token', token);
  }

  disconnectDrive() {
    this.drive.setToken('');
    this.setStatus('disconnected');
    localStorage.removeItem('gdrive_token');
  }

  async syncAll(fullState: any) {
    if (this.syncStatus === 'disconnected') return;
    this.setStatus('syncing');
    try {
      for (const [key, value] of Object.entries(fullState)) {
        if (typeof value !== 'function') {
           await this.drive.save(key, value);
        }
      }
      this.setStatus('synced');
    } catch (e) {
      this.setStatus('error');
    }
  }

  async save(key: string, data: any) {
    // 1. Always save locally first for instant persistence
    await this.local.save(key, data);
    
    // 2. Sync to cloud if connected
    if (this.syncStatus !== 'disconnected' && this.syncStatus !== 'error') {
      this.setStatus('syncing');
      try {
        await this.drive.save(key, data);
        this.setStatus('synced');
      } catch (e) {
        this.setStatus('error');
      }
    }
  }

  async remove(key: string) {
    await this.local.remove(key);
  }

  async load(key: string, defaultValue: any): Promise<any> {
    // Check cloud first if connected? Actually, local is faster.
    // Real sync manager would load cloud state, compare timestamp, and merge.
    // For now, load local.
    const localData = await this.local.load(key);
    return localData || defaultValue;
  }

  async loadInitialSync(keys: string[]): Promise<Record<string, any>> {
    const token = localStorage.getItem('gdrive_token');
    if (token) {
      this.connectDrive(token);
      this.setStatus('syncing');
      try {
        const cloudState: Record<string, any> = {};
        for (const key of keys) {
          const cloudVal = await this.drive.load(key);
          if (cloudVal) cloudState[key] = cloudVal;
        }
        this.setStatus('synced');
        return cloudState;
      } catch (e) {
        this.setStatus('error');
      }
    }
    return {};
  }
}

export const StorageAdapter = new StorageAdapterClass();

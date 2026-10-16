import { useEffect, useState } from 'react';
import { getCloudState, onCloudStateChange } from '../services/cloudSync';

/** Live cloud connection state (configured, restaurant key, online/offline/error). */
export function useCloudState() {
  const [state, setState] = useState(getCloudState);
  useEffect(() => {
    const unsubscribe = onCloudStateChange(() => setState(getCloudState()));
    return () => {
      unsubscribe();
    };
  }, []);
  return state;
}

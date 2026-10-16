import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../utils/storage';
import { Camera } from 'lucide-react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcId?: string;
  fallbackIcon?: React.ReactNode;
}

export const AsyncImage: React.FC<Props> = ({ srcId, fallbackIcon, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!srcId) {
      setImgSrc(null);
      return;
    }
    
    if (srcId.startsWith('http') || srcId.startsWith('data:')) {
      setImgSrc(srcId);
    } else if (srcId.startsWith('img_')) {
      getImageUrl(srcId).then(url => {
        if (url) setImgSrc(url);
      }).catch(e => console.error(e));
    } else {
      setImgSrc(srcId);
    }
  }, [srcId]);

  if (!imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className || ''}`}>
        {fallbackIcon || <Camera className="w-5 h-5 text-slate-400" />}
      </div>
    );
  }

  return <img src={imgSrc} className={className} {...props} />;
};

import { useEffect, useState } from 'react';
import api from '@/services/api';

function isProtectedUploadUrl(src) {
  return src?.startsWith('/api/v1/');
}

function apiPathFromSrc(src) {
  return src.replace(/^\/api\/v1/, '') || src;
}

export default function AuthenticatedImage({ src, alt, fallback = null, loadProtected = false, ...props }) {
  const [imageState, setImageState] = useState({ src: '', objectUrl: '', failed: false });

  useEffect(() => {
    let active = true;

    if (!src || !isProtectedUploadUrl(src) || !loadProtected) {
      return undefined;
    }

    api.get(apiPathFromSrc(src), { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        setImageState((previous) => ({
          src,
          objectUrl: URL.createObjectURL(response.data),
          previousObjectUrl: previous.objectUrl,
          failed: false,
        }));
      })
      .catch(() => {
        if (active) setImageState({ src, objectUrl: '', failed: true });
      });

    return () => {
      active = false;
    };
  }, [loadProtected, src]);

  useEffect(() => {
    if (imageState.previousObjectUrl) URL.revokeObjectURL(imageState.previousObjectUrl);
    return () => {
      if (imageState.objectUrl) URL.revokeObjectURL(imageState.objectUrl);
    };
  }, [imageState.objectUrl, imageState.previousObjectUrl]);

  if (!src) return fallback;

  if (isProtectedUploadUrl(src)) {
    if (!loadProtected) return fallback;
    if (imageState.src !== src || imageState.failed || !imageState.objectUrl) return fallback;
    return <img src={imageState.objectUrl} alt={alt} {...props} />;
  }

  return <img src={src} alt={alt} {...props} />;
}

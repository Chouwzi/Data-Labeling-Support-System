import { useEffect, useState } from 'react';
import api from '@/services/api';

const protectedImageCache = new Map();
const inflightImageRequests = new Map();

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

    const cached = protectedImageCache.get(src);
    if (cached) {
      Promise.resolve().then(() => {
        if (active) setImageState({ src, objectUrl: cached, failed: false });
      });
      return () => {
        active = false;
      };
    }

    const request = inflightImageRequests.get(src)
      || api.get(apiPathFromSrc(src), { responseType: 'blob' })
        .then((response) => {
          const objectUrl = URL.createObjectURL(response.data);
          protectedImageCache.set(src, objectUrl);
          inflightImageRequests.delete(src);
          return objectUrl;
        })
        .catch((error) => {
          inflightImageRequests.delete(src);
          throw error;
        });
    inflightImageRequests.set(src, request);

    request
      .then((response) => {
        if (!active) return;
        setImageState({
          src,
          objectUrl: response,
          failed: false,
        });
      })
      .catch(() => {
        if (active) setImageState({ src, objectUrl: '', failed: true });
      });

    return () => {
      active = false;
    };
  }, [loadProtected, src]);

  if (!src) return fallback;

  if (isProtectedUploadUrl(src)) {
    if (!loadProtected) return fallback;
    if (imageState.src !== src || imageState.failed || !imageState.objectUrl) return fallback;
    return <img src={imageState.objectUrl} alt={alt} loading="lazy" decoding="async" {...props} />;
  }

  return <img src={src} alt={alt} loading="lazy" decoding="async" {...props} />;
}

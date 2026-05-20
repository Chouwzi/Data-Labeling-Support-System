export const DEFAULT_UPLOAD_POLICY = {
  maxImageSizeMb: 20,
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
};

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeUploadPolicy(response) {
  const raw = response?.data?.result ?? response?.data ?? response ?? {};
  const maxImageSizeMb = Number(raw.maxImageSize ?? raw.max_image_file_size_mb) || DEFAULT_UPLOAD_POLICY.maxImageSizeMb;
  const allowedExtensions = Array.isArray(raw.allowedExtensions ?? raw.allowed_image_extensions)
    ? (raw.allowedExtensions ?? raw.allowed_image_extensions)
      .map((extension) => String(extension).replace(/^\./, '').trim().toLowerCase())
      .filter(Boolean)
    : DEFAULT_UPLOAD_POLICY.allowedExtensions;

  return {
    maxImageSizeMb,
    allowedExtensions: allowedExtensions.length > 0 ? allowedExtensions : DEFAULT_UPLOAD_POLICY.allowedExtensions,
  };
}

export function getAcceptedImageExtensions(policy = DEFAULT_UPLOAD_POLICY) {
  return policy.allowedExtensions.map((extension) => `.${extension}`).join(',');
}

export function describeUploadPolicy(policy = DEFAULT_UPLOAD_POLICY) {
  return `${policy.allowedExtensions.map((extension) => extension.toUpperCase()).join(', ')} up to ${policy.maxImageSizeMb}MB`;
}

export function validateImageFile(file, policy = DEFAULT_UPLOAD_POLICY) {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (!policy.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported format. Allowed: ${policy.allowedExtensions.map((item) => item.toUpperCase()).join(', ')}.`,
    };
  }

  const maxBytes = policy.maxImageSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Size too large: ${formatFileSize(file.size)}. Limit is ${policy.maxImageSizeMb}MB.`,
    };
  }

  return { valid: true, error: '' };
}

export function apiErrorMessage(error, fallback = 'Upload failed') {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import '@/styles/SystemConfigPanel.css';
function ToggleSwitch({ checked, onChange, disabled = false, labelledBy }) {
  return (
    <button
      type="button"
      className={`config-toggle-switch ${checked ? 'config-toggle-switch--on' : 'config-toggle-switch--off'} ${disabled ? 'config-toggle-switch--disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      aria-labelledby={labelledBy}
    >
      <span className="config-toggle-switch__thumb" />
    </button>
  );
}

export default function SystemConfigPanel({
  initialSettings,
  onSave,
}) {
  const [maxImageSize, setMaxImageSize] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [defaultPageSize, setDefaultPageSize] = useState('');
  const [allowedExtensions, setAllowedExtensions] = useState([]);
  const [extensionInput, setExtensionInput] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKind, setToastKind] = useState('success');
  const [hasChanges, setHasChanges] = useState(false);

  const baselineRef = useRef({
    maxImageSize: '',
    aiEnabled: false,
    defaultPageSize: '',
    allowedExtensions: [],
    version: 0,
  });

  const recomputeDirty = useCallback((nextSize, nextAi, nextDefaultPageSize, nextExtensions, nextVersion) => {
    const b = baselineRef.current;
    const extensionsChanged = JSON.stringify([...nextExtensions].sort()) !== JSON.stringify([...b.allowedExtensions].sort());
    setHasChanges(
      nextSize !== b.maxImageSize || 
      nextAi !== b.aiEnabled || 
      nextDefaultPageSize !== b.defaultPageSize ||
      extensionsChanged
    );
  }, []);

  // Update effect when initialSettings change (e.g. after fetch)
  useEffect(() => {
    if (!initialSettings) {
      return;
    }

    console.log('SystemConfigPanel receiving settings:', initialSettings);

    // Mapping từ snake_case (Backend Jackson config) sang Component State
    const nextSize = initialSettings.max_image_file_size_mb;
    const nextAi = initialSettings.ai_labeling_enabled;
    const nextPageSize = initialSettings.default_page_size;
    const nextExtensions = initialSettings.allowed_image_extensions;
    const nextVersion = initialSettings.version;

    if (nextSize !== undefined) setMaxImageSize(nextSize);
    if (nextAi !== undefined) setAiEnabled(nextAi);
    if (nextPageSize !== undefined) setDefaultPageSize(nextPageSize);
    if (nextExtensions !== undefined) setAllowedExtensions(nextExtensions);
    
    baselineRef.current = {
      maxImageSize: nextSize,
      aiEnabled: nextAi,
      defaultPageSize: nextPageSize,
      allowedExtensions: nextExtensions,
      version: nextVersion,
    };
    setHasChanges(false);
  }, [initialSettings]);

  const handleNumberChange = useCallback(
    (e) => {
      const raw = e.target.value;
      if (raw === '') {
        setMaxImageSize('');
        setHasChanges(true);
        return;
      }
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) {
        setMaxImageSize(n);
        recomputeDirty(n, aiEnabled, defaultPageSize, allowedExtensions);
      }
    },
    [aiEnabled, defaultPageSize, allowedExtensions, recomputeDirty]
  );

  const handleNumberBlur = useCallback(() => {
    if (maxImageSize === '' || maxImageSize < 1) {
      const n = 1;
      setMaxImageSize(n);
      recomputeDirty(n, aiEnabled, defaultPageSize, allowedExtensions);
    }
  }, [maxImageSize, aiEnabled, defaultPageSize, allowedExtensions, recomputeDirty]);

  const handleAiToggle = useCallback(
    (checked) => {
      setAiEnabled(checked);
      const size = maxImageSize === '' ? baselineRef.current.maxImageSize : maxImageSize;
      recomputeDirty(size, checked, defaultPageSize, allowedExtensions);
    },
    [maxImageSize, defaultPageSize, allowedExtensions, recomputeDirty]
  );

  const handleMfaToggle = useCallback((checked) => {
    setMfaEnabled(checked);
  }, []);

  const handleAddExtension = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = extensionInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (value && !allowedExtensions.includes(value)) {
        const nextExts = [...allowedExtensions, value];
        setAllowedExtensions(nextExts);
        setExtensionInput('');
        recomputeDirty(maxImageSize, aiEnabled, defaultPageSize, nextExts);
      } else {
        setExtensionInput('');
      }
    }
  };

  const removeExtension = (ext) => {
    const nextExts = allowedExtensions.filter(e => e !== ext);
    setAllowedExtensions(nextExts);
    recomputeDirty(maxImageSize, aiEnabled, defaultPageSize, nextExts);
  };

  const handleSave = useCallback(async () => {
    const size = maxImageSize === '' ? 0 : Number(maxImageSize);
    const pageSize = defaultPageSize === '' ? 0 : Number(defaultPageSize);

    if (!size || size <= 0 || !pageSize || pageSize <= 0) {
      setToastKind('error');
      setToastMessage('Giá trị nhập vào không hợp lệ');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
      return;
    }

    setIsSaving(true);

    try {
      // Mapping back to snake_case for Backend Jackson API
      const config = { 
        max_image_file_size_mb: size, 
        ai_labeling_enabled: aiEnabled,
        default_page_size: pageSize,
        allowed_image_extensions: allowedExtensions,
        version: baselineRef.current.version
      };
      
      if (onSave) {
        await onSave(config);
      }

      baselineRef.current = { 
        maxImageSize: size, 
        aiEnabled, 
        defaultPageSize: pageSize, 
        allowedExtensions,
        version: baselineRef.current.version + 1
      };
      
      setToastKind('success');
      setToastMessage('Cấu hình đã được lưu thành công');
      setShowToast(true);
      setHasChanges(false);
      setTimeout(() => setShowToast(false), 3200);
    } catch {
      setToastKind('error');
      setToastMessage('Không thể lưu cấu hình. Vui lòng thử lại.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
    } finally {
      setIsSaving(false);
    }
  }, [maxImageSize, aiEnabled, defaultPageSize, allowedExtensions, onSave]);

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <h3 className="config-panel__title" id="config-panel-heading">
          System Configuration
        </h3>
        <p className="config-panel__subtitle">Technical Policy &amp; Behavior</p>
      </div>

      <div className="config-panel__content">
        <div className="config-field">
          <label className="config-field__label" htmlFor="max-image-size">
            Max Image File Size
          </label>
          <div className="config-field__row">
            <div className="config-field__input-inner">
              <input
                id="max-image-size"
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                className="config-field__input config-field__input--number"
                value={maxImageSize === '' ? '' : maxImageSize}
                onChange={handleNumberChange}
                onBlur={handleNumberBlur}
                aria-describedby="max-image-hint"
              />
            </div>
            <span className="config-field__suffix" aria-hidden="true">
              MB
            </span>
          </div>
          <p className="config-field__hint" id="max-image-hint">
            Global limit applied to all data labeling uploads.
          </p>
        </div>

        <div className="config-field">
          <label className="config-field__label" htmlFor="default-page-size">
            Default Page Size
          </label>
          <div className="config-field__row">
            <div className="config-field__input-inner">
              <input
                id="default-page-size"
                type="number"
                inputMode="numeric"
                min={5}
                max={200}
                className="config-field__input config-field__input--number"
                value={defaultPageSize === '' ? '' : defaultPageSize}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setDefaultPageSize(val);
                  recomputeDirty(maxImageSize, aiEnabled, val, allowedExtensions);
                }}
                aria-describedby="page-size-hint"
              />
            </div>
          </div>
          <p className="config-field__hint" id="page-size-hint">
            Number of items per page in data lists.
          </p>
        </div>

        <div className="config-field">
          <label className="config-field__label">Allowed Image Extensions</label>
          <div className="config-extensions">
            <div className="config-extensions__list">
              {Array.isArray(allowedExtensions) && allowedExtensions.map((ext) => (
                <span key={ext} className="config-extension-tag">
                  .{ext}
                  <button
                    type="button"
                    className="config-extension-tag__remove"
                    onClick={() => removeExtension(ext)}
                    aria-label={`Remove .${ext}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="config-extensions__input"
              placeholder="Add extension (e.g. svg)..."
              value={extensionInput}
              onChange={(e) => setExtensionInput(e.target.value)}
              onKeyDown={handleAddExtension}
              aria-describedby="extensions-hint"
            />
          </div>
          <p className="config-field__hint" id="extensions-hint">
            Press Enter or comma to add. Only letters and numbers allowed.
          </p>
        </div>

        <div className="config-toggle">
          <div className="config-toggle__content">
            <p className="config-toggle__label" id="ai-toggle-label">
              AI Labeling Support
            </p>
            <p className="config-toggle__description">Enable predictive auto-labeling</p>
          </div>
          <ToggleSwitch
            checked={aiEnabled}
            onChange={handleAiToggle}
            disabled={isSaving}
            labelledBy="ai-toggle-label"
          />
        </div>

        <div className="config-toggle config-toggle--muted">
          <div className="config-toggle__content">
            <p className="config-toggle__label" id="mfa-toggle-label">
              Multi-Factor Auth
            </p>
            <p className="config-toggle__description">Enforce for all annotators</p>
          </div>
          <ToggleSwitch
            checked={mfaEnabled}
            onChange={handleMfaToggle}
            disabled={isSaving}
            labelledBy="mfa-toggle-label"
          />
        </div>

        <button
          type="button"
          className={`config-save-btn ${isSaving ? 'config-save-btn--saving' : ''}`}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="config-panel__footer">
        <Info size={20} aria-hidden="true" />
        <p className="config-panel__footer-text">
          Changes made to system configurations are logged and applied across all active instances within 60 seconds.
        </p>
      </div>

      {showToast && (
        <div
          className={`config-toast ${toastKind === 'error' ? 'config-toast--error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {toastKind === 'success' ? (
            <CheckCircle size={20} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <AlertCircle size={20} strokeWidth={2.25} aria-hidden="true" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

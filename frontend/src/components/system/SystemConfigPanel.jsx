import { useState, useCallback, useRef } from 'react';
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
  initialMaxImageSize = 10,
  initialAiEnabled = true,
  onSave,
}) {
  const [maxImageSize, setMaxImageSize] = useState(initialMaxImageSize);
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKind, setToastKind] = useState('success');
  const [hasChanges, setHasChanges] = useState(false);

  const baselineRef = useRef({
    maxImageSize: initialMaxImageSize,
    aiEnabled: initialAiEnabled,
  });

  const recomputeDirty = useCallback((nextSize, nextAi) => {
    const b = baselineRef.current;
    setHasChanges(nextSize !== b.maxImageSize || nextAi !== b.aiEnabled);
  }, []);

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
        recomputeDirty(n, aiEnabled);
      }
    },
    [aiEnabled, recomputeDirty]
  );

  const handleNumberBlur = useCallback(() => {
    if (maxImageSize === '' || maxImageSize < 1) {
      const n = 1;
      setMaxImageSize(n);
      recomputeDirty(n, aiEnabled);
    }
  }, [maxImageSize, aiEnabled, recomputeDirty]);

  const handleAiToggle = useCallback(
    (checked) => {
      setAiEnabled(checked);
      const size = maxImageSize === '' ? baselineRef.current.maxImageSize : maxImageSize;
      recomputeDirty(size, checked);
    },
    [maxImageSize, recomputeDirty]
  );

  const handleSave = useCallback(async () => {
    const size = maxImageSize === '' ? 0 : Number(maxImageSize);
    if (!size || size <= 0) {
      setToastKind('error');
      setToastMessage('Max image size must be greater than 0');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
      return;
    }

    setIsSaving(true);

    try {
      const config = { maxImageSize: size, aiEnabled };
      if (onSave) {
        await onSave(config);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      baselineRef.current = { maxImageSize: size, aiEnabled };
      setToastKind('success');
      setToastMessage('Settings saved successfully');
      setShowToast(true);
      setHasChanges(false);
      setTimeout(() => setShowToast(false), 3200);
    } catch {
      setToastKind('error');
      setToastMessage('Could not save settings');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
    } finally {
      setIsSaving(false);
    }
  }, [maxImageSize, aiEnabled, onSave]);

  const handleDiscardChanges = useCallback(() => {
    const baseline = baselineRef.current;
    setMaxImageSize(baseline.maxImageSize);
    setAiEnabled(baseline.aiEnabled);
    setHasChanges(false);
    setShowToast(false);
  }, []);

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <h3 className="config-panel__title" id="config-panel-heading">
          System Configuration
        </h3>
        <p className="config-panel__subtitle">Technical Policy &amp; Behavior</p>
      </div>

      <div className="config-panel__content">
        {hasChanges && (
          <div className="config-dirty-state" role="status">
            <div>
              <strong>Unsaved changes</strong>
              <span>Review or discard policy updates before leaving this page.</span>
            </div>
            <button type="button" onClick={handleDiscardChanges} disabled={isSaving}>
              Discard changes
            </button>
          </div>
        )}

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



        <button
          type="button"
          className={`config-save-btn primary-gradient ${isSaving ? 'config-save-btn--loading' : ''}`}
          onClick={handleSave}
          disabled={
            !hasChanges ||
            isSaving ||
            maxImageSize === '' ||
            Number(maxImageSize) <= 0
          }
        >
          {isSaving ? (
            <>
              <span className="config-save-btn__spinner" aria-hidden="true" />
              <span>Saving&hellip;</span>
            </>
          ) : (
            'Save Configuration'
          )}
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

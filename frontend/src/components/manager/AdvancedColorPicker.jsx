import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import { Check, ChevronDown, Pipette } from 'lucide-react';

const MotionDiv = motion.div;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const TAB_SOLID = 'solid';
const TAB_QUICK = 'quick';

/**
 * Tabbed professional solid color picker.
 * Tab 1 — Solid Color: 2D saturation/brightness + hue slider
 * Tab 2 — Màu đồng nhất: 5×3 quick palette
 * Shared footer: preview + hex + eyedropper (always synced)
 */
const QUICK_PALETTE_15 = [
  { hex: '#DC2626', label: 'Red' },
  { hex: '#EA580C', label: 'Orange' },
  { hex: '#D97706', label: 'Gold' },
  { hex: '#65A30D', label: 'Lime' },
  { hex: '#16A34A', label: 'Green' },
  { hex: '#0D9488', label: 'Teal' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#2563EB', label: 'Blue' },
  { hex: '#7C3AED', label: 'Purple' },
  { hex: '#DB2777', label: 'Magenta' },
  { hex: '#92400E', label: 'Brown' },
  { hex: '#475569', label: 'Slate' },
  { hex: '#881337', label: 'Maroon' },
  { hex: '#4C1D95', label: 'Indigo' },
  { hex: '#14532D', label: 'Dark Green' },
];

function normalizeHex(hex) {
  if (typeof hex !== 'string') return '#006C51';
  const t = hex.trim();
  const raw = t.startsWith('#') ? t : `#${t}`;
  return HEX_RE.test(raw) ? raw.toLowerCase() : '#006C51';
}

function formatHexDisplay(hex) {
  if (typeof hex !== 'string') return '#';
  const t = hex.trim();
  if (t === '' || t === '#') return '#';
  const raw = t.startsWith('#') ? t : `#${t}`;
  return raw.slice(0, 7).toUpperCase();
}

export default function AdvancedColorPicker({
  value,
  onChange,
  id,
  disabled = false,
  'aria-label': ariaLabel = 'Choose color',
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_SOLID);
  const rootRef = useRef(null);

  const pickerHex = normalizeHex(value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleEyedropper = useCallback(async () => {
    if (disabled || typeof window === 'undefined' || !window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      if (result?.sRGBHex) onChange(result.sRGBHex.toUpperCase());
    } catch {
      /* dismissed */
    }
  }, [disabled, onChange]);

  const handlePaletteClick = useCallback(
    (hex) => {
      onChange(hex.toUpperCase());
    },
    [onChange]
  );

  return (
    <div className="advanced-color-picker" ref={rootRef}>
      <div className="advanced-color-picker__trigger-row">
        <button
          type="button"
          className="advanced-color-picker__swatch-btn"
          style={{ backgroundColor: pickerHex }}
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`${ariaLabel} — open picker`}
        />
        <div className="advanced-color-picker__hex-wrap">
          <input
            id={id}
            type="text"
            className="advanced-color-picker__hex-input"
            value={formatHexDisplay(value)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || v === '#') {
                onChange('#');
                return;
              }
              const next = v.startsWith('#') ? v : `#${v}`;
              onChange(next.slice(0, 7).toUpperCase());
            }}
            onBlur={() =>
              onChange(HEX_RE.test(value) ? value.toUpperCase() : pickerHex.toUpperCase())
            }
            maxLength={7}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            aria-label="Hex color code"
          />
        </div>
        <button
          type="button"
          className="advanced-color-picker__chevron-btn"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          aria-label="Toggle color picker"
        >
          <ChevronDown
            size={18}
            className="advanced-color-picker__chevron"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <MotionDiv
            className="advanced-color-picker__popover"
            role="dialog"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="advanced-color-picker__tabs"
              role="tablist"
              aria-label="Color picker mode"
            >
              <button
                type="button"
                role="tab"
                id="color-tab-solid"
                aria-selected={activeTab === TAB_SOLID}
                aria-controls="color-panel-solid"
                className={`advanced-color-picker__tab ${activeTab === TAB_SOLID ? 'advanced-color-picker__tab--active' : ''}`}
                onClick={() => setActiveTab(TAB_SOLID)}
              >
                Solid Color
              </button>
              <button
                type="button"
                role="tab"
                id="color-tab-quick"
                aria-selected={activeTab === TAB_QUICK}
                aria-controls="color-panel-quick"
                className={`advanced-color-picker__tab ${activeTab === TAB_QUICK ? 'advanced-color-picker__tab--active' : ''}`}
                onClick={() => setActiveTab(TAB_QUICK)}
              >
                Màu đồng nhất
              </button>
            </div>

            <div className="advanced-color-picker__panel-wrap">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === TAB_SOLID ? (
                  <MotionDiv
                    key="solid"
                    id="color-panel-solid"
                    role="tabpanel"
                    aria-labelledby="color-tab-solid"
                    className="advanced-color-picker__tab-panel"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="advanced-color-picker__tone-area">
                      <HexColorPicker
                        color={pickerHex}
                        onChange={(h) => onChange(h.toUpperCase())}
                      />
                    </div>
                  </MotionDiv>
                ) : (
                  <MotionDiv
                    key="quick"
                    id="color-panel-quick"
                    role="tabpanel"
                    aria-labelledby="color-tab-quick"
                    className="advanced-color-picker__tab-panel"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className="advanced-color-picker__palette advanced-color-picker__palette--quick"
                      role="group"
                      aria-label="Quick color presets"
                    >
                      {QUICK_PALETTE_15.map(({ hex, label }) => {
                        const active = hex.toLowerCase() === pickerHex;
                        return (
                          <button
                            key={hex}
                            type="button"
                            className={`advanced-color-picker__swatch ${active ? 'advanced-color-picker__swatch--active' : ''}`}
                            style={{ backgroundColor: hex }}
                            onClick={() => handlePaletteClick(hex)}
                            aria-label={label}
                            aria-pressed={active}
                            title={`${label} — ${hex}`}
                          >
                            {active && (
                              <Check
                                size={11}
                                strokeWidth={3}
                                className="advanced-color-picker__swatch-check"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            <div className="advanced-color-picker__footer-divider" role="separator" />

            <div className="advanced-color-picker__bottom-bar">
              <div className="advanced-color-picker__compound-field">
                <span
                  className="advanced-color-picker__compound-preview"
                  style={{
                    backgroundColor: HEX_RE.test(value) ? pickerHex : '#e5e7eb',
                  }}
                  aria-hidden
                />
                <input
                  type="text"
                  className="advanced-color-picker__compound-hex"
                  value={formatHexDisplay(value)}
                  placeholder="#006C51"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || v === '#') {
                      onChange('#');
                      return;
                    }
                    const next = v.startsWith('#') ? v : `#${v}`;
                    onChange(next.slice(0, 7).toUpperCase());
                  }}
                  onBlur={() =>
                    onChange(HEX_RE.test(value) ? value.toUpperCase() : pickerHex.toUpperCase())
                  }
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Hex color code in picker"
                />
              </div>
              <button
                type="button"
                className="advanced-color-picker__eyedropper"
                onClick={handleEyedropper}
                disabled={disabled || typeof window === 'undefined' || !window.EyeDropper}
                title={
                  typeof window !== 'undefined' && window.EyeDropper
                    ? 'Pick from screen'
                    : 'Not supported'
                }
                aria-label="Eyedropper"
              >
                <Pipette size={17} strokeWidth={2} />
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AlertTriangle, ArrowRight, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import '@/styles/DashboardCharts.css';

const EMPTY_COLOR = '#e5e7eb';

const safeList = (items) => (Array.isArray(items) ? items : []);
const safeNumber = (value) => Number(value || 0);

export function PipelineStackedBar({ title, subtitle, items = [] }) {
  const data = safeList(items);
  const total = data.reduce((sum, item) => sum + safeNumber(item.count), 0);

  return (
    <section className="dash-card dash-chart-card" aria-label={title}>
      <div className="dash-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <strong>{total.toLocaleString()}</strong>
      </div>

      <div className="pipeline-bar" role="img" aria-label={`${title}: ${total} tasks`}>
        {total > 0 ? data.map((item) => {
          const width = Math.max(3, (safeNumber(item.count) / total) * 100);
          return (
            <span
              key={item.status || item.label}
              style={{ width: `${width}%`, backgroundColor: item.color || EMPTY_COLOR }}
              title={`${item.label}: ${safeNumber(item.count).toLocaleString()}`}
            />
          );
        }) : <span style={{ width: '100%', backgroundColor: EMPTY_COLOR }} />}
      </div>

      <div className="pipeline-legend">
        {data.map((item) => (
          <div key={item.status || item.label} className="pipeline-legend__item">
            <i style={{ backgroundColor: item.color || EMPTY_COLOR }} />
            <span>{item.label}</span>
            <strong>{safeNumber(item.count).toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DonutMetric({ title, subtitle, items = [], centerLabel = 'Total' }) {
  const data = safeList(items);
  const total = data.reduce((sum, item) => sum + safeNumber(item.count), 0);
  let offset = 25;
  const circumference = 100;

  return (
    <section className="dash-card donut-card" aria-label={title}>
      <div className="dash-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="donut-card__body">
        <svg className="donut-chart" viewBox="0 0 42 42" role="img" aria-label={`${title}: ${total}`}>
          <circle className="donut-chart__track" cx="21" cy="21" r="15.9" />
          {total > 0 ? data.map((item) => {
            const value = (safeNumber(item.count) / total) * circumference;
            const segment = (
              <circle
                key={item.key || item.label}
                className="donut-chart__segment"
                cx="21"
                cy="21"
                r="15.9"
                stroke={item.color || EMPTY_COLOR}
                strokeDasharray={`${value} ${circumference - value}`}
                strokeDashoffset={offset}
              />
            );
            offset -= value;
            return segment;
          }) : null}
          <text x="21" y="19.5" textAnchor="middle" className="donut-chart__value">{total.toLocaleString()}</text>
          <text x="21" y="24" textAnchor="middle" className="donut-chart__label">{centerLabel}</text>
        </svg>
        <div className="donut-legend">
          {data.map((item) => (
            <div key={item.key || item.label}>
              <i style={{ backgroundColor: item.color || EMPTY_COLOR }} />
              <span>{item.label}</span>
              <strong>{safeNumber(item.count).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MiniBarList({ title, subtitle, items = [], valueKey = 'total', labelKey = 'name', metaKey }) {
  const data = safeList(items);
  const max = Math.max(1, ...data.map((item) => safeNumber(item[valueKey])));

  return (
    <section className="dash-card mini-bars" aria-label={title}>
      <div className="dash-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="mini-bars__list">
        {data.length > 0 ? data.map((item) => {
          const value = safeNumber(item[valueKey]);
          const label = item[labelKey] || item.email || item.title || 'Unknown';
          const meta = metaKey ? item[metaKey] : item.email;
          return (
            <div key={item.id || item.userId || label} className="mini-bar-row">
              <div className="mini-bar-row__top">
                <span>{label}</span>
                <strong>{value.toLocaleString()}</strong>
              </div>
              {meta && <small>{meta}</small>}
              <div className="mini-bar-row__track">
                <i style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
              </div>
            </div>
          );
        }) : (
          <div className="dashboard-empty">No data yet</div>
        )}
      </div>
    </section>
  );
}

export function AuditSparkline({ title, subtitle, points = [] }) {
  const data = safeList(points);
  const total = data.reduce((sum, point) => sum + safeNumber(point.count), 0);
  const max = Math.max(1, ...data.map((point) => safeNumber(point.count)));
  const width = 280;
  const height = 88;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const line = data.map((point, index) => {
    const x = index * step;
    const y = height - 10 - (safeNumber(point.count) / max) * 64;
    return `${x},${y}`;
  }).join(' ');

  return (
    <section className="dash-card spark-card" aria-label={title}>
      <div className="dash-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {total > 0 ? (
        <>
          <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${title}: ${total} audit events`}>
            <polyline points={line} fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((point, index) => {
              const x = index * step;
              const y = height - 10 - (safeNumber(point.count) / max) * 64;
              return <circle key={point.date || index} cx={x} cy={y} r="4" fill="#10b981" />;
            })}
          </svg>
          <div className="sparkline-labels">
            {data.map((point) => (
              <span key={point.date}>{formatDay(point.date)}</span>
            ))}
          </div>
        </>
      ) : (
        <div className="sparkline-empty" role="status">
          <Info size={18} />
          <strong>Chưa có dữ liệu log</strong>
          <span>Audit Activity sẽ tự hiển thị khi hệ thống ghi nhận sự kiện trong 7 ngày gần nhất.</span>
        </div>
      )}
    </section>
  );
}

export function AttentionQueue({ title = 'Attention Queue', subtitle, items = [], onNavigate }) {
  const data = safeList(items);

  return (
    <section className="dash-card attention-queue" aria-label={title}>
      <div className="dash-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="attention-queue__list">
        {data.map((item) => (
          <button
            type="button"
            key={item.id || item.title}
            className={`attention-row attention-row--${item.tone || 'info'}`}
            onClick={() => item.path && onNavigate?.(item.path)}
          >
            <span className="attention-row__icon">{iconForTone(item.tone)}</span>
            <span className="attention-row__content">
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <span className="attention-row__action">
              {item.action || 'Open'}
              <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function iconForTone(tone) {
  if (tone === 'danger') return <ShieldAlert size={18} />;
  if (tone === 'warning') return <AlertTriangle size={18} />;
  if (tone === 'success') return <CheckCircle2 size={18} />;
  return <Info size={18} />;
}

function formatDay(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { weekday: 'short' });
}

import { User, Folder, HardDrive, CheckCircle, Clock } from 'lucide-react';
import '@/styles/KpiCard.css';

const ICONS = {
  group: User,
  folder_managed: Folder,
  storage: HardDrive,
  assignment_turned_in: CheckCircle,
  clock: Clock,
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  compact = false,
  progress,
  progressLabel,
  dotColors = [],
}) {
  const IconComponent = ICONS[icon] || User;

  if (variant === 'wide' && progress !== undefined) {
    return (
      <div className="kpi-card kpi-card--wide">
        <div className="kpi-card__main">
          <p className="kpi-card__label">{title}</p>
          <p className="kpi-card__value">
            {value}
            {subtitle && <span className="kpi-card__subtitle">{subtitle}</span>}
          </p>
          <div className="kpi-card__progress">
            <div className="kpi-card__progress-bar">
              <div
                className="kpi-card__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progressLabel && (
              <span className="kpi-card__progress-label">{progressLabel}</span>
            )}
          </div>
        </div>
        <div className="kpi-card__decoration">
          <HardDrive size={48} />
        </div>
      </div>
    );
  }

  if (variant === 'activity') {
    return (
      <div className="kpi-card kpi-card--activity">
        <div className="kpi-card__content">
          <p className="kpi-card__label">{title}</p>
          <p className="kpi-card__value">{value}</p>
          <div className="kpi-card__dots">
            {dotColors.map((color, index) => (
              <div
                key={index}
                className="kpi-card__dot"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div className="kpi-card__bg-icon">
          <CheckCircle size={120} />
        </div>
      </div>
    );
  }

  return (
    <div className={`kpi-card kpi-card--summary kpi-card--variant-${variant} ${trend ? 'kpi-card--with-trend' : ''} ${compact ? 'kpi-card--compact' : ''}`}>
      <div className="kpi-card__header">
        <div className="kpi-card__icon">
          <IconComponent size={22} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className="kpi-card__trend">{trend}</span>
        )}
      </div>
      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{value}</p>
    </div>
  );
}

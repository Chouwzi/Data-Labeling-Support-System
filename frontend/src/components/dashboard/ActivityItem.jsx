import { CheckCircle, AlertTriangle, UserCheck, ChevronRight } from 'lucide-react';
import '@/styles/ActivityItem.css';

const ICONS = {
  check_circle: CheckCircle,
  warning: AlertTriangle,
  person_edit: UserCheck,
};

export default function ActivityItem({
  icon,
  iconBgClass,
  iconColorClass,
  message,
  timestamp,
  category,
}) {
  const IconComponent = ICONS[icon] || CheckCircle;

  return (
    <div className="activity-item">
      <div className={`activity-item__icon ${iconBgClass}`}>
        <IconComponent size={18} className={iconColorClass} />
      </div>
      <div className="activity-item__content">
        <p className="activity-item__message">{message}</p>
        <p className="activity-item__meta">{timestamp} • {category}</p>
      </div>
      <ChevronRight size={18} className="activity-item__arrow" />
    </div>
  );
}

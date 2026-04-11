import { Lightbulb, TrendingUp } from 'lucide-react';

const ANNOTATORS = [
  { initials: 'JS', name: 'Jordan S.', tasksPerDay: '48', colorClass: 'avatar--emerald' },
  { initials: 'ML', name: 'Maya L.', tasksPerDay: '36', colorClass: 'avatar--teal' },
  { initials: 'RP', name: 'Ray P.', tasksPerDay: '29', colorClass: 'avatar--sky' },
  { initials: 'AW', name: 'Alex W.', tasksPerDay: '22', colorClass: 'avatar--violet' },
];

/**
 * Right column (span 3): Tips + Top Annotators in one white shell (image_1).
 */
export default function ManagerRightPanel() {
  return (
    <div className="manager-aside-stack">
      <div className="tip-card">
        <p className="tip-card__label">Curator Tip</p>
        <h4 className="tip-card__title">High-priority review needed</h4>
        <p className="tip-card__description">
          Labels in &ldquo;Satellite Alpha&rdquo; need immediate validation to unblock the final batch.
        </p>
        <button type="button" className="tip-card__action">
          Review Queue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <Lightbulb size={96} className="tip-card__icon-bg" aria-hidden="true" />
      </div>

      <div className="manager-aside-stack__divider" role="presentation" />

      <section className="manager-aside-stack__annotators" aria-labelledby="top-annotators-heading">
        <div className="top-annotators-header">
          <TrendingUp size={16} className="top-annotators-header__icon" aria-hidden="true" />
          <h4 className="top-annotators-card__title" id="top-annotators-heading">
            Top Annotators
          </h4>
        </div>
        <div className="top-annotators-list">
          {ANNOTATORS.map((annotator) => (
            <div key={annotator.initials} className="top-annotator-item">
              <div className="top-annotator-item__left">
                <div className={`top-annotator-item__avatar ${annotator.colorClass}`}>
                  {annotator.initials}
                </div>
                <span className="top-annotator-item__name">{annotator.name}</span>
              </div>
              <div className="top-annotator-item__metric">
                <span className="top-annotator-item__count">{annotator.tasksPerDay}</span>
                <span className="top-annotator-item__unit">tasks/day</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

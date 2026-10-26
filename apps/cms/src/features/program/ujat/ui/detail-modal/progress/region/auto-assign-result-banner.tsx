import type { AutoAssignResultSummary } from './auto-assign-result'

export function RegionAutoAssignResultBanner({
  summary,
  onClose,
}: {
  summary: AutoAssignResultSummary
  onClose: () => void
}) {
  if (summary.warnings.length === 0) return null

  return (
    <div className="ujat-region-auto-assign-banner" role="status">
      <div className="ujat-region-auto-assign-banner__body">
        <strong className="ujat-region-auto-assign-banner__title">
          {summary.hasVolunteerShortage ? '봉사자 인원 부족' : '자동 배정 확인 필요'}
        </strong>
        {summary.lines.map(line => (
          <span key={line} className="ujat-region-auto-assign-banner__line">
            {line}
          </span>
        ))}
        <ul className="ujat-region-auto-assign-banner__warnings">
          {summary.warnings.map(warning => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className="ujat-region-auto-assign-banner__close"
        aria-label="자동 배정 결과 닫기"
        onClick={onClose}
      >
        닫기
      </button>
    </div>
  )
}

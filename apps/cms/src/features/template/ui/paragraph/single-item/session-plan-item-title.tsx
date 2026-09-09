import { resolveSessionPlanItemTitleParts } from '@/features/template/lib/session-plan-item-label'
import { resolveLectureReportSessionItemTitle } from '@/features/template/lib/lecture-report-session-item-title'

export function SessionPlanItemTitle({
  label,
  titleHint,
  itemId,
  id,
}: {
  label: string
  titleHint?: string
  /** 강의보고서 등 시드 힌트 보정용 */
  itemId?: string
  id?: string
}) {
  const resolved =
    itemId != null
      ? resolveLectureReportSessionItemTitle({ id: itemId, label, titleHint })
      : { label, titleHint }
  const { main, hint } = resolveSessionPlanItemTitleParts({
    label: resolved.label,
    titleHint: resolved.titleHint,
  })

  return (
    <span className="session-plan-short-essay-block__title" id={id}>
      <span className="session-plan-short-essay-block__title-main">{main}</span>
      {hint != null && hint.length > 0 ? (
        <span className="session-plan-short-essay-block__title-hint"> {hint}</span>
      ) : null}
    </span>
  )
}

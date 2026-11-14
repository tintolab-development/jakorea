import { resolveSessionPlanItemTitleParts } from '@/features/template/lib/session-plan-item-label'
import { resolveLectureReportSessionItemTitle } from '@/features/template/lib/lecture-report-session-item-title'

export function SessionPlanItemTitle({
  label,
  titleHint,
  itemId,
  id,
  bullet = false,
}: {
  label: string
  titleHint?: string
  /** 강의보고서 등 시드 힌트 보정용 */
  itemId?: string
  id?: string
  /** 템플릿 관리 UJAT 교육계획서·교육일지 — 항목 머리에 「・」(시안 5767:44097) */
  bullet?: boolean
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
      <span className="session-plan-short-essay-block__title-main">
        {bullet && main ? `・${main}` : main}
      </span>
      {hint != null && hint.length > 0 ? (
        <span className="session-plan-short-essay-block__title-hint"> {hint}</span>
      ) : null}
    </span>
  )
}

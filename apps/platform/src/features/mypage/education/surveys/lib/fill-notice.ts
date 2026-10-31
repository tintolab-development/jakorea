import type { EducationSurveySeedKind } from './seed-survey-draft'
import type { EducationSurveyListStatus } from './survey-list-types'
import type { PortalFormSubmissionPeriodBlockReason } from './portal-form-submission-period'

export type EducationSurveyFillNotice =
  | { type: 'submitted' }
  | { type: 'period'; reason: PortalFormSubmissionPeriodBlockReason }
  | { type: 'none' }

/**
 * 설문·만족도 탭 — 제출 완료 / 기간 차단 / 양식 본문 표시 여부 판정.
 * - 이미 제출이고 재작성 불가 → 제출 완료 UI (render 200이어도)
 * - render 200이면 기간 종료 전면 화면 대신 양식(읽기)을 보여 준다.
 * - 기간 전면 안내는 목록 기간 필드만 사용한다. render 409는 쓰지 않는다.
 */
export function resolveEducationSurveyFillNotice(options: {
  kind: EducationSurveySeedKind
  status: EducationSurveyListStatus | undefined
  periodBlockReason: PortalFormSubmissionPeriodBlockReason | null
  /** remote form document를 읽어 본문을 그릴 수 있는지 */
  canShowFormBody: boolean
  /** forms `canSubmit` / `canResubmit` (만족도는 capabilities와 AND) */
  canWrite?: boolean
}): EducationSurveyFillNotice {
  if (options.status === 'submitted' && options.canWrite !== true) {
    return { type: 'submitted' }
  }
  if (options.canShowFormBody) {
    return { type: 'none' }
  }
  if (options.periodBlockReason != null) {
    return { type: 'period', reason: options.periodBlockReason }
  }
  return { type: 'none' }
}

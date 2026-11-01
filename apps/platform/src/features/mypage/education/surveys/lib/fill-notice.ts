import type { EducationSurveySeedKind } from './seed-survey-draft'
import type { EducationSurveyListStatus } from './survey-list-types'
import type { PortalFormSubmissionPeriodBlockReason } from './portal-form-submission-period'

export type EducationSurveyFillNotice =
  | { type: 'submitted' }
  | { type: 'period'; reason: PortalFormSubmissionPeriodBlockReason }
  | { type: 'none' }

/**
 * 설문·만족도 탭 — 제출 완료 / 기간 차단 / 양식 본문 표시 여부 판정.
 * - 이미 제출이고 다시 작성을 누르지 않았으면 제출 완료 UI (재작성 가능 여부와 무관)
 * - 다시 작성을 누르면 기존 답변이 채워진 양식을 보여 준다(서버 요청 없음)
 * - 작성 시작 전(`not_started`)은 render 200이어도 본문을 열지 않는다.
 * - 기간 종료(`closed`)이고 render 200이면 전면 안내 대신 양식(읽기)을 보여 준다.
 * - 그 외 기간 전면 안내는 목록 기간 필드만 사용한다. render 409는 쓰지 않는다.
 */
export function resolveEducationSurveyFillNotice(options: {
  kind: EducationSurveySeedKind
  status: EducationSurveyListStatus | undefined
  periodBlockReason: PortalFormSubmissionPeriodBlockReason | null
  /** remote form document를 읽어 본문을 그릴 수 있는지 */
  canShowFormBody: boolean
  /** forms `canSubmit` / `canResubmit` (만족도는 capabilities와 AND) */
  canWrite?: boolean
  /** 제출 완료 화면에서 [다시 작성하기]를 누른 경우 */
  rewriteRequested?: boolean
}): EducationSurveyFillNotice {
  if (options.status === 'submitted' && !options.rewriteRequested) {
    return { type: 'submitted' }
  }
  if (options.periodBlockReason === 'not_started') {
    return { type: 'period', reason: 'not_started' }
  }
  if (options.canShowFormBody) {
    return { type: 'none' }
  }
  if (options.periodBlockReason != null) {
    return { type: 'period', reason: options.periodBlockReason }
  }
  return { type: 'none' }
}

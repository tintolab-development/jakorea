import dayjs from 'dayjs'
import type { ApplicantInstructorApplicationInfoData } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-application-info'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'

type TrainingSchedulePick = Pick<
  GeminiApprovedTrainingDetail,
  | 'officialDocumentRequired'
  | 'officialDocumentRequiredInfo'
  | 'institutionName'
  | 'trainingDate'
  | 'trainingTimeText'
>

/**
 * 강사 신청 상세 「강의 진행 가능 일정」 — `[기관명] : YYYY년 M월 D일 (HH:mm ~ HH:mm)`.
 * 승인 연수 상세 GET의 확정 연수일(trainingDate)을 우선하고, 없으면 강사 신청 상세 GET의
 * 신청 일정(availableScheduleSlots → preferredScheduleSlots) 첫 일정의 날짜·시각을 쓴다.
 * 둘 다 없으면 기관명만 남는다(값을 지어내지 않는다).
 */
export function buildGeminiInstructorApplicationInfo(
  training: TrainingSchedulePick,
  application: Pick<ApplicantInstructorRow, 'preferredScheduleSlots'> | null | undefined
): ApplicantInstructorApplicationInfoData {
  const base: ApplicantInstructorApplicationInfoData = {
    officialDocumentRequired: training.officialDocumentRequired,
    officialDocumentRequiredInfo: training.officialDocumentRequiredInfo,
    institutionName: training.institutionName,
    trainingDate: training.trainingDate,
    trainingTimeText: training.trainingTimeText,
  }
  if (training.trainingDate.trim()) return base

  const slot = application?.preferredScheduleSlots?.find(item => item.startAt?.trim())
  const start = slot?.startAt ? dayjs(slot.startAt) : null
  if (!start?.isValid()) return base

  const end = slot?.endAt ? dayjs(slot.endAt) : null
  const startClock = start.format('HH:mm')
  const endClock = end?.isValid() ? end.format('HH:mm') : ''
  return {
    ...base,
    trainingDate: start.format('YYYY-MM-DD'),
    trainingTimeText: endClock && endClock !== startClock ? `${startClock} ~ ${endClock}` : startClock,
  }
}

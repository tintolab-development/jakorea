/**
 * Gemini 찾아가는 연수 모집 공고 편집값 → Portal 상세 응답 형태.
 * 필드 대응은 `mapGeminiRecruitmentSnapshotToCreateRequest`와 같다.
 */

import type { PortalProgramDetail } from '@jakorea/domain/portal/program-detail'
import {
  toPortalDateTime,
  toPortalOperationMethod,
  toPortalProgramId,
  trimmedOrUndefined,
} from '@/features/program/shared/lib/platform-preview/portal-fields'
import type { GeminiRecruitmentAddFormSnapshot } from './add-local-save'

/** Portal 공개 programType SSOT — Admin·Portal 런타임과 동일 */
const PORTAL_GEMINI_PROGRAM_TYPE = 'GEMINI_TRAINING'

export function buildGeminiRecruitmentPortalPreview(
  snapshot: GeminiRecruitmentAddFormSnapshot,
  options?: { programId?: string | number }
): PortalProgramDetail {
  const startAt = toPortalDateTime(snapshot.applicationPeriodStart)
  const endAt = toPortalDateTime(snapshot.applicationPeriodEnd)
  const trainingStart = toPortalDateTime(snapshot.trainingRequestPeriodStart)
  const trainingEnd = toPortalDateTime(snapshot.trainingRequestPeriodEnd)
  const businessStartDate =
    startAt && trainingStart
      ? startAt <= trainingStart
        ? startAt
        : trainingStart
      : trainingStart ?? startAt
  const businessEndDate =
    endAt && trainingEnd
      ? endAt >= trainingEnd
        ? endAt
        : trainingEnd
      : trainingEnd ?? endAt
  return {
    programId: toPortalProgramId(options?.programId),
    programType: PORTAL_GEMINI_PROGRAM_TYPE,
    title: trimmedOrUndefined(snapshot.title) ?? '(공고명 없음)',
    summary: trimmedOrUndefined(snapshot.programDescription),
    operationMethod: toPortalOperationMethod(snapshot.educationForm),
    businessStartDate,
    businessEndDate,
    trainingRequestStartDate: toPortalDateTime(snapshot.trainingRequestPeriodStart),
    trainingRequestEndDate: toPortalDateTime(snapshot.trainingRequestPeriodEnd),
    minStudentCount: snapshot.minStudentCount,
    totalParticipants: snapshot.minStudentCount,
    applicationTargetMode: 'ORGANIZATION',
    contactName: trimmedOrUndefined(snapshot.inquiryContactName),
    contactPhone: trimmedOrUndefined(snapshot.inquiryTel),
    contactEmail: trimmedOrUndefined(snapshot.inquiryEmail),
    additionalContentHtml: trimmedOrUndefined(snapshot.additionalContentMarkdown),
    recruitmentGuide: trimmedOrUndefined(snapshot.recruitmentGuide),
    learningSupportContent: trimmedOrUndefined(snapshot.learningSupportContent),
    otherMatters: snapshot.notesNotApplicable ? undefined : trimmedOrUndefined(snapshot.notes),
    applicationMethod: trimmedOrUndefined(snapshot.applicationMethod) ?? null,
    educationTargets: snapshot.educationTargetLevels.length
      ? [...snapshot.educationTargetLevels]
      : undefined,
    recruitmentTargetDetail: trimmedOrUndefined(snapshot.educationTargetDetail),
    recruitments: [
      { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION', startAt, endAt },
    ],
  }
}

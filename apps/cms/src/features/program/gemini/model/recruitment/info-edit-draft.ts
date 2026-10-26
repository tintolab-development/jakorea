import dayjs, { type Dayjs } from 'dayjs'
import { GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE } from '../../lib/recruitment/add-form-options'
import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import type { GeminiRecruitmentDetail, GeminiRecruitmentDetailFields } from './detail-types'

export type GeminiRecruitmentInfoEditDraft = GeminiRecruitmentDetailFields & {
  title: string
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
}

export function detailToInfoEditDraft(detail: GeminiRecruitmentDetail): GeminiRecruitmentInfoEditDraft {
  const {
    id: _id,
    displayNo: _displayNo,
    isDraft: _isDraft,
    createdAt: _createdAt,
    createdByName: _createdByName,
    updatedAt: _updatedAt,
    updatedByName: _updatedByName,
    ...draft
  } = detail
  return {
    ...draft,
    educationTargetLevels: [...detail.educationTargetLevels],
    attachmentFileNames: [...detail.attachmentFileNames],
  }
}

export function detailToAddFormSnapshot(detail: GeminiRecruitmentDetail): GeminiRecruitmentAddFormSnapshot {
  return {
    ...detailToInfoEditDraft(detail),
    educationStructure:
      detail.educationStructure ?? GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
    institutionSectionDescription: '',
    detailSectionDescription: '',
  }
}

export function addSnapshotToInfoEditDraft(
  snapshot: GeminiRecruitmentAddFormSnapshot
): GeminiRecruitmentInfoEditDraft {
  return {
    title: snapshot.title,
    announcementPublished: snapshot.announcementPublished,
    educationTargetLevels: [...snapshot.educationTargetLevels],
    educationTargetDetail: snapshot.educationTargetDetail,
    applicationPeriodStart: snapshot.applicationPeriodStart ?? '',
    applicationPeriodEnd: snapshot.applicationPeriodEnd ?? '',
    trainingRequestPeriodStart: snapshot.trainingRequestPeriodStart ?? '',
    trainingRequestPeriodEnd: snapshot.trainingRequestPeriodEnd ?? '',
    minStudentCount: snapshot.minStudentCount,
    educationForm: snapshot.educationForm,
    educationStructure: snapshot.educationStructure,
    inquiryContactName: snapshot.inquiryContactName,
    inquiryTel: snapshot.inquiryTel,
    inquiryEmail: snapshot.inquiryEmail,
    notesNotApplicable: snapshot.notesNotApplicable,
    notes: snapshot.notes,
    thumbnailFileName: snapshot.thumbnailFileName,
    thumbnailFileObjectId: snapshot.thumbnailFileObjectId,
    programDescription: snapshot.programDescription,
    recruitmentGuide: snapshot.recruitmentGuide,
    applicationMethod: snapshot.applicationMethod,
    learningSupportContent: snapshot.learningSupportContent,
    additionalContentMarkdown: snapshot.additionalContentMarkdown,
    attachmentFileNames: [...snapshot.attachmentFileNames],
  }
}

export function applyInfoEditDraft(
  detail: GeminiRecruitmentDetail,
  draft: GeminiRecruitmentInfoEditDraft
): GeminiRecruitmentDetail {
  return {
    ...detail,
    ...draft,
    educationTargetLevels: [...draft.educationTargetLevels],
    attachmentFileNames: [...draft.attachmentFileNames],
    updatedAt: dayjs().toISOString(),
  }
}

export function toDateRangeValue(start: string, end: string): [Dayjs, Dayjs] | null {
  const a = dayjs(start)
  const b = dayjs(end)
  if (!a.isValid() || !b.isValid()) return null
  return [a, b]
}

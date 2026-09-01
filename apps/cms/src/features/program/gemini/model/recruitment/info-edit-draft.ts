import dayjs, { type Dayjs } from 'dayjs'
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
    institutionSectionDescription: '',
    detailSectionDescription: '',
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

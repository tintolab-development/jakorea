import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  resolveRecruitmentStatus,
  resolveRecruitmentUserPagePublicationState,
} from '../../lib/recruitment/resolve-status'
import { getGeminiRecruitmentRowsSnapshot } from './recruitment-store'
import type { GeminiRecruitmentDetail } from './detail-types'
import type { GeminiRecruitmentRow } from './types'

const runtimeDetailPatches = new Map<string, Partial<GeminiRecruitmentDetail>>()

function deriveAnnouncementPublished(
  row: GeminiRecruitmentRow,
  referenceDate: Dayjs
): ParticipantRecruitmentAnnouncementPublishedValue {
  if (row.isDraft) return 'unpublished'
  const status = resolveRecruitmentStatus(
    row.applicationPeriodStart,
    row.applicationPeriodEnd,
    referenceDate
  )
  return status === 'SCHEDULED' ? 'unpublished' : 'published'
}

function buildDefaultOverlay(
  row: GeminiRecruitmentRow,
  referenceDate: Dayjs
): Omit<
  GeminiRecruitmentDetail,
  keyof GeminiRecruitmentRow | 'id' | 'displayNo' | 'title' | 'isDraft'
> {
  const now = dayjs().toISOString()
  return {
    createdAt: now,
    createdByName: '관리자',
    updatedAt: now,
    updatedByName: '관리자',
    announcementPublished: deriveAnnouncementPublished(row, referenceDate),
    educationTargetLevels: [],
    educationTargetDetail: '',
    minStudentCount: 15,
    educationForm: 'online',
    inquiryContactName: '',
    inquiryTel: '',
    inquiryEmail: '',
    notesNotApplicable: false,
    notes: '',
    thumbnailFileName: null,
    programDescription: '',
    recruitmentGuide: '',
    applicationMethod: '',
    learningSupportContent: '',
    additionalContentMarkdown: '',
    attachmentFileNames: [],
  }
}

/** API 연동 전 — 상세 정보 수정 저장(mock 세션 유지) */
export function patchRecruitmentDetail(
  id: string,
  patch: Partial<GeminiRecruitmentDetail>
): void {
  const prev = runtimeDetailPatches.get(id) ?? {}
  runtimeDetailPatches.set(id, { ...prev, ...patch })
}

export function getRecruitmentDetailById(
  id: string,
  referenceDate: Dayjs | string = dayjs()
): GeminiRecruitmentDetail | null {
  const ref = typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate
  const row = getGeminiRecruitmentRowsSnapshot().find(r => r.id === id)
  if (!row || row.isDraft) return null

  const overlay = buildDefaultOverlay(row, ref)

  const base: GeminiRecruitmentDetail = {
    ...row,
    ...overlay,
    title: row.title,
    applicationPeriodStart: row.applicationPeriodStart,
    applicationPeriodEnd: row.applicationPeriodEnd,
    trainingRequestPeriodStart: row.trainingRequestPeriodStart,
    trainingRequestPeriodEnd: row.trainingRequestPeriodEnd,
  }
  const patch = runtimeDetailPatches.get(id)
  return patch != null ? { ...base, ...patch } : base
}

export function getRecruitmentUserPagePublicationStateForRow(
  row: Pick<GeminiRecruitmentRow, 'isDraft' | 'applicationPeriodStart' | 'applicationPeriodEnd'>,
  referenceDate: Dayjs | string = dayjs()
) {
  if (row.isDraft) return 'unpublished' as const
  const status = resolveRecruitmentStatus(
    row.applicationPeriodStart,
    row.applicationPeriodEnd,
    referenceDate
  )
  return resolveRecruitmentUserPagePublicationState(status)
}

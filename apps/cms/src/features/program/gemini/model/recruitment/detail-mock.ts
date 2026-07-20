import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  resolveRecruitmentStatus,
  resolveRecruitmentUserPagePublicationState,
} from '../../lib/recruitment/resolve-status'
import { getGeminiRecruitmentRowsSnapshot } from './recruitment-store'
import type { GeminiRecruitmentDetail, GeminiRecruitmentDetailFields } from './detail-types'
import type { GeminiRecruitmentRow } from './types'

const PROGRAM_DESCRIPTION = `JA Korea는 청소년들이 경제, 기업가정신, 금융, 직업에 대한 이해를 높이고, 미래 사회에 필요한 역량을 키울 수 있도록 다양한 교육 프로그램을 운영하고 있습니다.

이번 프로그램은 Google for Education과 JA Korea가 함께하는 Gemini Academy 찾아가는 연수로, 학교 현장에서 AI 활용 교육 역량을 강화하고 실습 중심의 연수를 제공합니다.`

const RECRUITMENT_GUIDE = `1. 연수 일정 : 2025년 8월 1일(금) ~ 12월 19일(금)
2. 교육 대상 : 특성화고등학교 3학년
3. 연수 내용 : AI 활용 교육 역량 강화 및 Gemini 기반 실습 중심 연수
4. 연수 방법 : Zoom 온라인 연수
5. 혜택 : 무료 교육 과정 제공, 간식 제공`

const ADDITIONAL_CONTENT_HTML = `<p>준비물 안내</p><ul><li>PC 또는 노트북</li><li>조용한 공간</li><li>교복 또는 단정한 복장</li><li>필기구</li></ul><p>신청 마감일까지 접수해 주세요.</p>`

const SCREENSHOT_DETAIL_FIELDS: GeminiRecruitmentDetailFields = {
  announcementPublished: 'published',
  educationTargetLevels: ['adult'],
  educationTargetDetail: '특성화고등학교 3학년',
  minStudentCount: 15,
  educationForm: 'offline',
  inquiryContactName: 'JA Korea',
  inquiryTel: '02-6085-6028',
  inquiryEmail: 'cc@jakorea.org',
  notesNotApplicable: true,
  notes: '',
  thumbnailFileName: '2026_한국씨티은행-JA Korea 특별한 JOB담 참가자 모집_cover.jpg',
  programDescription: PROGRAM_DESCRIPTION,
  recruitmentGuide: RECRUITMENT_GUIDE,
  applicationMethod: '',
  learningSupportContent: '',
  additionalContentMarkdown: ADDITIONAL_CONTENT_HTML,
  attachmentFileNames: [
    '2026_Gemini_Academy_찾아가는연수_안내.pdf',
    '2026_Gemini_Academy_신청서.hwp',
  ],
}

const DETAIL_OVERLAY: Record<
  string,
  Pick<GeminiRecruitmentDetail, 'createdAt' | 'createdByName' | 'updatedAt' | 'updatedByName'> &
    GeminiRecruitmentDetailFields
> = {
  'gvt-recruitment-scheduled': {
    createdAt: '2025-12-08T09:15:00',
    createdByName: '홍길동',
    updatedAt: '2025-12-08T17:55:00',
    updatedByName: '이순신',
    ...SCREENSHOT_DETAIL_FIELDS,
  },
  'gvt-recruitment-in-progress': {
    createdAt: '2025-12-08T09:15:00',
    createdByName: '홍길동',
    updatedAt: '2025-12-08T17:55:00',
    updatedByName: '이순신',
    ...SCREENSHOT_DETAIL_FIELDS,
  },
  'gvt-recruitment-ended': {
    createdAt: '2025-11-01T10:00:00',
    createdByName: '홍길동',
    updatedAt: '2025-11-28T16:40:00',
    updatedByName: '이순신',
    ...SCREENSHOT_DETAIL_FIELDS,
    announcementPublished: 'published',
  },
}

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

  const knownOverlay = DETAIL_OVERLAY[id]
  const overlay = knownOverlay
    ? {
        ...knownOverlay,
        announcementPublished: deriveAnnouncementPublished(row, ref),
      }
    : buildDefaultOverlay(row, ref)

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

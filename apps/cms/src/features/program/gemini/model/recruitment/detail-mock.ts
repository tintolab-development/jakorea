import dayjs, { type Dayjs } from 'dayjs'
import { createRecruitmentMockRows } from './mock'
import type { GeminiRecruitmentDetail } from './detail-types'

const TRAINING_CONTENT = `안녕하세요, JA Korea입니다.
2025년 Google for Education & JA Korea Gemini Academy 찾아가는 연수를 아래와 같이 안내드립니다.

1. 연수 기간 : 2025년 8월 1일(금) ~ 12월 19일(금)
2. 신청 기간 : 2025년 11월 12일(금)까지
3. 연수 내용
- AI 활용 교육 역량 강화 및 Gemini 기반 실습 중심 연수
- 학교 현장 적용을 위한 수업 설계·평가 방법 안내
- 학생의 비판적 사고력·창의적 문제 해결 역량 함양을 위한 교육 프로그램
4. 연수 진행 절차
- 온라인 신청서 제출 → 강사 배정 → 일정 확정 → 현장 연수 진행
5. 문의 : gfc@jakorea.org (평일 10:00 ~ 17:00)

감사합니다.
JA Korea 드림`

const DETAIL_OVERLAY: Record<
  string,
  Pick<
    GeminiRecruitmentDetail,
    | 'createdAt'
    | 'createdByName'
    | 'updatedAt'
    | 'updatedByName'
    | 'announcementPublished'
    | 'minStudentCount'
    | 'trainingContent'
  >
> = {
  'gvt-recruitment-scheduled': {
    createdAt: '2025-12-08T09:15:00',
    createdByName: '홍길동',
    updatedAt: '2025-12-08T17:55:00',
    updatedByName: '이순신',
    announcementPublished: 'unpublished',
    minStudentCount: 15,
    trainingContent: TRAINING_CONTENT,
  },
  'gvt-recruitment-in-progress': {
    createdAt: '2025-12-08T09:15:00',
    createdByName: '홍길동',
    updatedAt: '2025-12-08T17:55:00',
    updatedByName: '이순신',
    announcementPublished: 'published',
    minStudentCount: 15,
    trainingContent: TRAINING_CONTENT,
  },
  'gvt-recruitment-ended': {
    createdAt: '2025-11-01T10:00:00',
    createdByName: '홍길동',
    updatedAt: '2025-11-28T16:40:00',
    updatedByName: '이순신',
    announcementPublished: 'published',
    minStudentCount: 15,
    trainingContent: TRAINING_CONTENT,
  },
}

const runtimeDetailPatches = new Map<string, Partial<GeminiRecruitmentDetail>>()

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
  const row = createRecruitmentMockRows(referenceDate).find(r => r.id === id)
  const overlay = DETAIL_OVERLAY[id]
  if (!row || !overlay) return null
  const base = { ...row, ...overlay }
  const patch = runtimeDetailPatches.get(id)
  return patch != null ? { ...base, ...patch } : base
}

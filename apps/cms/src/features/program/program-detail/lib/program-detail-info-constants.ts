/**
 * 프로그램 상세 정보 탭 - 상수, 라벨 맵, 날짜 포맷 유틸
 */

import dayjs from 'dayjs'
import type { DateValue } from '@/types'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  getProgramLifecycleLabel,
  PROGRAM_LIFECYCLE_STATUS_SELECT_ORDER,
} from '@/shared/constants/status'

// ─── 요일/날짜 포맷 ────────────────────────────────────────

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "2026. 02. 08 (일) 09:15" */
export function formatDate(d: DateValue | undefined): string {
  if (!d) return '-'
  const parsed = dayjs(d)
  return `${parsed.format('YYYY. MM. DD')} (${WEEKDAYS[parsed.day()]}) ${parsed.format('HH:mm')}`
}

/** "2026. 04. 03 (금)" */
export function formatDateOnly(d: DateValue | undefined): string {
  if (!d) return '-'
  const parsed = dayjs(d)
  return `${parsed.format('YYYY. MM. DD')} (${WEEKDAYS[parsed.day()]})`
}

export function formatDateRange(start: DateValue | undefined, end: DateValue | undefined): string {
  if (!start || !end) return '-'
  return `${formatDateOnly(start)} ~ ${formatDateOnly(end)}`
}

// ─── 모집 상태 ─────────────────────────────────────────────

/** 모집 기간 기준 상태 (날짜 없으면 null, 목록·상세 공통) */
export function getRecruitmentStatus(
  program: Program
): 'scheduled' | 'recruiting' | 'closed' | null {
  const start = program.applicationStartDate
  const end = program.applicationEndDate
  if (!start || !end) return null
  const now = dayjs()
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  if (!startDate.isValid() || !endDate.isValid()) return null
  if (now.isBefore(startDate, 'day')) return 'scheduled'
  if (!now.isBefore(startDate, 'day') && !now.isAfter(endDate, 'day')) return 'recruiting'
  return 'closed'
}

/** 신청 기간 기준 참여자(수강자) 모집 현황 → lifecycle 키 (td 색상·라벨: 참여자 정보 탭·공통 정보 공통) */
export const PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'planned',
  recruiting: 'recruiting_students',
  closed: 'matching_completed',
}

/** `getRecruitmentStatus` 결과를 lifecycle로 변환 (날짜 오버라이드는 수정 모드 폼 연동용) */
export function getParticipantRecruitmentLifecycle(
  program: Program,
  overrides?: Pick<Program, 'applicationStartDate' | 'applicationEndDate'>
): ProgramLifecycleStatus | null {
  const effective = overrides ? { ...program, ...overrides } : program
  const s = getRecruitmentStatus(effective)
  if (s == null) return null
  return PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE[s]
}

/** @deprecated getRecruitmentStatus 사용 (null 처리 통일) */
export function getRecruitmentStatusValue(program: Program): 'scheduled' | 'recruiting' | 'closed' {
  const v = getRecruitmentStatus(program)
  return v ?? 'scheduled'
}

export const RECRUITMENT_RADIO_OPTIONS = [
  { value: 'scheduled', label: '모집 예정' },
  { value: 'recruiting', label: '모집 중' },
  { value: 'closed', label: '모집 마감' },
]

/** 강사 모집 대상 옵션 (강사 정보 탭) */
export const INSTRUCTOR_TARGET_OPTIONS = [
  { value: '성인', label: '성인' },
  { value: '대학생', label: '대학생' },
  { value: '기타', label: '기타' },
]

/** 2차 면접 심사 방법 옵션 */
export const INTERVIEW_METHOD_OPTIONS = [
  { value: '온라인', label: '온라인' },
  { value: '오프라인', label: '오프라인' },
  { value: '온/오프라인', label: '온/오프라인' },
]

export function getRecruitmentStatusLabel(program: Program): string {
  const v = getRecruitmentStatusValue(program)
  const opt = RECRUITMENT_RADIO_OPTIONS.find(o => o.value === v)
  return opt?.label ?? '-'
}

/** 강사 모집 현황: lifecycleStatus를 모집 예정/모집 중/모집 마감 세 가지로 매핑 (RecruitmentStatusBadge 공통) */
export function getInstructorRecruitmentStatus(
  program: Program
): 'scheduled' | 'recruiting' | 'closed' | null {
  const status = program.lifecycleStatus
  if (!status) return null
  if (status === 'recruiting_instructors') return 'recruiting'
  if (status === 'planned' || status === 'recruiting_students') return 'scheduled'
  return 'closed'
}

/** 봉사자 모집 현황: lifecycleStatus를 모집 예정/모집 중/모집 마감 세 가지로 매핑 */
export function getVolunteerRecruitmentStatus(
  program: Program
): 'scheduled' | 'recruiting' | 'closed' | null {
  const status = program.lifecycleStatus
  if (!status) return null
  if (status === 'recruiting_volunteers') return 'recruiting'
  if (
    status === 'volunteer_recruitment_planned' ||
    status === 'planned' ||
    status === 'recruiting_students'
  )
    return 'scheduled'
  return 'closed'
}

// ─── 라벨 맵 ──────────────────────────────────────────────

export const CATEGORY_LABEL: Record<string, string> = {
  school: '학교/기관',
  individual: '개인',
}

export const CATEGORY_OPTIONS = [
  { value: 'school', label: '학교/기관' },
  { value: 'individual', label: '개인' },
]

export const BUSINESS_AREA_OPTIONS = [
  { value: '기업가정신', label: '기업가정신' },
  { value: '경제', label: '경제' },
  { value: '진로', label: '진로' },
  { value: '기타', label: '기타' },
]

export const TYPE_LABEL: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}

/** 봉사자 모집 대상 옵션 */
export const VOLUNTEER_TARGET_OPTIONS = [
  { value: '대학(원)생', label: '대학(원)생' },
  { value: '일반인', label: '일반인' },
  { value: '기타', label: '기타' },
]

export const TARGET_LEVEL_LABEL: Record<string, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학(원)생',
  adult: '성인',
}

export const LIFECYCLE_OPTIONS = PROGRAM_LIFECYCLE_STATUS_SELECT_ORDER.map(status => ({
  value: status,
  label: getProgramLifecycleLabel(status),
}))

// ─── 공통 정보 탭 전용 옵션 ─────────────────────────────────────

export const TEAM_DIVISION_OPTIONS = [
  { value: 'C&D', label: 'C&D' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: '기타', label: '기타' },
]

export const EDUCATION_PROCESS_OPTIONS = [
  { value: 'Traditional (Paper)', label: 'Traditional (Paper)' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: '기타', label: '기타' },
]

export const IP_OWNED_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Joint', label: 'Joint' },
]

export const COURSE_DELIVERED_BY_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Jointly', label: 'Jointly' },
  { value: 'Partner', label: 'Partner' },
]

export const PARTNER_INVOLVEMENT_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
]

export const IPS_OPTIONS = [
  { value: 'Inspire', label: 'Inspire' },
  { value: 'Prepare', label: 'Prepare' },
  { value: 'Succeed', label: 'Succeed' },
]

export const PROGRAM_CATEGORY_OPTIONS = [
  { value: '자격증 수여 (Credential)', label: '자격증 수여 (Credential)' },
  { value: '수료증', label: '수료증' },
  { value: '기타', label: '기타' },
]

export const PROGRAM_CHANNEL_OPTIONS = [
  { value: '다운받을 자료 (Downloaded resource)', label: '다운받을 자료 (Downloaded resource)' },
  { value: '온라인 플랫폼', label: '온라인 플랫폼' },
  { value: '대면', label: '대면' },
  { value: '기타', label: '기타' },
]

// ─── 기본 콘텐츠 (시안 placeholder) ────────────────────────

export const DEFAULT_PROGRAM_DESCRIPTION = `제이에이코리아(JA Korea)는 매년 지역별 대학생 봉사단과 함께 초등학생 대상 경제교육을 무료로 진행하고 있습니다. 대학생 봉사단원이 학교를 방문하여 재미있는 경제교육 수업을 진행하며, 교재·교구 등 학습에 필요한 자료를 무료로 제공합니다.

많은 관심과 신청 부탁드립니다.`

export const DEFAULT_RECRUITMENT_GUIDE = `1. 금요일 오전 1~4교시 중 4회 수업 진행
2. 2026학년도 1학기(4~6월) 또는 2학기(9~11월) 중 운영
3. 학교당 최소 4학급 이상 신청
4. 학급당 대학생 2명 배치, 대면 교육 진행
5. 1교당 여러 학년 신청 가능 (1회 신청으로 처리)`

export const DEFAULT_LEARNING_SUPPORT = `선정된 학교에 한하여 다음과 같이 지원 예정

· 초등학생 대상 학급별 대면 교육
· 경제교육 교재·교구 제공
· 대학생경제교육봉사단 파견`

export const DEFAULT_ADDITIONAL_HTML = `<p><strong>프로그램 운영 협조사항</strong></p>
<ol>
<li>프로그램 일정확인 및 소통안내<br>대표 담당교사와 소통이 진행 되오니 꼭 지정하여 신청해주시기 바랍니다.</li>
<li>JA Korea 대학생경제교육봉사단 운영관련
<ul>
<li>공문 필요 시 사전 요청 필요</li>
<li>봉사단 개인정보동의서 및 성범죄경력조회 수신 확인</li>
<li>교육 진행 시 학급정보(학생 수, 대기실 위치 등) 사전 공지</li>
<li>특이사항 사전 공지</li>
</ul>
</li>
</ol>`

// ─── 썸네일 유틸 ──────────────────────────────────────────

export function getThumbnailFilename(url: string | undefined): string {
  if (!url) return '파일명.jpg'
  try {
    const path = new URL(url).pathname
    const name = path.split('/').pop() || ''
    const decoded = decodeURIComponent(name)
    if (decoded && decoded.includes('.')) return decoded
    return decoded ? `${decoded}.jpg` : '썸네일.jpg'
  } catch {
    return '파일명.jpg'
  }
}

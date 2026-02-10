/**
 * 프로그램 상세 정보 탭 - 상수, 라벨 맵, 날짜 포맷 유틸
 */

import dayjs from 'dayjs'
import type { DateValue } from '@/types'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  getProgramLifecycleLabel,
  programLifecycleStatusConfig,
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

export function getRecruitmentStatusValue(
  program: Program,
): 'scheduled' | 'recruiting' | 'closed' {
  const start = program.applicationStartDate
  const end = program.applicationEndDate
  if (!start || !end) return 'scheduled'
  const now = dayjs()
  if (now.isBefore(dayjs(start))) return 'scheduled'
  if (now.isAfter(dayjs(end))) return 'closed'
  return 'recruiting'
}

export const RECRUITMENT_RADIO_OPTIONS = [
  { value: 'scheduled', label: '모집 예정' },
  { value: 'recruiting', label: '모집 중' },
  { value: 'closed', label: '모집 마감' },
]

// ─── 라벨 맵 ──────────────────────────────────────────────

export const CATEGORY_LABEL: Record<string, string> = {
  school: '학교/기관',
  individual: '개인',
}

export const TYPE_LABEL: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '혼합',
}

export const TARGET_LEVEL_LABEL: Record<string, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
}

export const LIFECYCLE_OPTIONS = programLifecycleStatusConfig.order.map(
  (status: ProgramLifecycleStatus) => ({
    value: status,
    label: getProgramLifecycleLabel(status),
  }),
)

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

export const DEFAULT_ATTACHMENT_NAMES = [
  '2026년JAKorea대학생경제교육봉사단초등경제교육모집안내문.pdf',
  '2026년JAKorea대학생경제교육봉사단초등경제교육대상학교모집의건.pdf',
]

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

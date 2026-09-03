/**
 * 데이터 관리 E2E — 시드 앵커 문자열
 *
 * SSOT: apps/cms/docs/api/{sponsors,textbooks,detailed-programs}-seed.payload.json
 * 시드 행은 읽기 전용. CRUD는 `틴토랩-*` 고유 행만 생성·삭제한다.
 */

export const DATA_MANAGEMENT_NAME_PREFIX = '틴토랩'

/** 후원사 — 기본 목록 필터 `sp_kind=corporate` */
export const SPONSOR_SEED_CORPORATE = '스타벅스'

/** 후원사 — 재단. 상세 child(담당자·연도별·이력) 시드가 붙은 대표 행 */
export const SPONSOR_SEED_FOUNDATION = '제이에이코리아'

export const SPONSOR_SEED_CONTACT_LEAD = '김제이'
export const SPONSOR_SEED_CONTACT_DEPT = '디자인마케팅팀'

export const SPONSOR_SEED_YEARLY_DONATION = '91,500,000'
export const SPONSOR_SEED_YEARLY_BENEFICIARY = '915'

export const SPONSOR_SEED_HISTORY_TITLE_CANDIDATES = [
  'HSBC/HKU',
  '대학생경제캠프',
  'JA Korea',
] as const

/** 교재 — 사용(USED) 기본 필터 */
export const TEXTBOOK_SEED_ELEMENTARY = '성공하는 경제생활'
export const TEXTBOOK_SEED_MIDDLE = 'JA MY Business'

/** 세부 프로그램 — 사용(active) 기본 필터. inUse → 삭제 시 409 기대 */
export const DETAILED_PROGRAM_SEED_IN_USE = '1차 교육 워크숍'
export const DETAILED_PROGRAM_SEED_INACTIVE = '2차 교육 워크숍'

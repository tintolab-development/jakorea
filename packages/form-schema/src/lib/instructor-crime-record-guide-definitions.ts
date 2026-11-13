/** 공통_강사 신청 폼 — 성범죄경력 조회 동의서 제출 방법 안내 단락 정의 */

export const INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION = {
  title: '성범죄경력 조회 동의서 제출 방법 안내',
  description: '',
} as const

export const INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO =
  '기관에 배정되면 마이페이지 > 해당 프로그램 상세에서 배정된 기관이 요청한 제출 방식을 꼭 확인해 주세요.'

export const INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS = [
  {
    title: '온라인 제출 (기관이 온라인 제출을 요청한 경우)',
    body: '기관 안내사항에 적힌 기관 ID와 검증번호로 범죄경력회보서 사이트에서 온라인으로 제출해 주세요.',
  },
  {
    title: '직접 제출 (기관이 직접 제출을 요청한 경우)',
    body: '범죄경력회보서를 출력하여 배정된 기관에 직접 제출해 주세요.',
  },
] as const

export const INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION =
  '※ 기관이 ‘JA 시스템 내에서 동의서 확인’을 요청한 경우, 강사 신청 시 제출하신 성범죄경력 조회 동의서 및 행정정보 공동이용 동의서가 배정된 기관에 자동 전달되어 기관에서 직접 조회합니다.'

export const INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL = '네, 상기 내용 모두 확인하였습니다.'

export const INSTRUCTOR_CRIME_RECORD_CONFIRM_INCOMPLETE_MESSAGE =
  '성범죄경력 조회 동의서 제출 방법 안내를 확인해 주세요.'

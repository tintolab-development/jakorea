/** 공통_강사 신청 폼 — 성범죄경력 조회 동의서 제출 방법 안내 단락 정의 */

export const INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION = {
  title: '성범죄경력 조회 동의서 제출 방법 안내',
  description: '',
} as const

export const INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO =
  '기관 배정 시 마이페이지 > 해당 프로그램 상세에서 배정된 기관의 제출 방식을 꼭 확인해 주세요.'

export const INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS = [
  {
    title: '1. 온라인 제출 (기관이 온라인 제출을 요청한 경우)',
    body: '기관 안내사항에 적힌 기관 ID와 검증번호로 범죄경력회보서를 온라인으로 제출해 주세요.',
  },
  {
    title: '2. 직접 제출 (기관이 직접 제출을 요청한 경우)',
    body: '범죄경력회보서를 출력하여 배정된 기관에 직접 제출해 주세요.',
  },
] as const

export const INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION =
  '※ 직접 제출인 경우, 사전 동의서는 배정된 기관으로 자동 전달되므로 따로 제출하실 필요가 없습니다.'

export const INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL = '네, 상기 내용 모두 확인하였습니다.'

export const INSTRUCTOR_CRIME_RECORD_CONFIRM_INCOMPLETE_MESSAGE =
  '성범죄경력 조회 동의서 제출 방법 안내를 확인해 주세요.'

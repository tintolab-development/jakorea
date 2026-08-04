/** 홈페이지 회원가입·학교 검색 공개 API 경로 */

export const signupPaths = {
  emailAvailability: () => '/api/homepage/auth/signup/email-availability',
  terms: () => '/api/homepage/auth/signup/terms',
  signupGeneral: () => '/api/homepage/auth/signup/general',
  signupTeacher: () => '/api/homepage/auth/signup/teacher',
  schools: () => '/api/homepage/organizations/schools',
} as const

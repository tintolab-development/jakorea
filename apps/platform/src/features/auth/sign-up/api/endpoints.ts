/** 포털(사용자 홈페이지) 회원가입·학교 검색 PUBLIC API 경로 (`/api/portal/**`) */

export const signupPaths = {
  emailAvailability: () => '/api/portal/auth/signup/email-availability',
  terms: () => '/api/portal/auth/signup/terms',
  flowOptions: () => '/api/portal/auth/signup/flow-options',
  signupGeneral: () => '/api/portal/auth/signup/general',
  signupTeacher: () => '/api/portal/auth/signup/teacher',
  schools: () => '/api/portal/organizations/schools',
} as const

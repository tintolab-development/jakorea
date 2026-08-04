/**
 * TanStack Query 키 팩토리 — 루트 `['platform', …]`
 *
 * API 연동 시 queryKey는 문자열 배열 리터럴을 흩뿌리지 말고 팩토리로만 조합한다.
 */

export const platformQueryKeys = {
  all: ['platform'] as const,

  auth: {
    all: () => [...platformQueryKeys.all, 'auth'] as const,
    /** 세션·토큰 검증 등 */
    session: () => [...platformQueryKeys.auth.all(), 'session'] as const,
    /** 현재 로그인 회원 프로필 */
    me: () => [...platformQueryKeys.auth.all(), 'me'] as const,
    /** 회원가입 이메일 가용성 (mutation 키·캐시 무효화용) */
    emailAvailability: (email: string) =>
      [...platformQueryKeys.auth.all(), 'email-availability', email] as const,
    /** 회원가입 약관 원장 */
    signupTerms: (memberType: string, birthDate: string) =>
      [...platformQueryKeys.auth.all(), 'signup-terms', memberType, birthDate] as const,
    /** 홈페이지 학교·기관 검색 */
    schools: (params: {
      keyword: string
      regionSido: string
      regionSigungu: string
      page: number
    }) =>
      [
        ...platformQueryKeys.auth.all(),
        'schools',
        params.keyword,
        params.regionSido,
        params.regionSigungu,
        params.page,
      ] as const,
  },
} as const

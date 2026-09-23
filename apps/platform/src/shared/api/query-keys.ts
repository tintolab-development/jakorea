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
    /** 현재 로그인 회원 세션 정보 — GET /api/portal/auth/me */
    me: () => [...platformQueryKeys.auth.all(), 'me'] as const,
    /** 회원 포탈 내정보 — GET /api/portal/me/profile */
    memberProfile: () => [...platformQueryKeys.auth.all(), 'member-profile'] as const,
    /** 회원가입 이메일 가용성 (mutation 키·캐시 무효화용) */
    emailAvailability: (email: string) =>
      [...platformQueryKeys.auth.all(), 'email-availability', email] as const,
    /** 회원 이메일 존재 확인 — POST /api/portal/auth/email/check */
    emailCheck: (purpose: string) =>
      [...platformQueryKeys.auth.all(), 'email-check', purpose] as const,
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

  home: {
    all: () => [...platformQueryKeys.all, 'home'] as const,
    /** 공개 메인 화면 — GET /api/public/main (Class B + 홈 마운트 시 1분 재조회) */
    publicMain: () => [...platformQueryKeys.home.all(), 'public-main'] as const,
  },

  site: {
    all: () => [...platformQueryKeys.all, 'site'] as const,
    /** GET /api/public/site/settings — Class B-shell */
    settings: () => [...platformQueryKeys.site.all(), 'settings'] as const,
    /** GET /api/public/site/gnb — Class B-shell */
    gnb: () => [...platformQueryKeys.site.all(), 'gnb'] as const,
    /** GET /api/public/site/footer — Class B-shell */
    footer: () => [...platformQueryKeys.site.all(), 'footer'] as const,
  },

  impactStory: {
    all: () => [...platformQueryKeys.all, 'impact-story'] as const,
    /** 공개 카테고리 — GET /api/public/impact-story/categories (Class B) */
    categories: () => [...platformQueryKeys.impactStory.all(), 'categories'] as const,
    /**
     * 공개 목록 — GET /api/public/impact-story/stories
     * Class C. `categoryId`/`q`/`page`/`size` 가 바뀌면 다른 키.
     */
    list: (params: { categoryId: number | null; q: string; page: number; size: number }) =>
      [
        ...platformQueryKeys.impactStory.all(),
        'list',
        params.categoryId,
        params.q,
        params.page,
        params.size,
      ] as const,
    /** pinned 캐러셀·홈 서브카드·인접글용 preview (`size=20`, page 0) */
    preview: () => [...platformQueryKeys.impactStory.all(), 'preview'] as const,
    /** 공개 상세 — GET /api/public/impact-story/stories/{id} (Class D) */
    detail: (id: string) => [...platformQueryKeys.impactStory.all(), 'detail', id] as const,
  },

  program: {
    all: () => [...platformQueryKeys.all, 'program'] as const,
    /** 공개 목록 — GET /api/portal/programs (Class C, CMS 8080) */
    list: (params: {
      keyword: string
      portalTab: string
      recruitmentStatus: string
      recruitmentTarget: string
      educationTarget: string
      educationMethod: string
      operatingFrom: string
      operatingTo: string
      sort: string
      page: number
      size: number
    }) =>
      [
        ...platformQueryKeys.program.all(),
        'list',
        params.keyword,
        params.portalTab,
        params.recruitmentStatus,
        params.recruitmentTarget,
        params.educationTarget,
        params.educationMethod,
        params.operatingFrom,
        params.operatingTo,
        params.sort,
        params.page,
        params.size,
      ] as const,
    /** 홈 캐러셀 — GET /api/portal/programs?featuredOnHome=true&size=8 (Class C) */
    homePreview: () => [...platformQueryKeys.program.all(), 'home-preview'] as const,
    /** 공개 상세 — GET /api/portal/programs/{programId} (Class D, CMS 8080) */
    detail: (id: string) => [...platformQueryKeys.program.all(), 'detail', id] as const,
  },

  education: {
    all: () => [...platformQueryKeys.all, 'education'] as const,
    /** 공개 프로그램 소개 — GET /api/public/education/program-intros/{fieldCode} (Class D) */
    programIntro: (fieldCode: string) =>
      [...platformQueryKeys.education.all(), 'program-intro', fieldCode] as const,
    /** 공개 교재 목록 — GET /api/public/education/textbooks (Class C, items) */
    textbooks: () => [...platformQueryKeys.education.all(), 'textbooks'] as const,
  },

  mypage: {
    all: () => [...platformQueryKeys.all, 'mypage'] as const,
    /** 내 강사 권한 신청 상태 — GET /api/portal/me/instructor-role-requests/current */
    instructorRoleRequestCurrent: () =>
      [...platformQueryKeys.mypage.all(), 'instructor-role-request', 'current'] as const,
    /** 내 폼 응답 피드백 — GET /api/portal/me/form-responses/{id}/feedback (Class D) */
    formResponseFeedback: (formResponseId: number) =>
      [...platformQueryKeys.mypage.all(), 'form-response-feedback', formResponseId] as const,
    /** 교사회원 배정 강사 동의서 — GET .../assigned-instructors (Class D) */
    assignedInstructors: (applicationId: number) =>
      [...platformQueryKeys.mypage.all(), 'assigned-instructors', 'ORGANIZATION', applicationId] as const,
  },
} as const

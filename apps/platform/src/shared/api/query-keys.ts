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
    /** GET /api/public/participation/links — Class B-shell (GNB·푸터 외부 URL) */
    participationLinks: () => [...platformQueryKeys.site.all(), 'participation-links'] as const,
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
      educationTargets: string
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
        params.educationTargets,
        params.educationMethod,
        params.operatingFrom,
        params.operatingTo,
        params.sort,
        params.page,
        params.size,
      ] as const,
    /** 홈 캐러셀 — GET /api/portal/programs?page=0&size=8&sort=LATEST (Class C) */
    homePreview: () => [...platformQueryKeys.program.all(), 'home-preview'] as const,
    /**
     * 공개 상세 — GET /api/portal/programs/{programId}
     * recruitmentId·applicationType 이 있으면 그 모집 케이스 캐시.
     */
    detail: (id: string, scope?: { recruitmentId?: number; applicationType?: string }) =>
      [
        ...platformQueryKeys.program.all(),
        'detail',
        id,
        scope?.recruitmentId ?? '',
        scope?.applicationType ?? '',
      ] as const,
    /** 프로그램 상세 전체 scope — 모집별 상세 캐시까지 함께 무효화할 때 사용 */
    detailPrefix: (id: string) => [...platformQueryKeys.program.all(), 'detail', id] as const,
    /** 신청 옵션 — GET /api/portal/programs/{programId}/application-options (Class D, 회원) */
    applicationOptions: (programId: string) =>
      [...platformQueryKeys.program.all(), 'application-options', programId] as const,
    /**
     * 신청 양식 — GET /api/portal/programs/{programId}/form-bindings/{bindingId}
     * Class D. recruitmentId·applicationType·bindingId 가 바뀌면 다른 키.
     */
    applicationForm: (params: {
      programId: string
      bindingId: number
      recruitmentId: number
      applicationType: string
    }) =>
      [
        ...platformQueryKeys.program.all(),
        'application-form',
        params.programId,
        params.bindingId,
        params.recruitmentId,
        params.applicationType,
      ] as const,
  },

  programResult: {
    all: () => [...platformQueryKeys.all, 'program-result'] as const,
    /** 허용 카테고리 — 목록 응답 `categories` (Class B) */
    categories: () => [...platformQueryKeys.programResult.all(), 'categories'] as const,
    /** 공개 목록 — GET /api/portal/public/program-results (Class C) */
    list: (params: {
      categoryId: number | null
      keyword: string
      sort: string
      page: number
      size: number
    }) =>
      [
        ...platformQueryKeys.programResult.all(),
        'list',
        params.categoryId,
        params.keyword,
        params.sort,
        params.page,
        params.size,
      ] as const,
    /** 공개 상세 — GET /api/portal/public/program-results/{resultId} (Class D) */
    detail: (id: string, sort: string) =>
      [...platformQueryKeys.programResult.all(), 'detail', id, sort] as const,
  },

  jaKorea: {
    all: () => [...platformQueryKeys.all, 'ja-korea'] as const,
    /** 공개 JA History — GET /api/public/ja-korea/ja-history (Class B, 싱글톤) */
    history: () => [...platformQueryKeys.jaKorea.all(), 'history'] as const,
    /** 공개 기관소개 — GET /api/public/ja-korea/organization (Class B, 싱글톤) */
    organization: () => [...platformQueryKeys.jaKorea.all(), 'organization'] as const,
    /** 공개 오시는 길 — GET /api/public/ja-korea/directions (Class B, 싱글톤) */
    directions: () => [...platformQueryKeys.jaKorea.all(), 'directions'] as const,
    /** 공개 함께하는 사람들 — GET /api/public/ja-korea/people (Class B, 싱글톤) */
    people: () => [...platformQueryKeys.jaKorea.all(), 'people'] as const,
    transparency: {
      all: () => [...platformQueryKeys.jaKorea.all(), 'transparency'] as const,
      /** 공개 투명경영 본문 — GET /api/public/ja-korea/transparency (Class B) */
      page: () => [...platformQueryKeys.jaKorea.transparency.all(), 'page'] as const,
      /**
       * 공개 보고서 목록 — GET /api/public/ja-korea/transparency/reports/{type}
       * Class C. `type`/`q`/`page`/`size` 가 바뀌면 다른 키.
       */
      reports: (params: { type: string; q: string; page: number; size: number }) =>
        [
          ...platformQueryKeys.jaKorea.transparency.all(),
          'reports',
          params.type,
          params.q,
          params.page,
          params.size,
        ] as const,
    },
    notices: {
      all: () => [...platformQueryKeys.jaKorea.all(), 'notices'] as const,
      /**
       * 공개 목록 — GET /api/public/ja-korea/notices
       * Class C. `q`/`page`/`size` 가 바뀌면 다른 키.
       */
      list: (params: { q: string; page: number; size: number }) =>
        [
          ...platformQueryKeys.jaKorea.notices.all(),
          'list',
          params.q,
          params.page,
          params.size,
        ] as const,
      /** 인접글용 preview (`size=20`, page 0, q 없음) */
      preview: () => [...platformQueryKeys.jaKorea.notices.all(), 'preview'] as const,
      /** 공개 상세 — GET /api/public/ja-korea/notices/{id} (Class D) */
      detail: (id: string) => [...platformQueryKeys.jaKorea.notices.all(), 'detail', id] as const,
    },
  },

  careers: {
    all: () => [...platformQueryKeys.all, 'careers'] as const,
    /** 공개 채용 안내 — GET /api/public/careers/guide (Class B, 싱글톤) */
    guide: () => [...platformQueryKeys.careers.all(), 'guide'] as const,
    /** 공개 채용공고 — GET /api/public/careers/postings (Class C, RECRUITING·RESULT) */
    postings: (query: { q: string; page: number; size: number }) =>
      [...platformQueryKeys.careers.all(), 'postings', query.q, query.page, query.size] as const,
    /** 상세 인접글 — q 없이 size 100부터 이어 받는 공개 순서 */
    postingsAdjacent: () => [...platformQueryKeys.careers.all(), 'postings', 'adjacent'] as const,
    /** 공개 채용공고 상세 — GET /api/public/careers/postings/{key} (Class D) */
    postingDetail: (id: string) =>
      [...platformQueryKeys.careers.all(), 'postings', 'detail', id] as const,
  },

  education: {
    all: () => [...platformQueryKeys.all, 'education'] as const,
    /** 공개 프로그램 소개 — GET /api/public/education/program-intros/{fieldCode} (Class B) */
    programIntro: (fieldCode: string) =>
      [...platformQueryKeys.education.all(), 'program-intro', fieldCode] as const,
    /** 공개 교재 목록 — GET /api/public/education/textbooks (Class C, items) */
    textbooks: (query: { fieldCode?: string; sort: string; page: number; size: number }) =>
      [
        ...platformQueryKeys.education.all(),
        'textbooks',
        query.fieldCode ?? 'all',
        query.sort,
        query.page,
        query.size,
      ] as const,
    /** 공개 교재 상세 — GET /api/public/education/textbooks/{id} (Class D) */
    textbookDetail: (id: string) =>
      [...platformQueryKeys.education.all(), 'textbooks', 'detail', id] as const,
  },

  sponsorship: {
    all: () => [...platformQueryKeys.all, 'sponsorship'] as const,
    /** 공개 개인후원 — GET /api/public/sponsorship/personal (Class D) */
    personal: () => [...platformQueryKeys.sponsorship.all(), 'personal'] as const,
    /** 공개 기업후원 안내 — GET /api/public/sponsorship/corporate (Class D) */
    corporate: () => [...platformQueryKeys.sponsorship.all(), 'corporate'] as const,
    /** 공개 기업후원 후원사 — GET /api/public/sponsorship/corporate/sponsors (Class C) */
    corporateSponsors: () =>
      [...platformQueryKeys.sponsorship.all(), 'corporate', 'sponsors'] as const,
    /** 공개 재능기부 소개 — GET /api/public/sponsorship/talent (Class D) */
    talent: () => [...platformQueryKeys.sponsorship.all(), 'talent'] as const,
  },

  mypage: {
    all: () => [...platformQueryKeys.all, 'mypage'] as const,
    /** 내 강사 권한 신청 상태 — GET /api/portal/me/instructor-role-requests/current */
    instructorRoleRequestCurrent: () =>
      [...platformQueryKeys.mypage.all(), 'instructor-role-request', 'current'] as const,
    /** 내 강사 권한 신청 제출 스냅샷 — GET .../instructor-role-requests/current/detail */
    instructorRoleRequestCurrentDetail: () =>
      [...platformQueryKeys.mypage.all(), 'instructor-role-request', 'current', 'detail'] as const,
    /** 마이페이지 홈 요약 — GET /api/portal/me/dashboard (Class E, member scoped) */
    dashboard: () => [...platformQueryKeys.mypage.all(), 'dashboard'] as const,
    /** 내 통합 동의 현황 — GET /api/portal/me/consents (member scoped) */
    consents: () => [...platformQueryKeys.mypage.all(), 'consents'] as const,
    /** 마이페이지 일정 — GET /api/portal/me/calendar (Class C, member scoped) */
    calendar: (from: string, to: string) =>
      [...platformQueryKeys.mypage.all(), 'calendar', from, to] as const,
    /** 공개 FAQ — GET /api/portal/public/faqs (Class C) */
    publicFaqs: () => [...platformQueryKeys.mypage.all(), 'public-faqs'] as const,
    inquiries: {
      all: () => [...platformQueryKeys.mypage.all(), 'inquiries'] as const,
      /** 내 문의 목록 — GET /api/portal/me/inquiries (Class C, member scoped) */
      list: () => [...platformQueryKeys.mypage.inquiries.all(), 'list'] as const,
      /** 내 문의 상세 — GET /api/portal/me/inquiries/{inquiryId} (Class D) */
      detail: (inquiryId: string) =>
        [...platformQueryKeys.mypage.inquiries.all(), 'detail', inquiryId] as const,
      /** 문의 카테고리 — GET .../category-options (Class A) */
      categoryOptions: () =>
        [...platformQueryKeys.mypage.inquiries.all(), 'category-options'] as const,
      /** 문의 프로그램 — GET .../program-options (Class B) */
      programOptions: () =>
        [...platformQueryKeys.mypage.inquiries.all(), 'program-options'] as const,
    },
    /** 내 폼 응답 피드백 — GET /api/portal/me/form-responses/{id}/feedback (Class D) */
    formResponseFeedback: (formResponseId: number) =>
      [...platformQueryKeys.mypage.all(), 'form-response-feedback', formResponseId] as const,
    /** 교사 회원 배정 강사 동의서 — GET .../assigned-instructors (Class D) */
    assignedInstructors: (applicationId: number) =>
      [
        ...platformQueryKeys.mypage.all(),
        'assigned-instructors',
        'ORGANIZATION',
        applicationId,
      ] as const,
    /** 기관 신청 — 학생 명단·초상권 (Class D) */
    organizationApplications: {
      studentRoster: (applicationId: string) =>
        [
          ...platformQueryKeys.mypage.all(),
          'organization-applications',
          applicationId,
          'student-roster',
        ] as const,
      studentDocumentsPolicy: (applicationId: string) =>
        [
          ...platformQueryKeys.mypage.all(),
          'organization-applications',
          applicationId,
          'student-documents-policy',
        ] as const,
      portraitConsent: (applicationId: string) =>
        [
          ...platformQueryKeys.mypage.all(),
          'organization-applications',
          applicationId,
          'portrait-consent',
        ] as const,
    },
    programApplications: {
      all: () => [...platformQueryKeys.mypage.all(), 'program-applications'] as const,
      /**
       * 내 신청 목록 — GET /api/portal/me/program-applications (Class C + member scoped)
       * education은 INDIVIDUAL/ORGANIZATION 두 applicationType을 함께 조회하므로 배열을 키에 포함한다.
       */
      list: (params: {
        applicationTypes: readonly string[]
        statusGroup: string
        keyword: string
        page: number
        size: number
      }) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'list',
          params.applicationTypes.join(','),
          params.statusGroup,
          params.keyword,
          params.page,
          params.size,
        ] as const,
      /** 내 신청 상세 — GET /api/portal/me/program-applications/{applicationType}/{applicationId} */
      detail: (applicationType: string, applicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'detail',
          applicationType,
          applicationId,
        ] as const,
      educationJournals: (programId: string, organizationApplicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'education-journals',
          programId,
          organizationApplicationId,
        ] as const,
      /** 안내 목록 — GET .../notices (Class C) */
      notices: (applicationType: string, applicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notices',
          applicationType,
          applicationId,
        ] as const,
      noticeDetail: (applicationType: string, applicationId: string, postId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notices',
          applicationType,
          applicationId,
          postId,
        ] as const,
      /** 안내 첨부 전체 — GET .../notices/attachments (Class C). keyword 가 응답을 바꾼다 */
      noticeAttachments: (applicationType: string, applicationId: string, keyword = '') =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notice-attachments',
          applicationType,
          applicationId,
          keyword,
        ] as const,
      /** 안내 반응 — GET .../notices/{postId}/reactions (Class E) */
      noticeReactions: (applicationType: string, applicationId: string, postId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notice-reactions',
          applicationType,
          applicationId,
          postId,
        ] as const,
      /** 교육·봉사 일정 — GET .../schedules (Class C) */
      schedules: (applicationType: string, applicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'schedules',
          applicationType,
          applicationId,
        ] as const,
      /** 봉사 배정현황 — GET .../assignments (Class C). 교육일정 UI와 분리 */
      assignments: (applicationType: string, applicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'assignments',
          applicationType,
          applicationId,
        ] as const,
      /** 설문·만족도 — GET .../forms (Class C) */
      forms: (applicationType: string, applicationId: string, formType: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'forms',
          applicationType,
          applicationId,
          formType,
        ] as const,
      /** 설문 본문 — GET /api/portal/me/programs/{programId}/form-bindings/{bindingId}/render (Class D) */
      formBinding: (params: { programId: string; bindingId: number }) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'form-binding',
          params.programId,
          params.bindingId,
        ] as const,
      /** 영수증 — GET .../expense-receipts (Class C) */
      expenseReceipts: (applicationType: string, applicationId: string) =>
        [
          ...platformQueryKeys.mypage.programApplications.all(),
          'expense-receipts',
          applicationType,
          applicationId,
        ] as const,
    },
    /** 정산 신청 목록 — GET /api/portal/me/settlement-applications (Class C) */
    settlementApplications: () =>
      [...platformQueryKeys.mypage.all(), 'settlement-applications'] as const,
  },
} as const

import type { GapRow } from './types'

/**
 * BE/FE 갭 SSOT.
 * OpenAPI v9(2026-07-30 fetch) 기준으로 「API 없음」과 「FE 미배선」을 구분한다.
 */
export const GAP_ROWS: readonly GapRow[] = [
  // Gemini — OpenAPI mutation 존재, FE 미배선 (P0)
  {
    id: 'G-01',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: '모집 POST — FE 미배선',
    suggestedApi: 'OpenAPI: POST …/gemini/trainings/recruitments · FE client GET만',
    relatedCases: ['165001'],
  },
  {
    id: 'G-02',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: '모집 PATCH/DELETE — FE 미배선',
    suggestedApi: 'OpenAPI: PATCH/DELETE …/recruitments/{programId} · bulk-delete',
  },
  {
    id: 'G-03',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: '기관 신청 승인/반려 — FE 미배선',
    suggestedApi: 'OpenAPI: POST …/organization-applications/{id}/approve|reject (+ bulk)',
    relatedCases: ['165002'],
  },
  {
    id: 'G-04',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: '모집→승인 전이 UX',
    suggestedApi: '승인 list/detail GET은 OpenAPI 존재 · 전이 플로우 FE 가드/배선',
  },
  {
    id: 'G-05',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: '강사 신청 목록·승인 — FE 미배선',
    suggestedApi:
      'OpenAPI: GET …/instructor-applications + POST approve|reject · FE mock-only',
  },
  {
    id: 'G-06',
    categoryId: 'gemini-visiting',
    priority: 'P1',
    title: '승인 상세 DTO polish',
    suggestedApi: 'OpenAPI: GET …/approved/{approvedTrainingId} · FE 상세 매핑 잔여',
  },
  {
    id: 'G-07',
    categoryId: 'gemini-visiting',
    priority: 'P0',
    title: 'GEMINI vs GEMINI_TRAINING enum SSOT',
    suggestedApi: 'OpenAPI·시드·FE 단일값 확정',
  },
  {
    id: 'G-08',
    categoryId: 'gemini-performance',
    priority: 'P0',
    title: '실적 행 삭제 — FE 미배선',
    suggestedApi:
      'OpenAPI: DELETE …/training-reports/{id} · bulk-delete · FE remote 분기 throw 가드 해제',
  },
  {
    id: 'U-01',
    categoryId: 'ujat-regions',
    priority: 'P2',
    title: '교육지역 사용중 409/hasUsageHistory 스모크',
    suggestedApi: 'OpenAPI POST/DELETE 등재·FE 배선 완료 · 스테이징 409 계약 확인',
  },

  // Nested / UJAT P1 — OpenAPI 일부 존재, FE mock
  {
    id: 'N-01',
    categoryId: 'general',
    priority: 'P1',
    title: '학교 중첩 · 신청 PATCH',
    suggestedApi: 'PATCH organization-application / institution detail · FE 미배선',
    relatedCases: ['CASE-01', '166401'],
  },
  {
    id: 'N-02',
    categoryId: 'general',
    priority: 'P1',
    title: '학교 · 학생명단',
    suggestedApi: 'roster GET/PUT (OpenAPI roster path 없음 · 계약 필요)',
  },
  {
    id: 'N-03',
    categoryId: 'general',
    priority: 'P1',
    title: '학교 · 강사 배정 (requiredCount)',
    suggestedApi:
      'OpenAPI: POST …/instructor-assignments · execution assign/cancel · FE 미배선',
  },
  {
    id: 'N-04',
    categoryId: 'general',
    priority: 'P1',
    title: '학교 · 출석 저장',
    suggestedApi: 'OpenAPI: PUT …/attendances · attendances:bulk-upsert · FE 중첩 미배선',
  },
  {
    id: 'N-05',
    categoryId: 'general',
    priority: 'P1',
    title: '강사 · 기관배정',
    suggestedApi: 'OpenAPI instructor-assignments · FE institutionAssignment 미배선',
  },
  {
    id: 'N-06',
    categoryId: 'general',
    priority: 'P1',
    title: '강사 · 강의보고 CRUD',
    suggestedApi: '목록 GET hybrid · admin write path FE 미배선 (member POST는 존재)',
  },
  {
    id: 'N-07',
    categoryId: 'company-school',
    priority: 'P1',
    title: '강사 정산 (100km·교통·숙박)',
    suggestedApi: 'OpenAPI settlement-applications · FE 장거리 필드 미배선',
    relatedCases: ['CS-06', '167006'],
  },
  {
    id: 'N-08',
    categoryId: 'general',
    priority: 'P1',
    title: '봉사/개인 배정·과제',
    suggestedApi: 'assignment · 과제 admin(P2-5) OpenAPI 없음',
  },
  {
    id: 'N-09',
    categoryId: 'general',
    priority: 'P1',
    title: '면접 슬롯 GET OpenAPI',
    suggestedApi: 'POST …/interview-slots만 등재 · GET 등재 잔여 (POST는 FE wired)',
  },
  {
    id: 'N-10',
    categoryId: 'ujat',
    priority: 'P1',
    title: 'UJAT 기관신청·임시배정',
    suggestedApi:
      'OpenAPI partner-assignments 존재 · FE 상세 applications/schedules[] 미배선',
  },
  {
    id: 'N-11',
    categoryId: 'ujat',
    priority: 'P1',
    title: 'UJAT H1/H2 봉사 선발',
    suggestedApi: '서류/면접/최종 · 평가 — OpenAPI/FE 모두 갭',
  },
  {
    id: 'N-12',
    categoryId: 'ujat',
    priority: 'P1',
    title: 'UJAT 교육진행 · 1365',
    suggestedApi: 'execution · 출석 · 수료 — FE mock-only',
  },
  {
    id: 'N-13',
    categoryId: 'ujat',
    priority: 'P1',
    title: 'UJAT 설문 응답 수',
    suggestedApi: 'surveys summary · UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT 제거',
  },

  // P2
  {
    id: 'P-01',
    categoryId: 'general',
    priority: 'P2',
    title: '신청경로 CRUD',
    suggestedApi: 'path 리소스 OpenAPI 없음 · applicationPathId PATCH만',
  },
  {
    id: 'P-02',
    categoryId: 'ujat',
    priority: 'P2',
    title: '공휴일(면접 캘린더)',
    suggestedApi: '공휴일 API 또는 정적 계약',
  },
  {
    id: 'P-04',
    categoryId: 'general',
    priority: 'P2',
    title: '만족도 제출 모달',
    suggestedApi: 'form-responses/submit',
  },
  {
    id: 'P-06',
    categoryId: 'ujat',
    priority: 'P2',
    title: 'UJAT 공지 노출 설정',
    suggestedApi: 'info PATCH noticeExposureSetting',
  },
  {
    id: 'P-09',
    categoryId: 'trained-teachers',
    priority: 'P2',
    title: 'TT managers · 설문 answers',
    suggestedApi: '…/managers · surveys answers',
  },
  {
    id: 'P-10',
    categoryId: 'company-school',
    priority: 'P2',
    title: '1사1교 managers/설문 answers polish',
    suggestedApi: 'managers · survey answers 완성도',
  },

  {
    id: 'MEM-01',
    categoryId: 'members-all',
    priority: 'P1',
    title: '회원 상세 하위 탭 mock 제거',
    suggestedApi: '프로그램 이력·코멘트 등 members handoff 잔여 path',
  },
  {
    id: 'MEM-02',
    categoryId: 'members-permission-requests',
    priority: 'P2',
    title: '권한 승인 mutation·필터 polish',
    suggestedApi: '승인/반려·목록 필터 잔여 갭 (목록 GET은 env 게이트로 remote)',
  },
  {
    id: 'SET-01',
    categoryId: 'settlement-item-settings',
    priority: 'P2',
    title: '정산 항목 설정 mutation 완성도',
    suggestedApi: 'settlementConfigs write API',
  },
  {
    id: 'NOTI-01',
    categoryId: 'notifications-kakao',
    priority: 'P1',
    title: '알림톡 전용 handoff·OpenAPI 정리',
    suggestedApi: 'notifications 모듈 path SSOT',
  },
  {
    id: 'PERF-01',
    categoryId: 'performance-education-records',
    priority: 'P1',
    title: 'LNB 실적 vs Gemini 실적 경계 문서화',
    suggestedApi: 'performanceRecords vs geminiPerformance',
  },
] as const

export function getGapsForCategory(categoryId: string): GapRow[] {
  return GAP_ROWS.filter(r => r.categoryId === categoryId)
}

/** 작성·발급 양식 전수 QA — template.schema.ts · issuance-form.schema.ts 와 동기화 */

export const WRITING_TEMPLATE_NAMES = [
  // 등록 4
  '일반 프로그램 등록 폼',
  '1사1교 프로그램 등록 폼',
  'UJAT 프로그램 등록 폼',
  '교육받은 교사 프로그램 등록 폼',
  // 모집 9
  '공통_강사 모집 폼',
  '공통_봉사자 모집 폼',
  '일반_참여 기관 모집 폼',
  '일반_참여자 모집 폼',
  '1사1교_참여 기관 모집 폼',
  'Gemini_찾아가는 연수 모집 폼',
  'UJAT_참여 기관 모집 폼',
  'UJAT_봉사자 모집 폼',
  '교육받은 교사_참여 기관 모집 폼',
  // 신청 11
  '공통_강사 신청 폼',
  '공통_봉사자 신청 폼',
  '일반_참여 기관 신청 폼',
  '일반_참여자 신청 폼',
  '1사1교_참여 기관 신청 폼',
  'Gemini_찾아가는 연수 참여 기관 신청 폼',
  'Gemini_찾아가는 연수 강사 신청 폼',
  'UJAT_참여 기관 신청 폼',
  'UJAT_봉사자 신청 폼',
  '교육받은 교사_참여 기관 신청 폼',
  // 설문 4
  '설문조사',
  '만족도조사 (학생용)',
  '만족도조사 (교사용)',
  '강의평가 (관리자용)',
  // 동의 5
  '초상권 수집·이용 동의',
  '지급조서 사전 동의서',
  '성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서',
  '행정정보 공동이용 사전 동의서',
  '교육진행자 동의 서약서',
] as const

export const ISSUANCE_TEMPLATE_NAMES = [
  'UJAT 교육계획서',
  'UJAT 교육일지',
  '강의보고서',
  '정산 신청서',
  '지급조서 (발급용)',
  '참가인증서',
  '수료증',
  '강사 활동 인증서',
  '봉사 활동 인증서',
] as const

export const CRIME_CONSENT_TEMPLATE_NAME =
  '성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서' as const

/** E2E open+save 불가 — 앱 크래시. [`form-template-fe-gap-report.md`](../docs/qa/form-template-fe-gap-report.md) Fail #1 */
export const E2E_OPEN_SAVE_SKIP_TEMPLATE_NAMES = new Set<string>(['UJAT_봉사자 모집 폼'])

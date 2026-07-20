/**
 * 템플릿 신규 등록 모달 · URL 분기용 타입
 */

/** 모달 라디오: 모집 / 신청 / 설문 / 동의 / 직접 등록 */
export type TemplateCreateKind =
  | 'application'
  | 'application_form'
  | 'survey'
  | 'agreement'
  | 'direct'

/**
 * 작성 양식 섹션 키 (등록 양식 registration 제외)
 * - application = 모집 (RECRUITMENT)
 * - application_form = 신청 (APPLICATION)
 */
export type WritingTemplateCategory =
  | 'application'
  | 'application_form'
  | 'survey'
  | 'agreement'

/** URL `type` — 모달 직접 등록은 survey | agreement. `horizontal_table` 등은 양식 테스트 등 별도 경로에서만 사용 */
export type WritingFormNewType = 'application' | 'survey' | 'agreement' | 'horizontal_table'

/** 목록에서 템플릿 한 건 선택 또는 직접 등록의 하위 유형 선택 */
export type TemplateCreateSelection =
  | { source: 'template'; templateId: string; category: WritingTemplateCategory }
  | { source: 'direct'; target: 'survey' | 'agreement' }

export type TemplateFormUrlMode = 'list' | 'new' | 'edit'

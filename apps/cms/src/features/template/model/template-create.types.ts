/**
 * 템플릿 신규 등록 모달 · URL 분기용 타입
 */

/** 모달 라디오: 신청 / 설문 / 동의 / 직접 등록 */
export type TemplateCreateKind = 'application' | 'survey' | 'agreement' | 'direct'

/** 작성 양식 섹션 키 중 모달·복제에 쓰는 카테고리 (등록 양식 registration 제외) */
export type WritingTemplateCategory = 'application' | 'survey' | 'agreement'

/** URL `type` — 모달 직접 등록은 survey | agreement. `horizontal_table` 등은 양식 테스트 등 별도 경로에서만 사용 */
export type WritingFormNewType = 'application' | 'survey' | 'agreement' | 'horizontal_table'

/** 목록에서 템플릿 한 건 선택 또는 직접 등록의 하위 유형 선택 */
export type TemplateCreateSelection =
  | { source: 'template'; templateId: string; category: WritingTemplateCategory }
  | { source: 'direct'; target: 'survey' | 'agreement' }

export type TemplateFormUrlMode = 'list' | 'new' | 'edit'

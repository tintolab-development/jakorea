/**
 * 교재 소개 · 사업분야 도메인
 * 관리 항목은 고정 4종 — 신규 추가/삭제 없음
 */

export type EducationBusinessFieldKey =
  | 'career'
  | 'economy'
  | 'entrepreneurship'
  | 'digital_literacy'

export type EducationBusinessField = {
  id: string
  key: EducationBusinessFieldKey
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  /** 고정 표시명 — 관리 화면에서 수정 불가 (API에도 displayName 없음) */
  name: string
  description: string
  /** 비어 있으면 홈/관리 안내 placeholder 노출 */
  guideText: string
  updatedAt: string
  /** remote optimistic concurrency */
  version?: number
}

export type EducationBusinessFieldIntro = {
  /** 교재 소개 상단 메인 텍스트 */
  mainText: string
  updatedAt: string
  /** remote setting version */
  settingVersion?: number
}

export type EducationBusinessFieldDocument = {
  intro: EducationBusinessFieldIntro
  fields: EducationBusinessField[]
}

export type EducationBusinessFieldTextPatch = {
  id: string
  name: string
  description: string
  guideText: string
}

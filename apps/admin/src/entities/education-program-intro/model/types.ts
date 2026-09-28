/**
 * 교육 소개 · 프로그램 소개
 * fieldCode 4종 — 섹션 수는 분야별 가변 (진로·경제·기업가 3, 디지털 2)
 */

export const PROGRAM_INTRO_FIELD_CODES = [
  'CAREER_EMPLOYMENT',
  'ECONOMICS_FINANCE',
  'ENTREPRENEURSHIP',
  'DIGITAL_LITERACY',
] as const

export type ProgramIntroFieldCode = (typeof PROGRAM_INTRO_FIELD_CODES)[number]

/** URL `?tab=` 슬러그 */
export type ProgramIntroTabKey = 'career' | 'economy' | 'entrepreneurship' | 'digital'

export type ProgramIntroImage = {
  fileName: string
  fileUrl: string
  alt: string
  sortOrder: number
  width?: number
  height?: number
  assetId?: number
  /** remote 저장 시 업로드할 신규 파일 */
  file?: File
} | null

export type ProgramIntroItem = {
  sectionKey: string
  sortOrder: number
  programType: string
  typeDescription: string
  images: ProgramIntroImage[]
  representativeProgram: string
  sponsorName: string
  representativeDescription: string
}

export type ProgramIntroCategoryDocument = {
  fieldCode: ProgramIntroFieldCode
  mainText: string
  version: number
  sections: ProgramIntroItem[]
  updatedAt: string
}

export type ProgramIntroSaveInput = {
  fieldCode: ProgramIntroFieldCode
  mainText: string
  version: number
  sections: ProgramIntroItem[]
}

/**
 * 교육 소개 · 프로그램 소개 도메인
 * 탭(분야) 3종 고정 — 탭 명칭 수정 불가
 */

export type ProgramIntroCategoryKey = 'career' | 'economy' | 'digital'

export type ProgramIntroImage = {
  fileName: string
  fileUrl: string
} | null

export type ProgramIntroItem = {
  programType: string
  typeDescription: string
  /** P01:2, P02:1, P03:3 */
  images: ProgramIntroImage[]
  representativeProgram: string
  sponsorName: string
  representativeDescription: string
}

export type ProgramIntroCategoryDocument = {
  categoryKey: ProgramIntroCategoryKey
  mainText: string
  programs: [ProgramIntroItem, ProgramIntroItem, ProgramIntroItem]
  updatedAt: string
}

export type ProgramIntroSaveInput = {
  categoryKey: ProgramIntroCategoryKey
  mainText: string
  programs: [ProgramIntroItem, ProgramIntroItem, ProgramIntroItem]
}

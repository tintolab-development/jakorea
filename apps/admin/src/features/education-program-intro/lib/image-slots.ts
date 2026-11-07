/**
 * 프로그램 01~03 이미지 슬롯 스펙 (Notion)
 */

export type ProgramIntroImageSlot = {
  label: string
  recommendedSize: string
  guideLines: readonly string[]
}

const BASE_GUIDE = '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.'

function slot(
  label: string,
  recommendedSize: string,
  sizeNoun: '이미지' | '배너' | '' = '이미지',
): ProgramIntroImageSlot {
  const sizePhrase = sizeNoun ? `권장 ${sizeNoun} 사이즈` : '권장 사이즈'
  return {
    label,
    recommendedSize,
    guideLines: [BASE_GUIDE, `- ${sizePhrase}는 ${recommendedSize}입니다.`],
  }
}

/** 0-based program index → image slots */
export const PROGRAM_INTRO_IMAGE_SLOTS: readonly (readonly ProgramIntroImageSlot[])[] = [
  [slot('좌측 이미지', '960 × 540px'), slot('우측 이미지', '440 × 540px')],
  [slot('중앙 이미지', '1440 × 540px', '배너')],
  [
    slot('좌측 이미지', '880 × 540px', '배너'),
    slot('우상단 이미지', '520 × 260px', ''),
    slot('우하단 이미지', '520 × 260px', ''),
  ],
]

export function getProgramImageSlotCount(programIndex: number): number {
  return PROGRAM_INTRO_IMAGE_SLOTS[programIndex]?.length ?? 0
}

export const PROGRAM_INTRO_IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
export const PROGRAM_INTRO_IMAGE_MAX_BYTES = 20 * 1024 * 1024

export function isAllowedProgramIntroImage(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

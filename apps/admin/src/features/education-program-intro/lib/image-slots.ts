/**
 * 프로그램 01~03 이미지 슬롯 스펙 (Notion)
 */

export type ProgramIntroImageSlot = {
  label: string
  recommendedSize: string
  guideLines: readonly string[]
}

const BASE_GUIDE = '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.'

function slot(label: string, recommendedSize: string): ProgramIntroImageSlot {
  return {
    label,
    recommendedSize,
    guideLines: [BASE_GUIDE, `- 이미지 권장 사이즈는 ${recommendedSize}입니다.`],
  }
}

/** 0-based program index → image slots */
export const PROGRAM_INTRO_IMAGE_SLOTS: readonly (readonly ProgramIntroImageSlot[])[] = [
  [slot('이미지 01', '960*540'), slot('이미지 02', '440*540')],
  [slot('이미지 01', '1440*540')],
  [slot('이미지 01', '880*540'), slot('이미지 02', '520*260'), slot('이미지 03', '520*260')],
]

export function getProgramImageSlotCount(programIndex: number): number {
  return PROGRAM_INTRO_IMAGE_SLOTS[programIndex]?.length ?? 0
}

export const PROGRAM_INTRO_IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
export const PROGRAM_INTRO_IMAGE_MAX_BYTES = 15 * 1024 * 1024

export function isAllowedProgramIntroImage(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

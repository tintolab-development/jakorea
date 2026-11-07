import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types'

function isBlank(value: string): boolean {
  return value.trim() === ''
}

/** 수정 모드에서 `*` 필수인 필드가 비어 있는지 */
export function hasIncompleteRequiredJaKoreaIntroFields(data: JaKoreaIntro): boolean {
  return (
    isBlank(data.section01.mainTitle) ||
    isBlank(data.section01.subTitle) ||
    isBlank(data.section02.titlePhrase) ||
    isBlank(data.section02.subTitle) ||
    isBlank(data.section02.content01.title) ||
    isBlank(data.section02.content01.description) ||
    isBlank(data.section02.content02.title) ||
    isBlank(data.section02.content02.description) ||
    isBlank(data.vision.topSubText) ||
    isBlank(data.vision.mainText) ||
    isBlank(data.mission.topSubText) ||
    isBlank(data.mission.mainText)
  )
}

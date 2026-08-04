/**
 * JA Korea 소개 관리 — Notion 1-1
 */

export type IntroTextPair = {
  /** 좌측/메인 문구 */
  mainTitle: string
  /** 우측/보조 문구 */
  subTitle: string
}

export type IntroContentBlock = {
  title: string
  description: string
}

export type IntroSection02 = IntroTextPair & {
  content01: IntroContentBlock
  content02: IntroContentBlock
}

/** Global Vision / Mission */
export type VisionMissionBlock = {
  /** 영문 상단 서브 */
  subText: string
  /** 한글 메인 */
  mainText: string
}

export type JaKoreaIntroContent = {
  section01: IntroTextPair
  section02: IntroSection02
  globalVision: VisionMissionBlock
  globalMission: VisionMissionBlock
}

export function cloneIntroContent(content: JaKoreaIntroContent): JaKoreaIntroContent {
  return structuredClone(content)
}

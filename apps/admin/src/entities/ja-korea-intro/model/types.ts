/**
 * JA Korea 소개 관리 도메인 타입
 */

export type IntroContentBlock = {
  title: string
  description: string
}

export type IntroSection01 = {
  mainTitle: string
  subTitle: string
}

export type IntroSection02 = {
  titlePhrase: string
  subTitle: string
  content01: IntroContentBlock
  content02: IntroContentBlock
}

export type VisionMission = {
  topSubText: string
  mainText: string
}

export type JaKoreaIntro = {
  section01: IntroSection01
  section02: IntroSection02
  vision: VisionMission
  mission: VisionMission
  updatedAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

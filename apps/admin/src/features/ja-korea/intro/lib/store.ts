import { create } from 'zustand'
import type { JaKoreaIntroContent } from '../model/types'
import { cloneIntroContent } from '../model/types'

const seed: JaKoreaIntroContent = {
  section01: {
    mainTitle: 'JA Korea',
    subTitle: '청소년의 성공적인 미래를 위한\n경제·금융 교육 전문기관',
  },
  section02: {
    mainTitle: 'About\nJA Korea',
    subTitle: 'JA Korea 소개',
    content01: {
      title: '경제교육으로\n세상을 바꿉니다',
      description:
        'JA Korea는 청소년에게 경제·금융·창업 교육을 제공하여\n스스로 미래를 설계할 수 있도록 돕습니다.',
    },
    content02: {
      title: '기업과 함께하는\n실천형 교육',
      description:
        '기업 자원봉사자와 함께하는 체험형 프로그램을 통해\n교실을 넘어 실무 역량을 키웁니다.',
    },
  },
  globalVision: {
    subText: 'Global Vision',
    mainText: '모든 청소년이 경제적 자유를 누리며\n성장할 수 있는 세상을 만듭니다.',
  },
  globalMission: {
    subText: 'Global Mission',
    mainText: '실천 중심의 경제·금융 교육으로\n청소년의 잠재력을 키웁니다.',
  },
}

type IntroStore = {
  content: JaKoreaIntroContent
  save: (next: JaKoreaIntroContent) => void
}

export const useJaKoreaIntroStore = create<IntroStore>(set => ({
  content: seed,
  save: next => set({ content: cloneIntroContent(next) }),
}))

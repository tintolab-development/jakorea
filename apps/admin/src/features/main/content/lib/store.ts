import { create } from 'zustand'
import type {
  DonationContent,
  EducationProgramContent,
  ImpactStoryContent,
  MainContentState,
  PerformanceContent,
} from '../model/types'

const initial: MainContentState = {
  education: {
    title: '청소년의 가능성을 키우는 교육 프로그램',
  },
  impact: {
    title: '변화의 순간들\n임팩트 스토리',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featuredStoryId: 'story-1',
  },
  performance: {
    title: '숫자로 보는 JA Korea',
    networkCount: 120,
    partnerCount: 85,
    volunteerCount: 2400,
    beneficiaryCount: 58000,
    bottomText: '전국에서 이어지는 교육과 나눔의 기록입니다.',
  },
  donation: {
    title: '함께하는 후원\n청소년의 내일을 응원해 주세요',
    cta1Label: '개인 후원하기',
    cta1Url: '/sponsor/individual',
    cta2Label: '기업 후원 안내',
    cta2Url: '/sponsor/corporate',
  },
}

type MainContentStore = {
  content: MainContentState
  saveEducation: (value: EducationProgramContent) => void
  saveImpact: (value: ImpactStoryContent) => void
  savePerformance: (value: PerformanceContent) => void
  saveDonation: (value: DonationContent) => void
}

export const useMainContentStore = create<MainContentStore>(set => ({
  content: initial,

  saveEducation: value => {
    set(state => ({
      content: { ...state.content, education: { title: value.title.trim() } },
    }))
  },

  saveImpact: value => {
    set(state => ({
      content: {
        ...state.content,
        impact: {
          title: value.title,
          youtubeUrl: value.youtubeUrl.trim(),
          featuredStoryId: value.featuredStoryId,
        },
      },
    }))
  },

  savePerformance: value => {
    set(state => ({
      content: {
        ...state.content,
        performance: {
          title: value.title.trim(),
          networkCount: Math.max(0, Number(value.networkCount) || 0),
          partnerCount: Math.max(0, Number(value.partnerCount) || 0),
          volunteerCount: Math.max(0, Number(value.volunteerCount) || 0),
          beneficiaryCount: Math.max(0, Number(value.beneficiaryCount) || 0),
          bottomText: value.bottomText,
        },
      },
    }))
  },

  saveDonation: value => {
    set(state => ({
      content: {
        ...state.content,
        donation: {
          title: value.title,
          cta1Label: value.cta1Label.trim(),
          cta1Url: value.cta1Url.trim(),
          cta2Label: value.cta2Label.trim(),
          cta2Url: value.cta2Url.trim(),
        },
      },
    }))
  },
}))

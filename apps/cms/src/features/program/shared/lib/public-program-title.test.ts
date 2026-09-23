import { describe, expect, it } from 'vitest'
import {
  applyResolvedAnnouncementTitle,
  buildRegistrationOverlayForPersist,
  resolvePublicProgramTitle,
  resolvePublicProgramTitleDisplay,
} from './public-program-title'
import type { Program } from '@/types/domain'

function baseProgram(partial: Partial<Program> = {}): Program {
  return {
    id: 'p-1',
    sponsorId: 's-1',
    title: '대표 프로그램명',
    mainTitle: '대표 프로그램명',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('resolvePublicProgramTitle', () => {
  it('overlay 공고용명을 대표명 alias보다 우선한다', () => {
    expect(
      resolvePublicProgramTitle({
        announcementTitle: '대표 프로그램명',
        overlay: {
          'generalRegistration.basicInfo.publicProgramTitle': '실제 공고용 프로그램명',
        },
        mainTitle: '대표 프로그램명',
        title: '대표 프로그램명',
      })
    ).toBe('실제 공고용 프로그램명')
  })

  it('announcementTitle이 대표명과 같으면 버린다', () => {
    expect(
      resolvePublicProgramTitle({
        announcementTitle: '대표 프로그램명',
        mainTitle: '대표 프로그램명',
        title: '대표 프로그램명 운영',
      })
    ).toBe('')
  })

  it('중첩 JSON 후보가 대표명 alias이면 루트 공고명을 쓴다', () => {
    expect(
      resolvePublicProgramTitle({
        announcementTitle: '대표 프로그램명',
        announcementTitleCandidates: ['대표 프로그램명', '구 공고'],
        mainTitle: '대표 프로그램명',
        title: '대표 프로그램명',
      })
    ).toBe('구 공고')
  })
})

describe('resolvePublicProgramTitleDisplay', () => {
  it('대표명 alias면 - 로 표시한다', () => {
    expect(
      resolvePublicProgramTitleDisplay(
        baseProgram({
          generalCommonInfo: { announcementTitle: '대표 프로그램명' },
        })
      )
    ).toBe('-')
  })

  it('UJAT overlay 공고용명을 표시한다', () => {
    expect(
      resolvePublicProgramTitleDisplay(
        baseProgram({
          generalCommonInfo: { announcementTitle: '대표 프로그램명' },
          ujatRegistrationOverlay: {
            'ujat.basicInfo.publicProgramTitle': '고등학생 기업가정신 캠프 참가자 모집',
          },
        })
      )
    ).toBe('고등학생 기업가정신 캠프 참가자 모집')
  })
})

describe('applyResolvedAnnouncementTitle', () => {
  it('GET JSON overlay에서 공고용명을 복원한다', () => {
    const next = applyResolvedAnnouncementTitle(
      baseProgram({
        generalCommonInfo: { announcementTitle: '대표 프로그램명' },
      }),
      {
        serviceDetailJson: JSON.stringify({
          schemaVersion: 1,
          generalCommonInfo: { announcementTitle: '대표 프로그램명' },
          registration: {
            overlay: {
              'generalRegistration.basicInfo.publicProgramTitle': '모집 공고 제목',
            },
          },
        }),
      }
    )
    expect(next.generalCommonInfo?.announcementTitle).toBe('모집 공고 제목')
    expect(next.registrationOverlay?.['generalRegistration.basicInfo.publicProgramTitle']).toBe(
      '모집 공고 제목'
    )
  })
})

describe('buildRegistrationOverlayForPersist', () => {
  it('공고용명을 overlay에 남긴다', () => {
    const overlay = buildRegistrationOverlayForPersist(
      baseProgram({
        generalCommonInfo: { announcementTitle: '모집 공고 제목' },
      })
    )
    expect(overlay?.['generalRegistration.basicInfo.publicProgramTitle']).toBe('모집 공고 제목')
  })

  it('이미 있는 유형 키만 갱신한다', () => {
    const overlay = buildRegistrationOverlayForPersist(
      baseProgram({
        generalCommonInfo: { announcementTitle: '수정 공고' },
        registrationOverlay: {
          'economyRegistration.basicInfo.publicProgramTitle': '이전 공고',
        },
      })
    )
    expect(overlay?.['economyRegistration.basicInfo.publicProgramTitle']).toBe('수정 공고')
    expect(overlay?.['generalRegistration.basicInfo.publicProgramTitle']).toBeUndefined()
  })
})

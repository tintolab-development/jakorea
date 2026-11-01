import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  coalesceResultAnnouncementDate,
  readRecruitFinalAnnounceIsoFromOverlay,
} from './resolve-result-announcement-date'

const createdAt = '2026-10-31T08:42:54.872Z'

describe('coalesceResultAnnouncementDate', () => {
  it('overlay ISO가 있으면 preferOverlay와 관계없이 overlay를 쓴다', () => {
    const overlayIso = '2026-11-02T15:00:00.000Z'
    expect(
      coalesceResultAnnouncementDate({
        overlayIso,
        programDate: createdAt,
        createdAt,
        updatedAt: createdAt,
        preferOverlay: false,
      })
    ).toBe(overlayIso)
    expect(
      coalesceResultAnnouncementDate({
        overlayIso,
        programDate: createdAt,
        createdAt,
        updatedAt: createdAt,
        preferOverlay: true,
      })
    ).toBe(overlayIso)
  })

  it('overlay가 등록 시각 시드면 발표일로 쓰지 않는다', () => {
    expect(
      coalesceResultAnnouncementDate({
        overlayIso: createdAt,
        programDate: createdAt,
        createdAt,
        updatedAt: createdAt,
        preferOverlay: true,
      })
    ).toBeUndefined()
  })

  it('생성 시드 now는 overlay가 없으면 버린다', () => {
    expect(
      coalesceResultAnnouncementDate({
        overlayIso: undefined,
        programDate: createdAt,
        createdAt,
        updatedAt: createdAt,
        preferOverlay: true,
      })
    ).toBeUndefined()
  })

  it('조회 컬럼(날짜 00:00)은 preferOverlay false에서 유지한다', () => {
    const stored = '2026-11-02T15:00:00.000Z'
    expect(
      coalesceResultAnnouncementDate({
        overlayIso: undefined,
        programDate: stored,
        createdAt,
        preferOverlay: false,
      })
    ).toBe(stored)
  })

  it('시간 토글 14:00 ISO는 시드로 보지 않는다', () => {
    const clock = '2026-11-03T05:00:00.000Z'
    expect(
      coalesceResultAnnouncementDate({
        overlayIso: clock,
        programDate: createdAt,
        createdAt,
        preferOverlay: true,
      })
    ).toBe(clock)
  })
})

describe('readRecruitFinalAnnounceIsoFromOverlay', () => {
  it('개인 프로그램은 individual 키를 우선한다', () => {
    const iso = readRecruitFinalAnnounceIsoFromOverlay(
      {
        'recruit.finalAnnounceIso': '2026-11-01T15:00:00.000Z',
        'recruit.individual.finalAnnounceIso': '2026-11-02T15:00:00.000Z',
      },
      { generalProgramAudience: 'individual', generalParticipantTypes: ['individual'] } as Program
    )
    expect(iso).toBe('2026-11-02T15:00:00.000Z')
  })

  it('참여자 키가 없으면 volunteer를 쓴다', () => {
    const iso = readRecruitFinalAnnounceIsoFromOverlay(
      { 'recruit.volunteer.finalAnnounceIso': '2026-11-04T15:00:00.000Z' },
      { generalProgramAudience: 'individual', generalParticipantTypes: ['volunteer'] } as Program
    )
    expect(iso).toBe('2026-11-04T15:00:00.000Z')
  })
})

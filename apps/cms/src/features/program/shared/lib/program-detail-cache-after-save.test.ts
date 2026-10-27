import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  programDetailCacheAfterSave,
  programDetailCacheFromSave,
  syncOpenProgramDetailCache,
} from './program-detail-cache-after-save'

describe('programDetailCacheAfterSave', () => {
  it('keeps the subscribed program id and overlays the saved common info on a stale echo', () => {
    const echoed = {
      id: '186018',
      title: '구 제목',
      venue: '구 장소',
      generalCommonInfo: {
        venueKind: 'outside',
        venueDetail: '구 상세',
        announcementTitle: '구 공고',
      },
    } as unknown as Program

    const next = programDetailCacheAfterSave('186018', echoed, {
      title: '새 제목',
      generalCommonInfo: {
        venueKind: 'inside',
        venueDetail: '서울시 강서구 가양 데시앙플렉스',
      },
    })

    expect(next.id).toBe('186018')
    expect(next.title).toBe('새 제목')
    expect(next.generalCommonInfo?.venueKind).toBe('inside')
    expect(next.generalCommonInfo?.venueDetail).toBe('서울시 강서구 가양 데시앙플렉스')
    expect(next.generalCommonInfo?.announcementTitle).toBe('구 공고')
  })

  it('keeps PATCH echo audit names over the in-memory draft', () => {
    const echoed = {
      id: '186401',
      title: '예시',
      createdAt: '2026-12-08T00:15:00.000Z',
      updatedAt: '2026-12-09T01:00:00.000Z',
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as Program
    const next = programDetailCacheAfterSave('186401', echoed, {
      title: '예시',
      createdByName: '세션사용자',
      updatedByName: '세션사용자',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    })

    expect(next.createdByName).toBe('곽도규')
    expect(next.updatedByName).toBe('김도영')
    expect(next.createdAt).toBe('2026-12-08T00:15:00.000Z')
    expect(next.updatedAt).toBe('2026-12-09T01:00:00.000Z')
    expect(next.title).toBe('예시')
  })

  it('keeps the UJAT draft overlay when the echo omits it', () => {
    const echoed = { id: '1', title: '구 제목' } as Program
    const draft = {
      id: '1',
      title: '새 제목',
      ujatRegistrationOverlay: { 'ujat.basicInfo.repKo': '새 국문 대표명' },
    } as unknown as Program

    const next = programDetailCacheFromSave('1', echoed, draft, { title: '새 제목' })

    expect(next.title).toBe('새 제목')
    expect(next.ujatRegistrationOverlay?.['ujat.basicInfo.repKo']).toBe('새 국문 대표명')
  })

  it('lets a patch overlay replace the draft overlay', () => {
    const echoed = { id: '1' } as Program
    const draft = {
      id: '1',
      ujatRegistrationOverlay: { 'ujat.basicInfo.repKo': '드래프트' },
    } as unknown as Program

    const next = programDetailCacheFromSave('1', echoed, draft, {
      ujatRegistrationOverlay: { 'ujat.basicInfo.repKo': '패치' },
    })

    expect(next.ujatRegistrationOverlay?.['ujat.basicInfo.repKo']).toBe('패치')
  })

  it('keeps survey menu keys and registration overlay when the echo omits them', () => {
    const echoed = {
      id: '186009',
      title: 'TT',
      generalSurveyMenuKeys: ['survey'],
    } as unknown as Program
    const draft = {
      id: '186009',
      title: 'TT',
      generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
      registrationOverlay: {
        'trainedTeachersRegistration.basicInfo.surveyItems': {
          survey: true,
          satisfaction: true,
          lecture_evaluation: true,
        },
      },
    } as unknown as Program

    const next = programDetailCacheFromSave('186009', echoed, draft, {
      generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
      registrationOverlay: draft.registrationOverlay,
    })

    expect(next.generalSurveyMenuKeys).toEqual(['survey', 'satisfaction', 'lecture_evaluation'])
    expect(
      (
        next.registrationOverlay?.['trainedTeachersRegistration.basicInfo.surveyItems'] as Record<
          string,
          boolean
        >
      )?.satisfaction
    ).toBe(true)
  })

  it('does not invalidate detail when refetch is false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const key = ['cms', 'trained-teachers', 'detail', '1'] as const
    queryClient.setQueryData(key, { id: '1', title: '구' } as Program)
    let fetched = 0
    queryClient.setQueryDefaults(key, {
      queryFn: async () => {
        fetched += 1
        return { id: '1', title: 'refetch' } as Program
      },
    })

    await syncOpenProgramDetailCache(
      queryClient,
      key,
      { id: '1', title: '저장됨', generalSurveyMenuKeys: ['satisfaction'] } as Program,
      { refetch: false }
    )

    expect(queryClient.getQueryData<Program>(key)?.title).toBe('저장됨')
    expect(queryClient.getQueryData<Program>(key)?.generalSurveyMenuKeys).toEqual(['satisfaction'])
    expect(fetched).toBe(0)
    queryClient.clear()
  })

  it('cancels an in-flight detail fetch so it cannot overwrite the saved cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const key = ['cms', 'programs', 'detail', '1'] as const
    let resolveStale: (value: Program) => void = () => {}
    const stale = new Promise<Program>(resolve => {
      resolveStale = resolve
    })
    const fetching = queryClient.fetchQuery({
      queryKey: key,
      queryFn: () => stale,
    })

    const saved = { id: '1', title: '저장됨' } as Program
    const syncing = syncOpenProgramDetailCache(queryClient, key, saved)
    resolveStale({ id: '1', title: '저장 전' } as Program)
    await Promise.allSettled([fetching, syncing])

    expect(queryClient.getQueryData<Program>(key)?.title).toBe('저장됨')
    queryClient.clear()
  })
})

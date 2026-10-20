import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  listTrainedTeacherSurveyReflectionQueryKeys,
  reflectTrainedTeacherProgramSave,
} from './detail-cache'
import { applyTrainedTeacherInfoDetailSaveToCache } from './info-detail-adapters'

const programId = '186009'

describe('교육받은 교사 저장 응답 캐시 반영', () => {
  it('서버 재조회 응답을 그대로 캐시하고 상세는 무효화하지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const detailKey = trainedTeacherQueryKeys.detail(programId)
    let detailFetches = 0
    queryClient.setQueryDefaults(detailKey, {
      queryFn: async () => {
        detailFetches += 1
        return { id: programId, title: '재조회' } as Program
      },
    })
    queryClient.setQueryData(detailKey, {
      id: programId,
      title: '저장 전',
      generalSurveyMenuKeys: ['survey'],
    } as Program)
    queryClient.setQueryData(generalProgramQueryKeys.navigation(programId), { lnb: [] })
    queryClient.setQueryData(generalProgramQueryKeys.surveys(programId), [])
    queryClient.setQueryData(trainedTeacherQueryKeys.list('filters'), { pages: [], pageParams: [] })

    const echoed = {
      id: programId,
      title: '서버 제목',
      businessArea: '경제금융',
      venue: '서버 장소',
      generalSurveyMenuKeys: ['survey'],
    } as unknown as Program

    await reflectTrainedTeacherProgramSave(queryClient, {
      programId,
      echoed,
    })

    const cached = queryClient.getQueryData<Program>(detailKey)
    expect(cached?.title).toBe('서버 제목')
    expect(cached?.businessArea).toBe('경제금융')
    expect(cached?.venue).toBe('서버 장소')
    expect(cached?.generalSurveyMenuKeys).toEqual(['survey'])
    expect(cached?.registrationOverlay).toBeUndefined()
    expect(detailFetches).toBe(0)
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(trainedTeacherQueryKeys.list('filters'))?.isInvalidated).toBe(
      true
    )
    expect(
      queryClient.getQueryState(generalProgramQueryKeys.navigation(programId))?.isInvalidated
    ).toBe(true)
    expect(
      queryClient.getQueryState(generalProgramQueryKeys.surveys(programId))?.isInvalidated
    ).toBe(true)
    expect(listTrainedTeacherSurveyReflectionQueryKeys(programId)).toContainEqual(
      generalProgramQueryKeys.formBindings(programId)
    )
    expect(
      listTrainedTeacherSurveyReflectionQueryKeys(programId).some(key => key.includes('detail'))
    ).toBe(false)

    const afterInfoDetail = applyTrainedTeacherInfoDetailSaveToCache(
      cached,
      {
        id: programId,
        title: '일지 저장 후',
        generalSurveyMenuKeys: ['survey'],
        registrationOverlay: {
          'trainedTeachersRegistration.basicInfo.surveyItems': {
            survey: true,
            satisfaction: false,
            lecture_evaluation: false,
          },
        },
      } as unknown as Program,
      programId
    )
    queryClient.setQueryData(detailKey, afterInfoDetail)
    expect(queryClient.getQueryData<Program>(detailKey)?.generalSurveyMenuKeys).toEqual(['survey'])
    expect(queryClient.getQueryData<Program>(detailKey)?.title).toBe('일지 저장 후')

    queryClient.clear()
  })
})

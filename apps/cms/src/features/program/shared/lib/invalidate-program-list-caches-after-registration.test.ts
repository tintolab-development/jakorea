import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { geminiVisitingTrainingQueryKeys } from '@/features/program/gemini/api/visiting-training/query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import { queryKeys as ujatProgramQueryKeys } from '@/features/program/ujat/api/query-keys'
import { programCalendarQueryKeys } from '@/features/program/general/api/program-calendar-query-keys'
import {
  invalidateCompanySchoolListCaches,
  invalidateGeminiRecruitmentListCaches,
  invalidateGeneralProgramListCaches,
  invalidateProgramListCachesAfterRegistration,
  invalidateTrainedTeacherListCaches,
  invalidateUjatProgramListCaches,
} from './invalidate-program-list-caches-after-registration'

function invalidatedQueryKeys(queryClient: QueryClient, run: () => void): unknown[][] {
  const spy = vi.spyOn(queryClient, 'invalidateQueries')
  run()
  const keys = spy.mock.calls.map(call => {
    const arg = call[0] as { queryKey?: unknown[] } | undefined
    return [...(arg?.queryKey ?? [])]
  })
  spy.mockRestore()
  return keys
}

describe('invalidateProgramListCachesAfterRegistration', () => {
  it('general: invalidates lists + overviewStages', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () => invalidateGeneralProgramListCaches(queryClient))
    ).toEqual([
      generalProgramQueryKeys.lists(),
      generalProgramQueryKeys.overviewStages(),
      programCalendarQueryKeys.all,
    ])
  })

  it('economy variant: invalidates 1c-1s lists + overviewStages', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () =>
        invalidateProgramListCachesAfterRegistration(queryClient, 'economy')
      )
    ).toEqual([
      companySchoolQueryKeys.lists(),
      companySchoolQueryKeys.overviewStages(),
      programCalendarQueryKeys.all,
    ])
  })

  it('trainedTeachers variant: invalidates lists + overviewStages', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () =>
        invalidateProgramListCachesAfterRegistration(queryClient, 'trainedTeachers')
      )
    ).toEqual([
      trainedTeacherQueryKeys.lists(),
      trainedTeacherQueryKeys.overviewStages(),
      programCalendarQueryKeys.all,
    ])
  })

  it('companySchool helper matches economy registration path', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () => invalidateCompanySchoolListCaches(queryClient))
    ).toEqual([
      companySchoolQueryKeys.lists(),
      companySchoolQueryKeys.overviewStages(),
      programCalendarQueryKeys.all,
    ])
  })

  it('trainedTeacher helper invalidates lists + overviewStages', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () => invalidateTrainedTeacherListCaches(queryClient))
    ).toEqual([
      trainedTeacherQueryKeys.lists(),
      trainedTeacherQueryKeys.overviewStages(),
      programCalendarQueryKeys.all,
    ])
  })

  it('ujat: invalidates lists only (no overviewStages widget)', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () => invalidateUjatProgramListCaches(queryClient))
    ).toEqual([ujatProgramQueryKeys.lists()])
  })

  it('gemini: invalidates recruitment list', () => {
    const queryClient = new QueryClient()
    expect(
      invalidatedQueryKeys(queryClient, () => invalidateGeminiRecruitmentListCaches(queryClient))
    ).toEqual([geminiVisitingTrainingQueryKeys.recruitmentList()])
  })
})

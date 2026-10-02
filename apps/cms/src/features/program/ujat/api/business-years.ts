import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

export type ProgramBusinessYearsResponse = {
  years?: number[] | null
}

/** UJAT 목록 진행년도 셀렉트. `programType`은 필수다. */
export async function fetchUjatProgramBusinessYears(): Promise<number[]> {
  const body = await unwrapApiBody<ProgramBusinessYearsResponse>(
    await customInstance({
      url: '/api/admin/programs/business-years',
      method: 'GET',
      params: { programType: 'UJAT' },
    })
  )
  if (!Array.isArray(body.years)) return []
  return body.years.filter((year): year is number => typeof year === 'number' && Number.isInteger(year))
}

import type { MypageProgramStats } from '../../../model/types'
import { PROGRAM_APPLICATION_TYPES, type ProgramApplicationType } from './types'
import { fetchMyProgramApplications } from './client'
import { mapPortalProgramApplicationListItem } from './mappers'
import { summarizeMypageProgramStatsFromApplications } from '../lib/application-list-tab-stats'

/** USER-FUNC-0237 — 홈 카드·현황 탭과 동일 집계. 유형별 최대 건수 상한. */
export const MYPAGE_PROGRAM_STATS_FETCH_SIZE = 100

function mapListItems(
  rows: Awaited<ReturnType<typeof fetchMyProgramApplications>>['items'],
) {
  return (rows ?? []).flatMap(row => {
    const mapped = mapPortalProgramApplicationListItem(row)
    return mapped ? [mapped] : []
  })
}

export async function fetchMypageProgramStatsFromApplications(
  signal?: AbortSignal,
): Promise<MypageProgramStats> {
  const pages = await Promise.all(
    PROGRAM_APPLICATION_TYPES.map((applicationType: ProgramApplicationType) =>
      fetchMyProgramApplications(
        { applicationType, page: 0, size: MYPAGE_PROGRAM_STATS_FETCH_SIZE },
        signal,
      ),
    ),
  )
  const items = pages.flatMap(page => mapListItems(page.items))
  return summarizeMypageProgramStatsFromApplications(items)
}

import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  patchUjatOrganizationApplicationTempAssignmentStatus,
} from './organization-application-list-cache'
import { queryKeys as ujatQueryKeys } from './query-keys'
import type { UjatInstitutionApplicationsPage } from './applications-service'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

function row(partial: Partial<UjatInstitutionApplicationRow> & Pick<UjatInstitutionApplicationRow, 'id'>): UjatInstitutionApplicationRow {
  return {
    regionKey: 'SEOUL',
    no: 1,
    institutionName: '테스트학교',
    tempAssignmentStatus: 'evaluation_pending',
    gradeClassCounts: [],
    totalClassCount: 1,
    scheduleSlots: {},
    preferredScheduleIdByIso: {},
    sessionIsoDates: [],
    teacherName: '교사',
    ...partial,
  }
}

describe('patchUjatOrganizationApplicationTempAssignmentStatus', () => {
  it('목록 infinite cache의 tempAssignmentStatus만 갱신한다', () => {
    const queryClient = new QueryClient()
    const listKey = ujatQueryKeys.organizationApplications('186496', {
      educationRegionCode: 'SEOUL',
    })
    queryClient.setQueryData(listKey, {
      pages: [
        {
          rows: [
            row({ id: '1691549', tempAssignmentStatus: 'evaluation_pending' }),
            row({ id: '2', tempAssignmentStatus: 'temp_assigned' }),
          ],
          page: 0,
          size: 20,
          totalElements: 2,
          hasMore: false,
        } satisfies UjatInstitutionApplicationsPage,
      ],
      pageParams: [0],
    })

    patchUjatOrganizationApplicationTempAssignmentStatus(
      queryClient,
      '186496',
      ['1691549'],
      'application_rejected'
    )

    const next = queryClient.getQueryData<{
      pages: UjatInstitutionApplicationsPage[]
    }>(listKey)
    expect(next?.pages[0]?.rows[0]?.tempAssignmentStatus).toBe('application_rejected')
    expect(next?.pages[0]?.rows[1]?.tempAssignmentStatus).toBe('temp_assigned')
  })
})

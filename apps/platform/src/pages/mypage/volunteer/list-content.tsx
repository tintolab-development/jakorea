import { useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterVolunteerStatusApplications,
  getMockEducationApplications,
  getMockEducationApplicationsVersion,
  listEducationApplications,
  subscribeMockEducationApplications,
  useMyProgramApplications,
  volunteerApplicationDetailPath,
  type EducationApplicationListParams,
} from '@/features/mypage'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFPagination, PFText } from '@/shared/ui'
import styles from '../education/page.module.css'

type VolunteerListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
}

export function VolunteerListContent({ params, onParamsChange }: VolunteerListContentProps) {
  const navigate = useNavigate()
  const remoteApplications = useMyProgramApplications('volunteer')
  const applicationsVersion = useSyncExternalStore(
    subscribeMockEducationApplications,
    getMockEducationApplicationsVersion,
    getMockEducationApplicationsVersion,
  )
  const mockEnabled = useShouldUsePlatformMockData()

  const { items, totalPages, currentPage, totalElements } = useMemo(() => {
    const sourceItems = remoteApplications.isRemoteEnabled
      ? remoteApplications.items
      : filterVolunteerStatusApplications(getMockEducationApplications())
    return listEducationApplications(sourceItems, {
      tab: params.tab,
      page: params.page,
      pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
    })
  }, [
    applicationsVersion,
    mockEnabled,
    params.page,
    params.tab,
    remoteApplications.isRemoteEnabled,
    remoteApplications.items,
  ])

  if (remoteApplications.isRemoteEnabled && remoteApplications.isLoading) {
    return null
  }

  return (
    <>
      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map(item => (
            <EducationApplicationListItemRow
              key={`${item.applicationType ?? 'mock'}:${item.id}`}
              item={item}
              onClick={() =>
                navigate(volunteerApplicationDetailPath(item.id, item.applicationType), {
                  state: {
                    volunteerListPath: `${window.location.pathname}${window.location.search}`,
                  },
                })
              }
            />
          ))}
        </div>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
          해당하는 프로그램이 없습니다.
        </PFText>
      )}

      {totalElements > 0 ? (
        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => onParamsChange({ page })}
            ariaLabel="봉사현황 페이지"
          />
        </div>
      ) : null}
    </>
  )
}

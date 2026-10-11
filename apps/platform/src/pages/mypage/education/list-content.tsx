import { useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  educationApplicationDetailPath,
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterEducationStatusApplications,
  getMockEducationApplications,
  getMockEducationApplicationsVersion,
  listEducationApplications,
  subscribeMockEducationApplications,
  useMyProgramApplications,
  type EducationApplicationListParams,
  type EducationDisplayStatusAudience,
  EducationApplicationListSkeleton,
} from '@/features/mypage'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFPagination, PFText } from '@/shared/ui'
import styles from './page.module.css'

type EducationListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
  statusAudience?: EducationDisplayStatusAudience
}

export function EducationListContent({
  params,
  onParamsChange,
  statusAudience = 'general',
}: EducationListContentProps) {
  const navigate = useNavigate()
  const remoteApplications = useMyProgramApplications('education')
  const applicationsVersion = useSyncExternalStore(
    subscribeMockEducationApplications,
    getMockEducationApplicationsVersion,
    getMockEducationApplicationsVersion,
  )
  const mockEnabled = useShouldUsePlatformMockData()

  const { items, totalPages, currentPage, totalElements } = useMemo(() => {
    const sourceItems = remoteApplications.isRemoteEnabled
      ? remoteApplications.items
      : filterEducationStatusApplications(getMockEducationApplications())
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
    return <EducationApplicationListSkeleton rowCount={3} />
  }

  return (
    <>
      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map(item => (
            <EducationApplicationListItemRow
              key={`${item.applicationType ?? 'mock'}:${item.id}`}
              item={item}
              statusAudience={statusAudience}
              onClick={() =>
                navigate(educationApplicationDetailPath(item.id, item.applicationType), {
                  state: {
                    educationListPath: `${window.location.pathname}${window.location.search}`,
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
            ariaLabel="교육현황 페이지"
          />
        </div>
      ) : null}
    </>
  )
}

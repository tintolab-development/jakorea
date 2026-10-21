import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterVolunteerStatusApplications,
  listEducationApplications,
  useMyProgramApplications,
  volunteerApplicationDetailPath,
  type EducationApplicationListParams,
  EducationApplicationListSkeleton,
} from '@/features/mypage'
import { PFEmptyState, PFPagination } from '@/shared/ui'
import styles from '../education/page.module.css'

type VolunteerListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
}

export function VolunteerListContent({ params, onParamsChange }: VolunteerListContentProps) {
  const navigate = useNavigate()
  const remoteApplications = useMyProgramApplications('volunteer')

  const { items, totalPages, currentPage, totalElements } = useMemo(() => {
    const sourceItems = remoteApplications.isRemoteEnabled
      ? remoteApplications.items
      : filterVolunteerStatusApplications([])
    return listEducationApplications(sourceItems, {
      tab: params.tab,
      page: params.page,
      pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
    })
  }, [params.page, params.tab, remoteApplications.isRemoteEnabled, remoteApplications.items])

  if (remoteApplications.isRemoteEnabled && remoteApplications.isLoading) {
    return <EducationApplicationListSkeleton rowCount={3} />
  }

  return (
    <>
      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map(item => (
            <EducationApplicationListItemRow
              key={`${item.applicationType ?? 'application'}:${item.id}`}
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
        <PFEmptyState
          title="해당하는 프로그램이 없어요"
          description="신청한 프로그램이 생기면 이곳에서 확인할 수 있어요."
        />
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

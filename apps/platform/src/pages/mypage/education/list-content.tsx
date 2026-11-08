import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  educationApplicationDetailPath,
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterEducationStatusApplications,
  hasTeacherMypageProfile,
  listEducationApplications,
  useMyProgramApplications,
  useMypageMember,
  type EducationApplicationListParams,
  type EducationDisplayStatusAudience,
  EducationApplicationListSkeleton,
} from '@/features/mypage'
import { PFEmptyState, PFPagination } from '@/shared/ui'
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
  const member = useMypageMember()
  const isTeacher = hasTeacherMypageProfile(member.profile)
  const remoteApplications = useMyProgramApplications('education', {
    tab: params.tab,
    page: params.page,
    pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
  })

  const { items, totalPages, currentPage, totalElements } = useMemo(() => {
    if (remoteApplications.isRemoteEnabled && remoteApplications.isServerPaged) {
      return {
        items: remoteApplications.items,
        totalPages: remoteApplications.totalPages,
        currentPage: remoteApplications.currentPage,
        totalElements: remoteApplications.totalElements,
      }
    }

    const sourceItems = remoteApplications.isRemoteEnabled
      ? remoteApplications.items
      : filterEducationStatusApplications([])
    return listEducationApplications(sourceItems, {
      tab: params.tab,
      page: params.page,
      pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
    })
  }, [
    params.page,
    params.tab,
    remoteApplications.currentPage,
    remoteApplications.isRemoteEnabled,
    remoteApplications.isServerPaged,
    remoteApplications.items,
    remoteApplications.totalElements,
    remoteApplications.totalPages,
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
              key={`${item.applicationType ?? 'application'}:${item.id}`}
              item={item}
              statusAudience={statusAudience}
              isTeacher={isTeacher}
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
            ariaLabel="교육현황 페이지"
          />
        </div>
      ) : null}
    </>
  )
}

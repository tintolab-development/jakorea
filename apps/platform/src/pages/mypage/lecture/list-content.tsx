import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterLectureStatusApplications,
  listEducationApplications,
  lectureApplicationDetailPath,
  useMyProgramApplications,
  type EducationApplicationListParams,
  EducationApplicationListSkeleton,
} from '@/features/mypage'
import { PFPagination, PFText } from '@/shared/ui'
import styles from '../education/page.module.css'

type LectureListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
}

export function LectureListContent({ params, onParamsChange }: LectureListContentProps) {
  const navigate = useNavigate()
  const remoteApplications = useMyProgramApplications('lecture', {
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
      : filterLectureStatusApplications([])
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
              onClick={() =>
                navigate(lectureApplicationDetailPath(item.id, item.applicationType), {
                  state: {
                    lectureListPath: `${window.location.pathname}${window.location.search}`,
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
            ariaLabel="강의현황 페이지"
          />
        </div>
      ) : null}
    </>
  )
}

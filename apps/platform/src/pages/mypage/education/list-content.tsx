import { useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  educationApplicationDetailPath,
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  getMockEducationApplications,
  getMockEducationApplicationsVersion,
  listEducationApplications,
  subscribeMockEducationApplications,
  type EducationApplicationListParams,
} from '@/features/mypage'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFPagination, PFText } from '@/shared/ui'
import styles from './page.module.css'

type EducationListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
}

export function EducationListContent({ params, onParamsChange }: EducationListContentProps) {
  const navigate = useNavigate()
  const applicationsVersion = useSyncExternalStore(
    subscribeMockEducationApplications,
    getMockEducationApplicationsVersion,
    getMockEducationApplicationsVersion,
  )
  const mockEnabled = useShouldUsePlatformMockData()

  const { items, totalPages, currentPage, totalElements } = useMemo(
    () =>
      listEducationApplications(getMockEducationApplications(), {
        tab: params.tab,
        page: params.page,
        pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
      }),
    [applicationsVersion, mockEnabled, params.page, params.tab],
  )

  return (
    <>
      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map(item => (
            <EducationApplicationListItemRow
              key={item.id}
              item={item}
              onClick={() => navigate(educationApplicationDetailPath(item.id))}
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

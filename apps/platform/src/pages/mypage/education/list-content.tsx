import { useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  educationApplicationDetailPath,
  EDUCATION_APPLICATION_PAGE_SIZE,
  EducationApplicationListItemRow,
  filterEducationStatusApplications,
  getMockEducationApplications,
  getMockEducationApplicationsVersion,
  lectureApplicationDetailPath,
  listEducationApplications,
  resolveApplicationRole,
  subscribeMockEducationApplications,
  volunteerApplicationDetailPath,
  type EducationApplicationListItem,
  type EducationApplicationListParams,
} from '@/features/mypage'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFPagination, PFText } from '@/shared/ui'
import styles from './page.module.css'

type EducationListContentProps = {
  params: EducationApplicationListParams
  onParamsChange: (next: Partial<EducationApplicationListParams>) => void
}

/**
 * 역할 기반 목적지 경로 직접 계산 — 상세 페이지의 redirect guard로 우회하면
 * `/mypage/education/:id` → `/mypage/volunteer(또는 lectures)/:id` 순으로 URL이
 * 한 번 더 바뀌는 깜빡임이 생기므로, 목록 클릭 시점에 최종 경로로 바로 이동한다.
 */
function resolveEducationListItemDetailPath(item: EducationApplicationListItem): string {
  const role = resolveApplicationRole(item)
  if (role === 'volunteer') return volunteerApplicationDetailPath(item.id)
  if (role === 'instructor') return lectureApplicationDetailPath(item.id)
  return educationApplicationDetailPath(item.id)
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
      listEducationApplications(
        filterEducationStatusApplications(getMockEducationApplications()),
        {
          tab: params.tab,
          page: params.page,
          pageSize: EDUCATION_APPLICATION_PAGE_SIZE,
        },
      ),
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
              onClick={() => {
                const path = resolveEducationListItemDetailPath(item)
                if (path === educationApplicationDetailPath(item.id)) {
                  navigate(path, {
                    state: {
                      educationListPath: `${window.location.pathname}${window.location.search}`,
                    },
                  })
                  return
                }
                navigate(path)
              }}
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

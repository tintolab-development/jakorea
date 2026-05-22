import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import type { EducationProgressHalfKey } from '../ujat-education-progress-tabs'
import { UjatAddVolunteerModal } from './add-volunteer-modal'
import { UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_FIELDS } from './filter-fields'
import { UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X } from './columns'
import { useUjatEducationProgressVolunteers } from './use-ujat-education-progress-volunteers'
import type { UjatEducationProgressVolunteerRow } from './types'
import './ujat-education-progress-volunteers-section.css'

export function UjatEducationProgressVolunteersSection({
  half,
  onStartAddRegistration,
  onBindRegisterVolunteer,
}: {
  half: EducationProgressHalfKey
  /** 회원 선택 후 대리 작성 풀페이지 폼으로 이동 */
  onStartAddRegistration: (memberId: string) => void
  /** 풀페이지 폼 완료 시 목록에 반영할 등록 함수 연결 */
  onBindRegisterVolunteer?: (register: (memberId: string) => void) => void
}) {
  const { showAlert } = useCmsAlert()
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X)
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false)

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    resetHalfState,
    memberOptions,
    addVolunteerFromMember,
  } = useUjatEducationProgressVolunteers(half)

  useEffect(() => {
    resetHalfState()
    setAddVolunteerModalOpen(false)
  }, [half, resetHalfState])

  useEffect(() => {
    onBindRegisterVolunteer?.(addVolunteerFromMember)
  }, [addVolunteerFromMember, onBindRegisterVolunteer])

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showComingSoon = () => {
    showAlert({
      title: '안내',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }

  const showNoMemberSelectedAlert = useCallback(() => {
    showAlert({
      title: '안내',
      content: '추가 등록할 회원을 선택해 주세요.',
    })
  }, [showAlert])

  return (
    <div className="ujat-education-progress-volunteers">
      <FilterTableLayout
        className="ujat-education-progress-volunteers__filter-layout"
        bordered={false}
        fields={UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="참여 봉사자 목록"
        description={`${tableData.length}건`}
        actions={
          <div className="ujat-education-progress-volunteers__actions">
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={180}
              icon={<DownloadOutlined />}
              onClick={showComingSoon}
            >
              활동인증서 발급
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={210}
              icon={<DownloadOutlined />}
              onClick={showComingSoon}
            >
              수료증/참여인증서 발급
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={220}
              icon={<DownloadOutlined />}
              onClick={showComingSoon}
            >
              1365 봉사시간 등록 양식
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              width={140}
              onClick={() => setAddVolunteerModalOpen(true)}
            >
              봉사자 등록
            </CmsButton>
          </div>
        }
      >
        <div ref={tableWrapRef} className="ujat-education-progress-volunteers__table-wrap">
          <Table<UjatEducationProgressVolunteerRow>
            rowKey="id"
            className="cms-data-table ujat-education-progress-volunteers__table"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: tableScrollX }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
          />
        </div>
      </FilterTableLayout>

      <UjatAddVolunteerModal
        open={addVolunteerModalOpen}
        onCancel={() => setAddVolunteerModalOpen(false)}
        memberOptions={memberOptions}
        onNoMemberSelected={showNoMemberSelectedAlert}
        onAdd={memberId => {
          setAddVolunteerModalOpen(false)
          onStartAddRegistration(memberId)
        }}
      />
    </div>
  )
}

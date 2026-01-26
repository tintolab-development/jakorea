/**
 * 매칭 목록 페이지
 * Phase 0.3.6: 매칭 관리 UI
 * Phase 4.4: 캘린더/목록 뷰 전환 및 엑셀 다운로드 (FR-F03)
 * Task 3.3.2: 실제 매칭 데이터 연동, 캘린더/목록 동기화, 날짜 클릭 상세 모달
 */

import { useState, useMemo } from 'react'
import { Button, Space, Modal, Typography, Radio, Tabs, List, Tag } from 'antd'
import { UserAddOutlined, CalendarOutlined, UnorderedListOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { MatchingList } from '@/features/matching/ui/matching-list'
import { MatchingCalendarView } from '@/features/matching/ui/matching-calendar-view'
import { MatchingStatusList } from '@/features/matching/ui/matching-status-list'
import { MatchingDetailDrawer } from '@/features/matching/ui/matching-detail-drawer'
import { MatchingForm } from '@/features/matching/ui/matching-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { useMatchingManagement } from '@/features/matching/hooks/use-matching-management'
import { useMatchingStatus } from '@/features/matching/hooks/use-matching-status'
import type { MatchingStatusItem } from '@/entities/matching/api/matching-status-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { StatusConfig } from '@/shared/ui/status-badge'
import './matching-list-page.css'

const statusConfig: Record<MatchingStatusItem['status'], StatusConfig> = {
  PENDING: { label: '대기', color: 'orange' },
  CONFIRMED: { label: '확정', color: 'green' },
  COMPLETED: { label: '완료', color: 'blue' },
}

export function MatchingListPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [viewMode, setViewMode] = useState<'management' | 'status'>('management')
  const [statusViewMode, setStatusViewMode] = useState<'calendar' | 'list'>('list')
  const [statusViewMonth, setStatusViewMonth] = useState(() => dayjs())
  const [dateDetailOpen, setDateDetailOpen] = useState(false)
  const [dateDetailDate, setDateDetailDate] = useState<string | null>(null)
  const [dateDetailItems, setDateDetailItems] = useState<MatchingStatusItem[]>([])

  const statusFilters = useMemo(() => {
    if (viewMode !== 'status') return null
    const start = statusViewMonth.startOf('month').format('YYYY-MM-DD')
    const end = statusViewMonth.endOf('month').format('YYYY-MM-DD')
    return { startDate: start, endDate: end }
  }, [viewMode, statusViewMonth])

  const {
    matchings,
    loading,
    selectedMatching,
    selectedProgramId,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingMatching,
    setProgramFilter,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    submitForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    confirmMatching,
    requestCancel,
  } = useMatchingManagement()

  const {
    statusItems,
    calendarData,
    loading: statusLoading,
    fetchStatusList,
    exportToExcel,
  } = useMatchingStatus({ filters: statusFilters })

  const handleStatusDateClick = (date: string, items: MatchingStatusItem[]) => {
    setDateDetailDate(date)
    setDateDetailItems(items)
    setDateDetailOpen(true)
  }

  const closeDateDetail = () => {
    setDateDetailOpen(false)
    setDateDetailDate(null)
    setDateDetailItems([])
  }

  return (
    <div>
      <Space className="matching-list-header">
        <div>
          <h1 className="matching-list-title">매칭 관리</h1>
          <Typography.Text type="secondary">
            프로그램별 강사 매칭 현황을 관리합니다.
          </Typography.Text>
        </div>
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => openForm()}>
            매칭 등록
          </Button>
        )}
      </Space>

      <Tabs
        activeKey={viewMode}
        onChange={key => setViewMode(key as 'management' | 'status')}
        items={[
          {
            key: 'management',
            label: '매칭 관리',
            children: (
              <MatchingList
                matchings={matchings}
                loading={loading}
                selectedProgramId={selectedProgramId}
                onProgramChange={setProgramFilter}
                onView={openDrawer}
                onEdit={openForm}
                onDelete={openDeleteConfirm}
                onConfirm={confirmMatching}
                onCancel={requestCancel}
              />
            ),
          },
          {
            key: 'status',
            label: '매칭 현황',
            children: (
              <div>
                <div style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, textAlign: 'right' }}>
                  <Space wrap>
                    <Radio.Group
                      value={statusViewMode}
                      onChange={e => setStatusViewMode(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value="calendar">
                        <CalendarOutlined /> 캘린더
                      </Radio.Button>
                      <Radio.Button value="list">
                        <UnorderedListOutlined /> 목록
                      </Radio.Button>
                    </Radio.Group>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => fetchStatusList()}
                      loading={statusLoading}
                    >
                      새로고침
                    </Button>
                  </Space>
                </div>

                {statusViewMode === 'calendar' ? (
                  <MatchingCalendarView
                    calendarData={calendarData}
                    value={statusViewMonth}
                    onPanelChange={setStatusViewMonth}
                    onDateClick={handleStatusDateClick}
                    loading={statusLoading}
                  />
                ) : (
                  <MatchingStatusList
                    data={statusItems}
                    loading={statusLoading}
                    onExport={exportToExcel}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <MatchingDetailDrawer
        open={drawerOpen}
        matching={selectedMatching}
        onClose={closeDrawer}
        onEdit={() => selectedMatching && openForm(selectedMatching)}
        onDelete={() => selectedMatching && openDeleteConfirm(selectedMatching)}
        onConfirm={() => selectedMatching && confirmMatching(selectedMatching)}
        onCancel={() => selectedMatching && requestCancel(selectedMatching)}
        loading={loading}
      />

      <Modal
        title={editingMatching ? '매칭 수정' : '매칭 등록'}
        open={formModalOpen}
        onCancel={closeForm}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.large}
        zIndex={1001}
      >
        <MatchingForm
          matching={editingMatching || undefined}
          onSubmit={submitForm}
          onCancel={closeForm}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="매칭 삭제"
        content={MESSAGES.confirm.delete}
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
        confirmText="삭제"
        danger
      />

      <Modal
        title={dateDetailDate ? `${dateDetailDate} 매칭 일정` : '매칭 일정'}
        open={dateDetailOpen}
        onCancel={closeDateDetail}
        footer={null}
        width={520}
      >
        {dateDetailDate && (
          <List
            size="small"
            dataSource={dateDetailItems}
            renderItem={item => (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space wrap>
                    <span style={{ fontWeight: 500 }}>{item.schoolName}</span>
                    <Tag>{item.programName}</Tag>
                    <StatusBadge status={item.status} statusConfig={statusConfig} />
                  </Space>
                  <Space>
                    {item.instructors.map(inst => (
                      <Tag key={inst.id} color={inst.role === 'LEAD' ? 'blue' : 'default'}>
                        {inst.role === 'LEAD' ? '대표' : '보조'} {inst.name}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  )
}

/**
 * 매칭 목록 페이지
 * Phase 0.3.6: 매칭 관리 UI
 * Phase 4.4: 캘린더/목록 뷰 전환 및 엑셀 다운로드 (FR-F03)
 * Phase 2: 리팩토링 패턴 적용
 */

import { useState } from 'react'
import { Button, Space, Modal, Typography, Radio, Tabs } from 'antd'
import { UserAddOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
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
import './matching-list-page.css'

export function MatchingListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [viewMode, setViewMode] = useState<'management' | 'status'>('management')
  const [statusViewMode, setStatusViewMode] = useState<'calendar' | 'list'>('list')

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

  const { statusItems, loading: statusLoading, exportToExcel } = useMatchingStatus()

  const handleStatusDateClick = (date: string, items: MatchingStatusItem[]) => {
    // 날짜 클릭 시 상세 정보 표시 (추후 구현)
    console.log('Date clicked:', date, items)
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
                </div>

                {statusViewMode === 'calendar' ? (
                  <MatchingCalendarView onDateClick={handleStatusDateClick} />
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
    </div>
  )
}

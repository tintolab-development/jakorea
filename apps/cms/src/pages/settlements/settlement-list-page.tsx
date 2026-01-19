/**
 * 정산 목록 페이지
 * Phase 0.4.1: 정산 기본 리스트 UI
 * - 관리자 화면에서 리스트/캘린더 두 가지 형태로 보기 제공
 */

import { Button, Space, Modal, Card, Select, Tabs, Segmented, Typography } from 'antd'
import { PlusOutlined, CalendarOutlined, SettingOutlined, TableOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { SettlementList } from '@/features/settlement/ui/settlement-list'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { SettlementForm } from '@/features/settlement/ui/settlement-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import type { Settlement } from '@/types/domain'
import dayjs from 'dayjs'
import { useSettlementManagement, type SettlementTabKey, type SettlementViewMode } from '@/features/settlement/hooks/use-settlement-management'
import './settlement-list-page.css'

export function SettlementListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'
  const {
    settlements,
    loading,
    viewMode,
    activeTab,
    selectedPeriod,
    availablePeriods,
    filteredSettlements,
    monthlySettlements,
    tabCounts,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingSettlement,
    selectedSettlement,
    setViewMode,
    setTab,
    setPeriod,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    submitForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    changeStatus,
    handleCalendarSelect,
  } = useSettlementManagement()

  return (
    <div>
      <Space className="settlement-list-header">
        <div>
          <h1 className="settlement-list-title">{categoryName}</h1>
          <Typography.Text type="secondary">
            정산 내역을 관리하고 상태를 변경합니다.
          </Typography.Text>
        </div>
        <Space className="settlement-list-actions">
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as SettlementViewMode)}
            options={[
              {
                label: (
                  <span className="settlement-list-segmented-label">
                    <TableOutlined className="settlement-list-segmented-icon" />
                    목록 보기
                  </span>
                ),
                value: 'list',
                title: '정산 목록을 테이블 형태로 확인합니다. 상세 정보와 상태 변경이 용이합니다.',
              },
              {
                label: (
                  <span className="settlement-list-segmented-label">
                    <CalendarOutlined className="settlement-list-segmented-icon" />
                    캘린더 보기
                  </span>
                ),
                value: 'calendar',
                title: '정산 일정을 캘린더 형태로 확인합니다. 기간별 정산 현황을 한눈에 파악할 수 있습니다.',
              },
            ]}
          />
          <Button icon={<CalendarOutlined />} onClick={() => navigate('/settlements/monthly')}>
            월별 정산 관리
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/settlements/calculation-settings')}>
            산출 로직 설정
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            정산 등록
          </Button>
        </Space>
      </Space>

      {/* 상태별 탭 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setTab(key as SettlementTabKey)}
        items={[
          {
            key: 'all',
            label: `전체${tabCounts.all > 0 ? ` (${tabCounts.all})` : ''}`,
          },
          {
            key: 'pending',
            label: `신청 대기${tabCounts.pending > 0 ? ` (${tabCounts.pending})` : ''}`,
          },
          {
            key: 'review',
            label: `확인 대기${tabCounts.review > 0 ? ` (${tabCounts.review})` : ''}`,
          },
          {
            key: 'paid',
            label: `지급 완료${tabCounts.paid > 0 ? ` (${tabCounts.paid})` : ''}`,
          },
          {
            key: 'overview',
            label: '전체 현황',
          },
        ]}
        style={{ marginBottom: 16 }}
      />

      {viewMode === 'list' && (
        <>
          {activeTab === 'overview' ? (
            <Card title="전체 정산 현황 캘린더">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space>
                  <span>기간 선택:</span>
                  <Select
                    value={selectedPeriod}
                    onChange={setPeriod}
                    className="settlement-list-period-select"
                    options={availablePeriods.map(p => ({
                      label: dayjs(p).format('YYYY년 MM월'),
                      value: p,
                    }))}
                  />
                </Space>
                <SettlementCalendar
                  settlements={settlements}
                  onDateSelect={handleCalendarSelect}
                  selectedPeriod={selectedPeriod}
                />
              </Space>
            </Card>
          ) : (
            <SettlementList
              data={filteredSettlements}
              loading={loading}
              onView={openDrawer}
              onEdit={openForm}
              onDelete={openDeleteConfirm}
              onStatusChange={changeStatus}
            />
          )}
        </>
      )}

      {viewMode === 'calendar' && (
        <Card title="정산 캘린더">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space>
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                onChange={setPeriod}
                className="settlement-list-period-select"
                options={availablePeriods.map(p => ({
                  label: dayjs(p).format('YYYY년 MM월'),
                  value: p,
                }))}
              />
            </Space>
            <SettlementCalendar
              settlements={activeTab === 'overview' ? settlements : monthlySettlements}
              onDateSelect={handleCalendarSelect}
              selectedPeriod={selectedPeriod}
            />
          </Space>
        </Card>
      )}

      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={closeDrawer}
        onEdit={() => {
          if (selectedSettlement) {
            openForm(selectedSettlement)
          }
        }}
        onDelete={() => {
          if (selectedSettlement) {
            closeDrawer()
            openDeleteConfirm(selectedSettlement)
          }
        }}
        onStatusChange={async (status: Settlement['status']) => {
          if (selectedSettlement) {
            await changeStatus(selectedSettlement, status)
          }
        }}
        loading={loading}
      />

      <Modal
        open={formModalOpen}
        title={editingSettlement ? '정산 수정' : '정산 등록'}
        onCancel={closeForm}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <SettlementForm
          settlement={editingSettlement || undefined}
          onSubmit={submitForm}
          onCancel={closeForm}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="정산 삭제"
        content="정말 이 정산을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
        confirmText="삭제"
        danger
      />
    </div>
  )
}


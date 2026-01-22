/**
 * 지급조서/이체리스트 목록 페이지
 */

import { useEffect } from 'react'
import { Button, Modal, Space, Tooltip, Typography, Input } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { PaymentStatementList } from '@/features/settlement/ui/payment-statement-list'
import { usePaymentStatements } from '@/features/settlement/hooks/use-payment-statements'
import { useTransferListExport } from '@/features/settlement/hooks/use-transfer-list-export'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMasterAdmin } from '@/shared/utils/permissions'
import './payment-statement-list-page.css'

export function PaymentStatementListPage() {
  const location = useLocation()
  const { user } = useAuthStore()

  const categoryName = getCategoryNameByPath(location.pathname, 3) || '지급조서/이체리스트'
  // MASTER 관리자 또는 OWNER 역할을 가진 관리자만 내보내기 가능
  const canExport = Boolean(
    isMasterAdmin(user) ||
    (user?.role === 'ADMIN' && user?.programRoles && Object.values(user.programRoles).includes('OWNER'))
  )

  const {
    filteredStatements,
    loading,
    filters,
    availablePeriods,
    statusOptions,
    transferRows,
    fetchStatements,
    setFilters,
    resetFilters,
    downloadStatement,
  } = usePaymentStatements()

  const {
    isOpen,
    password,
    loading: exportLoading,
    openModal,
    closeModal,
    setPassword,
    confirmExport,
  } = useTransferListExport(transferRows, canExport)

  useEffect(() => {
    fetchStatements()
  }, [fetchStatements])

  return (
    <div>
      <Space className="payment-statement-list-header">
        <div>
          <h1 className="payment-statement-list-title">{categoryName}</h1>
          <Typography.Text type="secondary">
            지급조서를 관리하고 이체리스트를 다운로드합니다.
          </Typography.Text>
        </div>
        <Tooltip
          title={
            canExport
              ? '암호를 설정해 이체리스트를 다운로드합니다.'
              : 'OWNER 권한에서만 다운로드할 수 있습니다.'
          }
        >
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={openModal}
            disabled={!canExport}
          >
            이체리스트 다운로드
          </Button>
        </Tooltip>
      </Space>

      <PaymentStatementList
        data={filteredStatements}
        loading={loading}
        availablePeriods={availablePeriods}
        statusOptions={statusOptions}
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={resetFilters}
        onDownload={downloadStatement}
      />

      <Modal
        title="이체리스트 다운로드"
        open={isOpen}
        onCancel={closeModal}
        onOk={confirmExport}
        okText="다운로드"
        confirmLoading={exportLoading}
      >
        <Typography.Paragraph>
          이체리스트 파일에 사용할 암호를 입력해주세요.
        </Typography.Paragraph>
        <Input.Password
          placeholder="암호 입력"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        <Typography.Text type="secondary" className="payment-statement-list-modal__note">
          Mock 환경에서는 암호가 파일에 실제로 적용되지 않습니다.
        </Typography.Text>
      </Modal>
    </div>
  )
}

export default PaymentStatementListPage

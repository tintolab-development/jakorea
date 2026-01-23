/**
 * 지급조서/이체리스트 목록 페이지
 * Phase 2: 리팩토링 패턴 적용
 */

import { useEffect } from 'react'
import { Button, Modal, Space, Tooltip, Typography, Input, Checkbox, Progress, Alert } from 'antd'
import { DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { PaymentStatementList } from '@/features/settlement/ui/payment-statement-list'
import { usePaymentStatements } from '@/features/settlement/hooks/use-payment-statements'
import { useTransferListExport } from '@/features/settlement/hooks/use-transfer-list-export'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
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
    (user?.role === 'ADMIN' &&
      user?.programRoles &&
      Object.values(user.programRoles).includes('OWNER'))
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
    passwordConfirm,
    enableEncryption,
    passwordStrength,
    passwordsMatch,
    loading: exportLoading,
    openModal,
    closeModal,
    setPassword,
    setPasswordConfirm,
    setEnableEncryption,
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
        currentUser={user}
      />

      <Modal
        title={
          <Space>
            <LockOutlined />
            <span>이체리스트 다운로드</span>
          </Space>
        }
        open={isOpen}
        onCancel={closeModal}
        onOk={confirmExport}
        okText="다운로드"
        confirmLoading={exportLoading}
        okButtonProps={{
          disabled: enableEncryption && (!password || !passwordsMatch || password.length < 8),
        }}
        width={LAYOUT_CONSTANTS.widths.modal.small}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Phase 0.4.3: 암호화 옵션 체크박스 */}
          <Checkbox
            checked={enableEncryption}
            onChange={e => setEnableEncryption(e.target.checked)}
          >
            파일 암호화 사용
          </Checkbox>

          {enableEncryption && (
            <>
              <div>
                <Typography.Text strong>암호 입력</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                  (최소 8자 이상)
                </Typography.Text>
                <Input.Password
                  placeholder="암호를 입력하세요"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ marginTop: 8 }}
                />
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                      비밀번호 강도:
                    </Typography.Text>
                    <Progress
                      percent={
                        passwordStrength.strength === 'weak'
                          ? 33
                          : passwordStrength.strength === 'medium'
                            ? 66
                            : 100
                      }
                      status={
                        passwordStrength.strength === 'weak'
                          ? 'exception'
                          : passwordStrength.strength === 'medium'
                            ? 'active'
                            : 'success'
                      }
                      showInfo={false}
                      style={{ marginTop: 4 }}
                    />
                    <Typography.Text
                      type={
                        passwordStrength.strength === 'weak'
                          ? 'danger'
                          : passwordStrength.strength === 'medium'
                            ? 'warning'
                            : 'success'
                      }
                      style={{ fontSize: '12px' }}
                    >
                      {passwordStrength.strength === 'weak'
                        ? '약함'
                        : passwordStrength.strength === 'medium'
                          ? '보통'
                          : '강함'}
                    </Typography.Text>
                  </div>
                )}
              </div>

              <div>
                <Typography.Text strong>암호 확인</Typography.Text>
                <Input.Password
                  placeholder="암호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  style={{ marginTop: 8 }}
                  status={passwordConfirm && !passwordsMatch ? 'error' : ''}
                />
                {passwordConfirm && !passwordsMatch && (
                  <Typography.Text
                    type="danger"
                    style={{ fontSize: '12px', display: 'block', marginTop: 4 }}
                  >
                    암호가 일치하지 않습니다
                  </Typography.Text>
                )}
              </div>

              {password && password.length < 8 && (
                <Alert
                  type="warning"
                  message="암호는 최소 8자 이상이어야 합니다"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}

          {!enableEncryption && (
            <Alert
              type="info"
              message="암호화 없이 다운로드"
              description="파일이 암호화되지 않은 상태로 다운로드됩니다."
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  )
}

export default PaymentStatementListPage

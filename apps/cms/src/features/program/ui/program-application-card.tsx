/**
 * 프로그램 신청 안내 카드 컴포넌트
 */

import { Card, Space, Alert, Typography } from 'antd'
import { StatusDisplay, GuideAlert, SingleCTA } from '@/shared/ui'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { Link } from 'react-router-dom'

const { Paragraph, Text } = Typography

interface ProgramApplicationCardProps {
  applicationAvailable: boolean
  unavailableReason: string | null
  applicationUrl?: string
  applicationPath?: {
    id: string
    pathType: 'google_form' | 'internal'
    googleFormUrl?: string
    guideText?: string
    isActive: boolean
  }
  remainingCapacity?: number
  capacityFull: boolean
  capacityAlmostFull: boolean
  applicationCount: number
  userHasApplied: boolean
  userRole?: string
  isAdmin?: boolean // Phase 0.5.2: 관리자는 신청하기 버튼 숨김
  onApplicationClick: () => void
  onDuplicateAlertOpen?: () => void
  /** FR-C01: 비로그인 시 로그인/회원가입 링크에 넘길 redirect 경로 (예: /programs/:id/apply) */
  applyRedirectPath?: string
}

export function ProgramApplicationCard({
  applicationAvailable,
  unavailableReason,
  applicationUrl,
  applicationPath,
  remainingCapacity,
  capacityFull,
  capacityAlmostFull,
  applicationCount,
  userHasApplied,
  userRole: _userRole, // eslint-disable-line @typescript-eslint/no-unused-vars
  isAdmin = false,
  onApplicationClick,
  applyRedirectPath }: ProgramApplicationCardProps) {
  const { isAuthenticated } = useAuthStore()

  // Phase 0.5.2: 관리자는 신청하기 버튼을 볼 수 없음
  const shouldShowApplicationButton =
    !isAdmin && applicationAvailable && applicationUrl && !userHasApplied

  const loginTo = applyRedirectPath
    ? `/login?redirect=${encodeURIComponent(applyRedirectPath)}`
    : '/login'
  const registerTo = applyRedirectPath
    ? `/register?redirect=${encodeURIComponent(applyRedirectPath)}`
    : '/register'

  return (
    <Card title="신청 안내">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Phase 0.2.1 / FR-C01: 비로그인 사용자 로그인/회원가입 유도 (redirect 연동) */}
        {!isAuthenticated && applicationAvailable && (
          <Alert
            description={
              <span>
                프로그램 신청을 위해 <Link to={loginTo}>로그인</Link> 또는{' '}
                <Link to={registerTo}>회원가입</Link>이 필요합니다.
              </span>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 승인제 안내 */}
        <Alert
          description="신청 후 관리자 승인을 거쳐 참여가 확정됩니다. 승인 결과는 마이페이지에서 확인하실 수 있습니다."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 신청 가능 여부 상태 표시 */}
        {applicationAvailable ? (
          <div>
            <StatusDisplay
              status="available"
              statusLabels={{
                available: '이 프로그램에 신청할 수 있습니다.' }}
              statusColors={{
                available: 'success' }}
            />

            {/* 안내 문구 */}
            {applicationPath && applicationPath.guideText && (
              <GuideAlert text={applicationPath.guideText} type="info" />
            )}

            {/* 정원 정보 */}
            {remainingCapacity !== undefined && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                {capacityFull ? (
                  <Alert
                    type="warning"
                    description={`정원이 마감되었습니다. (잔여: ${remainingCapacity}명)`}
                    showIcon
                    style={{ margin: 0 }}
                  />
                ) : capacityAlmostFull ? (
                  <Alert
                    type="warning"
                    description={`정원이 거의 마감되었습니다. (잔여: ${remainingCapacity}명)`}
                    showIcon
                    style={{ margin: 0 }}
                  />
                ) : (
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    잔여 정원: <Text strong>{remainingCapacity}명</Text>
                  </Text>
                )}
              </div>
            )}

            {/* 단일 CTA - 관리자는 신청하기 버튼 숨김 */}
            {shouldShowApplicationButton && (
              <div style={{ marginTop: 16 }}>
                <SingleCTA
                  label={
                    applicationPath?.pathType === 'google_form' ? '구글폼으로 신청하기' : '신청하기'
                  }
                  onClick={onApplicationClick}
                  type="primary"
                  disabled={capacityFull}
                  block
                  size="large"
                />
              </div>
            )}

            {/* 이미 신청한 경우 */}
            {userHasApplied && (
              <Alert
                type="info"
                description="신청 내역은 '마이페이지 > 내가 신청한 프로그램'에서 확인하실 수 있습니다."
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        ) : (
          <div>
            <StatusDisplay
              status="unavailable"
              statusLabels={{
                unavailable: '현재 이 프로그램에 신청할 수 없습니다.' }}
              statusColors={{
                unavailable: 'error' }}
            />
            <Paragraph style={{ margin: 0, marginTop: 12, fontSize: 14, color: '#8c8c8c' }}>
              {unavailableReason || '프로그램 상태로 인해 신청할 수 없습니다.'}
            </Paragraph>
          </div>
        )}

        {/* 보조 정보 */}
        {applicationCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
            현재 {applicationCount}개의 신청이 접수되었습니다.
          </Text>
        )}
      </Space>
    </Card>
  )
}

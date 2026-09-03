/**
 * Design System — Auth (CMS 로그인 셸과 동일 토큰·레이아웃)
 */

import { useState } from 'react'
import { Form, Input, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'
import { LoginUtilityLinks } from '@/features/auth/ui/login-utility-links'
import { LoginSocialSection } from '@/features/auth/ui/login-social-section'
import { LoginAdminApprovalPendingNotice } from '@/features/auth/ui/login-admin-approval-pending-notice'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { LoadingButton } from '@/shared/ui/loading-button'
import { CmsButton } from '@/shared/ui'
import { DsDemo, DsSection } from './section'
import '@/pages/auth/login-page.css'

const { Text } = Typography

export function AuthSection() {
  const [mfaOpen, setMfaOpen] = useState(false)
  const [form] = Form.useForm()

  return (
    <DsSection
      id="auth"
      title="Auth"
      description="Homepage Admin 로그인·MFA 셸은 CMS Auth 디자인 시스템을 공유합니다. SSOT: auth-shell.css · login-page.css · LoadingButton · MFA 모달."
    >
      <p className="ds-note">
        실화면: <Link to="/login">/login</Link> · Auth는 antd Form + <code>LoadingButton</code>{' '}
        (CmsInput 미사용 — CMS Do/Don&apos;t와 동일).
        <br />
        토큰: <code>--color-mint-01</code>, <code>--main-BK</code>, 카드 600px · radius 16 · 인풋
        높이 52.
      </p>

      <DsDemo label="로그인 카드 (정적 데모)">
        <div className="ds-auth-demo">
          <div className="login-page ds-auth-demo__page">
            <div className="login-card">
              <AuthLogoLink wrapperClassName="login-logo-wrapper" logoClassName="login-logo" />
              <p className="login-notice">
                인가된 관리자만 접속 가능하며, 중요 활동의 경우 로그로 기록됩니다.
              </p>
              <div className="login-form-wrapper">
                <Form
                  form={form}
                  layout="vertical"
                  requiredMark={false}
                  className="login-form"
                  onFinish={() => undefined}
                >
                  <Form.Item
                    name="email"
                    label={<AuthFormLabel>이메일</AuthFormLabel>}
                    rules={[{ required: true, message: '이메일을 입력해 주세요.' }]}
                  >
                    <Input placeholder="이메일 주소를 입력해 주세요" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={<AuthFormLabel>비밀번호</AuthFormLabel>}
                    rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
                  >
                    <Input.Password placeholder="비밀번호를 입력해 주세요" />
                  </Form.Item>
                  <LoginAdminApprovalPendingNotice />
                  <Form.Item className="login-submit-actions">
                    <LoadingButton
                      type="primary"
                      block
                      className="login-submit-btn"
                      htmlType="submit"
                    >
                      로그인하기
                    </LoadingButton>
                    <Text type="secondary" className="login-api-hint">
                      데모 폼입니다. 실제 로그인은 /login 에서 진행하세요.
                    </Text>
                  </Form.Item>
                </Form>
                <LoginUtilityLinks />
                <LoginSocialSection />
              </div>
            </div>
          </div>
        </div>
      </DsDemo>

      <DsDemo label="MFA 모달">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          로그인 MFA 완료 전에는 challenge 유저가 없어 모달 본문이 비어 있을 수 있습니다. 실제
          플로우는 /login 에서 확인하세요.
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="primary" size="large" onClick={() => setMfaOpen(true)}>
            MFA 모달 열기
          </CmsButton>
        </div>
        <MfaVerificationModal open={mfaOpen} onClose={() => setMfaOpen(false)} />
      </DsDemo>
    </DsSection>
  )
}

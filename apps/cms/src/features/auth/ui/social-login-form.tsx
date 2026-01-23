/**
 * 간편인증 로그인 폼
 * Phase 0.1.3: 간편인증 로그인
 */

import { Button, Space, message } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithSocial, type SocialProvider } from '@/entities/user/api/auth-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import './social-login-form.css'

interface SocialLoginFormProps {
  onSuccess?: () => void
}

/**
 * 카카오 로그인 버튼 스타일
 */
const kakaoButtonStyle: React.CSSProperties = {
  backgroundColor: '#FEE500',
  color: '#000000',
  border: 'none',
  height: '50px',
  fontSize: '16px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

/**
 * 네이버 로그인 버튼 스타일
 */
const naverButtonStyle: React.CSSProperties = {
  backgroundColor: '#03C75A',
  color: '#FFFFFF',
  border: 'none',
  height: '50px',
  fontSize: '16px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

export function SocialLoginForm({ onSuccess }: SocialLoginFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const { setAuth } = authStore
  const redirectPath = searchParams.get('redirect')

  const [loading, setLoading] = useState<SocialProvider | null>(null)

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoading(provider)
    try {
      // Mock: 소셜 토큰 생성 (실제로는 OAuth 인증 플로우를 거쳐야 함)
      const mockSocialToken = `mock-${provider}-token-${Date.now()}`

      const response = await loginWithSocial(provider, mockSocialToken)

      // 인증 상태 저장
      setAuth({
        user: response.user,
        token: response.token,
        expiresAt:
          typeof response.expiresAt === 'string'
            ? response.expiresAt
            : response.expiresAt.toString(),
      })

      // MFA 필요 시 처리 (관리자)
      if (response.requiresMfa && response.mfaState) {
        // MFA는 별도 모달에서 처리되므로 여기서는 성공으로 간주
        message.success('로그인 성공')
        if (onSuccess) {
          onSuccess()
        }
        return
      }

      // 역할별 리다이렉트
      const finalRedirectPath = redirectPath || getRedirectPathByRole(response.user)
      message.success('로그인 성공')
      navigate(finalRedirectPath, { replace: true })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      message.error(
        error?.message || `${provider === 'kakao' ? '카카오' : '네이버'} 로그인에 실패했습니다.`
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="social-login-form">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button
          type="primary"
          block
          style={kakaoButtonStyle}
          onClick={() => handleSocialLogin('kakao')}
          loading={loading === 'kakao'}
          disabled={loading !== null}
          icon={<span style={{ fontSize: '20px' }}>K</span>}
        >
          카카오로 시작하기
        </Button>

        <Button
          type="primary"
          block
          style={naverButtonStyle}
          onClick={() => handleSocialLogin('naver')}
          loading={loading === 'naver'}
          disabled={loading !== null}
          icon={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>N</span>}
        >
          네이버로 시작하기
        </Button>
      </Space>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
          소셜 로그인은 Mock으로 구현되었습니다.
          <br />
          실제 OAuth 연동은 백엔드 연동 시 구현됩니다.
        </span>
      </div>
    </div>
  )
}

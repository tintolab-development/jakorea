/**
 * 간편인증 로그인 폼
 * Phase 0.1.3: 간편인증 로그인
 */

import { Space } from 'antd'
import { useState } from 'react'
import type { SocialProvider } from '@/entities/user/api/auth-service'
import { GoogleMarkIcon } from '@/shared/ui/icons'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import './social-login-form.css'

// interface SocialLoginFormProps {
//   onSuccess?: () => void
// }

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

/** 구글 로그인 버튼 (브랜드 가이드에 가까운 흰 배경 + 테두리) */
const googleButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#3c4043',
  border: '1px solid #dadce0',
  height: '50px',
  fontSize: '16px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
}

export function SocialLoginForm() {
  const [loading, setLoading] = useState<SocialProvider | null>(null)

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoading(provider)
    try {
      const authorizeUrl = await cmsSocialAuthClient.startLogin({ provider, intent: 'login' })
      window.location.href = authorizeUrl
    } catch (error: unknown) {
      console.debug('socialLoginForm redirect failed', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="social-login-form">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <AuthLoadingButton
          type="primary"
          block
          style={kakaoButtonStyle}
          onClick={() => handleSocialLogin('kakao')}
          loading={loading === 'kakao'}
          disabled={loading !== null}
          icon={<span style={{ fontSize: '20px' }}>K</span>}
        >
          카카오로 시작하기
        </AuthLoadingButton>

        <AuthLoadingButton
          type="primary"
          block
          style={naverButtonStyle}
          onClick={() => handleSocialLogin('naver')}
          loading={loading === 'naver'}
          disabled={loading !== null}
          icon={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>N</span>}
        >
          네이버로 시작하기
        </AuthLoadingButton>

        <AuthLoadingButton
          type="default"
          block
          className="social-login-google-btn"
          style={googleButtonStyle}
          onClick={() => handleSocialLogin('google')}
          loading={loading === 'google'}
          disabled={loading !== null}
          icon={<GoogleMarkIcon />}
        >
          Google로 시작하기
        </AuthLoadingButton>
      </Space>

    </div>
  )
}

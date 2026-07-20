/**
 * 소셜 회원가입 폼
 * Phase 0.1.3 수정: 회원가입 시 OAuth 연동
 */

import { Space } from 'antd'
import { useState } from 'react'
import type { SocialProvider } from '@/entities/user/api/auth-service'
import { GoogleMarkIcon } from '@/shared/ui/icons'
import { LoadingButton } from '@/shared/ui/loading-button'
import './social-register-form.css'

interface SocialRegisterFormProps {
  onSocialRegister: (provider: SocialProvider, socialData: {
    email?: string
    name?: string
    phone?: string
  }) => void
  disabled?: boolean
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

export function SocialRegisterForm({ onSocialRegister, disabled }: SocialRegisterFormProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null)

  // 소셜 회원가입 처리
  const handleSocialRegister = async (provider: SocialProvider) => {
    setLoading(provider)
    try {
      // Mock: 소셜 인증 플로우 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock: 소셜 정보 가져오기 (실제로는 OAuth 인증 플로우를 거쳐야 함)
      // 더 현실적인 Mock 데이터 생성
      const randomId = Math.random().toString(36).substring(2, 8)
      const mockNames: Record<SocialProvider, string[]> = {
        kakao: ['김카카오', '이카톡', '박카카오', '최카카오', '정카카오'],
        naver: ['김네이버', '이나이버', '박네이버', '최네이버', '정네이버'],
        google: ['김구글', '이지메일', '박크롬', '최드라이브', '정워크스페이스'],
      }
      const randomName = mockNames[provider][Math.floor(Math.random() * mockNames[provider].length)]

      const emailDomain =
        provider === 'kakao' ? 'kakao.com' : provider === 'naver' ? 'naver.com' : 'gmail.com'

      const mockSocialData = {
        email: `${provider}${randomId}@${emailDomain}`,
        name: randomName,
        phone: undefined, // 소셜 로그인에서는 전화번호가 없을 수 있음 (선택사항)
      }
      
      onSocialRegister(provider, mockSocialData)
      } catch (error: unknown) {
      console.debug('socialRegisterForm failed', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="social-register-form">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <LoadingButton
          type="primary"
          block
          style={kakaoButtonStyle}
          onClick={() => handleSocialRegister('kakao')}
          loading={loading === 'kakao'}
          disabled={disabled || loading !== null}
          icon={
            <span style={{ fontSize: '20px' }}>K</span>
          }
        >
          카카오로 가입하기
        </LoadingButton>

        <LoadingButton
          type="primary"
          block
          style={naverButtonStyle}
          onClick={() => handleSocialRegister('naver')}
          loading={loading === 'naver'}
          disabled={disabled || loading !== null}
          icon={
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>N</span>
          }
        >
          네이버로 가입하기
        </LoadingButton>

        <LoadingButton
          type="default"
          block
          className="social-register-google-btn"
          style={googleButtonStyle}
          onClick={() => handleSocialRegister('google')}
          loading={loading === 'google'}
          disabled={disabled || loading !== null}
          icon={<GoogleMarkIcon />}
        >
          Google로 가입하기
        </LoadingButton>
      </Space>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
          소셜 연동은 Mock으로 구현되었습니다.
          <br />
          실제 OAuth 연동은 백엔드 연동 시 구현됩니다.
        </span>
      </div>
    </div>
  )
}

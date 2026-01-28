/**
 * 소셜 회원가입 폼
 * Phase 0.1.3 수정: 회원가입 시 OAuth 연동
 */

import { Button, Space, message } from 'antd'
import { useState } from 'react'
import type { SocialProvider } from '@/entities/user/api/auth-service'

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
      const mockNames = {
        kakao: ['김카카오', '이카톡', '박카카오', '최카카오', '정카카오'],
        naver: ['김네이버', '이나이버', '박네이버', '최네이버', '정네이버'],
      }
      const randomName = mockNames[provider][Math.floor(Math.random() * mockNames[provider].length)]
      
      const mockSocialData = {
        email: `${provider}${randomId}@${provider === 'kakao' ? 'kakao.com' : 'naver.com'}`,
        name: randomName,
        phone: undefined, // 소셜 로그인에서는 전화번호가 없을 수 있음 (선택사항)
      }
      
      onSocialRegister(provider, mockSocialData)
      message.success(`${provider === 'kakao' ? '카카오' : '네이버'} 연동이 완료되었습니다.`)
    } catch (error: any) {
      message.error(error?.message || `${provider === 'kakao' ? '카카오' : '네이버'} 연동에 실패했습니다.`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="social-register-form">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button
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
        </Button>

        <Button
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
        </Button>
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

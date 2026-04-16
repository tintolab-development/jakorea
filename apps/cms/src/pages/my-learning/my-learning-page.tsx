/**
 * 내 학습 관리 페이지
 * 일반 사용자(학교, 강사, 학생)의 index 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { Spin } from 'antd'

export function MyLearningPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    // 역할별로 해당하는 학습 관리 페이지로 리다이렉트
    switch (user.role) {
      case 'INSTRUCTOR':
        navigate('/instructor/schedule', { replace: true })
        break
      case 'INDIVIDUAL':
        navigate('/schedules/my', { replace: true })
        break
      case 'SCHOOL':
        navigate('/school/my-learning', { replace: true })
        break
      default:
        // 관리자나 기타 역할은 대시보드 홈으로
        navigate('/', { replace: true })
        break
    }
  }, [user, navigate])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" />
    </div>
  )
}

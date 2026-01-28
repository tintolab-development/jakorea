/**
 * Index 페이지
 * 역할에 따라 관리자는 Dashboard, 일반 사용자는 역할별 내 학습 관리 페이지로 리다이렉트
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { Dashboard } from '@/pages/dashboard'
import { Spin } from 'antd'

export function IndexPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    // 일반 사용자는 역할별 내 학습 관리 페이지로 바로 리다이렉트
    if (user.role !== 'ADMIN') {
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
          navigate('/login', { replace: true })
          break
      }
    }
  }, [user, navigate])

  // 관리자는 Dashboard 표시
  if (user?.role === 'ADMIN') {
    return <Dashboard />
  }

  // 일반 사용자는 리다이렉트 중이므로 로딩 표시
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

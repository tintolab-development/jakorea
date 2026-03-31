/**
 * `/` 인덱스: ADMIN은 대시보드, 그 외 역할은 역할별 기본 경로로 즉시 이동(LNB가 비어도 홈·로그인 동선 유지).
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

  if (user?.role === 'ADMIN') {
    return <Dashboard />
  }

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

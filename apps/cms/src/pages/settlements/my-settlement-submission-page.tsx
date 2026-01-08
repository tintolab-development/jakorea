/**
 * 강사/봉사자 정산 제출 페이지
 * Phase 6.1.2: 강사/봉사자 정산 제출
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { InstructorSettlementForm } from '@/features/settlement/ui/instructor-settlement-form'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { message } from 'antd'
import type { SettlementFormData } from '@/entities/settlement/model/schema'

export function MySettlementSubmissionPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createSettlement, loading } = useSettlementStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: SettlementFormData) => {
    if (!user?.instructorId && !user?.id) {
      message.error('로그인이 필요합니다')
      return
    }

    setSubmitting(true)
    try {
      await createSettlement({
        ...data,
        instructorId: user.instructorId || user.id,
      })
      message.success('정산이 제출되었습니다')
      navigate('/settlements/my')
    } catch (error) {
      message.error('정산 제출 중 오류가 발생했습니다')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/settlements/my')
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settlements/my')}>
            목록으로
          </Button>
          {/* <h1 style={{ margin: 0 }}>정산 제출</h1> */}
        </Space>
      </Space>

      <Card>
        <InstructorSettlementForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting || loading}
        />
      </Card>
    </div>
  )
}


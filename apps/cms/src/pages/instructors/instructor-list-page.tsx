/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'

export function InstructorListPage() {
  const navigate = useNavigate()
  const { instructors, loading, fetchInstructors } = useInstructorStore()

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>강사 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/instructors/new')}>
          강사 등록
        </Button>
      </Space>
      <InstructorList data={instructors} loading={loading} />
    </div>
  )
}


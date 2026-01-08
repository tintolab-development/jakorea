/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 * Phase 4.2.3: 권한별 UI 컴포넌트 적용
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { PermissionButton } from '@/shared/components'

export function InstructorListPage() {
  const navigate = useNavigate()
  const { instructors, loading, fetchInstructors } = useInstructorStore()

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>강사단 관리</h1>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/instructors/new')}
          allowedRoles={['ADMIN']}
        >
          강사 등록
        </PermissionButton>
      </Space>
      <InstructorList data={instructors} loading={loading} />
    </div>
  )
}









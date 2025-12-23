/**
 * 학교 목록 페이지
 * Phase 1.4: 목록 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SchoolList } from '@/features/school/ui/school-list'
import { useSchoolStore } from '@/features/school/model/school-store'

export function SchoolListPage() {
  const navigate = useNavigate()
  const { schools, loading, fetchSchools } = useSchoolStore()

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>학교 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/schools/new')}>
          학교 등록
        </Button>
      </Space>
      <SchoolList data={schools} loading={loading} />
    </div>
  )
}






/**
 * 학교 목록 페이지
 * Phase 1.4: 목록 페이지
 * 학교 등록을 모달로 변경
 */

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SchoolList } from '@/features/school/ui/school-list'
import { SchoolForm } from '@/features/school/ui/school-form'
import { useSchoolStore } from '@/features/school/model/school-store'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import type { SchoolFormData } from '@/entities/school/model/schema'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

export function SchoolListPage() {
  const location = useLocation()
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const { schools, loading, fetchSchools, createSchool, updateSchool } = useSchoolStore()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<{ id: string; data: SchoolFormData } | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '회원 관리'

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  const handleNewClick = () => {
    setEditingSchool(null)
    setFormModalOpen(true)
  }

  const handleFormSubmit = async (data: SchoolFormData) => {
    setFormLoading(true)
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, data)
        showSuccessMessage('학교 정보가 수정되었습니다')
      } else {
        await createSchool(data)
        showSuccessMessage('학교가 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingSchool(null)
      fetchSchools()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSchool ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'SchoolFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingSchool(null)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            학교 등록
          </Button>
        )}
      </Space>
      <SchoolList data={schools} loading={loading} />

      <Modal
        open={formModalOpen}
        title={editingSchool ? '학교 수정' : '학교 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <SchoolForm
          school={editingSchool ? schools.find(s => s.id === editingSchool.id) : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}









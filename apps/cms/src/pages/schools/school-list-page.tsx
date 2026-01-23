/**
 * 학교 목록 페이지
 * Phase 1.4: 목록 페이지
 * Phase 2: 리팩토링 패턴 적용
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
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
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
  
  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingSchool,
    isEditing: isEditingMode,
  } = useModalState<{ id: string; data: SchoolFormData }>()

  const [formLoading, setFormLoading] = useState(false)

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '회원 관리'

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  const handleNewClick = () => {
    openFormModal()
  }

  const handleFormSubmit = async (data: SchoolFormData) => {
    setFormLoading(true)
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, data)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createSchool(data)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchSchools()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSchool ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'SchoolFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
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
        title={isEditingMode ? '학교 수정' : '학교 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
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









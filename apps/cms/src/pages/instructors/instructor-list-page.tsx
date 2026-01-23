/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 * Phase 4.2.3: 권한별 UI 컴포넌트 적용
 * Phase 2: 리팩토링 패턴 적용
 * 강사 등록을 모달로 변경
 */

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Space, Modal, Drawer } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { PermissionButton } from '@/shared/components'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import type { InstructorFormData } from '@/entities/instructor/model/schema'
import type { Instructor } from '@/types/domain'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'

export function InstructorListPage() {
  const location = useLocation()
  const {
    instructors,
    loading,
    fetchInstructors,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    selectedInstructor,
    setSelectedInstructor,
  } = useInstructorStore()
  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingInstructor,
    isEditing: isEditingMode,
  } = useModalState<{ id: string; data: InstructorFormData }>()

  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerInstructor,
  } = useModalState<Instructor>()

  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  const handleNewClick = () => {
    openFormModal()
  }

  const handleFormSubmit = async (data: InstructorFormData) => {
    setFormLoading(true)
    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.id, data)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createInstructor(data)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingInstructor ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'InstructorFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
  }

  const handleView = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    openDrawer(instructor)
  }

  const handleEdit = (instructor: Instructor) => {
    openFormModal({ id: instructor.id, data: {} as InstructorFormData })
    closeDrawer()
  }

  const handleDelete = async (instructor: Instructor) => {
    setDeleteLoading(true)
    try {
      await deleteInstructor(instructor.id)
      showSuccessMessage(MESSAGES.success.deleted)
      if (selectedInstructor?.id === instructor.id) {
        closeDrawer()
        setSelectedInstructor(null)
      }
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'InstructorDelete',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // prop의 instructor를 우선 사용 (즉시 표시), 없으면 store의 selectedInstructor 사용
  const displayInstructor = drawerInstructor || selectedInstructor || null

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <PermissionButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewClick}
          allowedRoles={['ADMIN']}
          isWriteAction={true}
        >
          강사 등록
        </PermissionButton>
      </Space>
      <InstructorList data={instructors} loading={loading} onView={handleView} />

      <Drawer
        title="강사 상세"
        placement="right"
        width={LAYOUT_CONSTANTS.widths.modal.large}
        open={drawerOpen}
        onClose={() => {
          closeDrawer()
          setSelectedInstructor(null)
        }}
      >
        {displayInstructor && (
          <InstructorDetail
            instructor={displayInstructor}
            onEdit={() => handleEdit(displayInstructor)}
            onDelete={() => handleDelete(displayInstructor)}
            loading={deleteLoading}
          />
        )}
      </Drawer>

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '강사 수정' : '강사 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        destroyOnHidden
      >
        <InstructorForm
          instructor={
            editingInstructor ? instructors.find(i => i.id === editingInstructor.id) : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}

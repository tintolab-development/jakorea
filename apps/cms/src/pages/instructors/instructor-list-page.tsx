/**
 * 강사 목록 페이지
 * Phase 1.2: 목록 페이지
 * Phase 4.2.3: 권한별 UI 컴포넌트 적용
 * 강사 등록을 모달로 변경
 */

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Space, Modal, Drawer, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { InstructorList } from '@/features/instructor/ui/instructor-list'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { PermissionButton } from '@/shared/components'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
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
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerInstructor, setDrawerInstructor] = useState<Instructor | null>(null)
  const [editingInstructor, setEditingInstructor] = useState<{
    id: string
    data: InstructorFormData
  } | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  const handleNewClick = () => {
    setEditingInstructor(null)
    setFormModalOpen(true)
  }

  const handleFormSubmit = async (data: InstructorFormData) => {
    setFormLoading(true)
    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.id, data)
        showSuccessMessage('강사 정보가 수정되었습니다')
      } else {
        await createInstructor(data)
        showSuccessMessage('강사가 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingInstructor(null)
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingInstructor
          ? '수정 중 오류가 발생했습니다'
          : '등록 중 오류가 발생했습니다',
        context: 'InstructorFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingInstructor(null)
  }

  const handleView = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setDrawerInstructor(instructor)
    setDrawerOpen(true)
  }

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor({ id: instructor.id, data: {} as InstructorFormData })
    setDrawerOpen(false)
    setFormModalOpen(true)
  }

  const handleDelete = async (instructor: Instructor) => {
    setDeleteLoading(true)
    try {
      await deleteInstructor(instructor.id)
      message.success('강사가 삭제되었습니다')
      if (selectedInstructor?.id === instructor.id) {
        setDrawerOpen(false)
        setDrawerInstructor(null)
        setSelectedInstructor(null)
      }
      fetchInstructors()
    } catch (error) {
      handleError(error, {
        defaultMessage: '삭제 중 오류가 발생했습니다',
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
        width={792}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDrawerInstructor(null)
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
        title={editingInstructor ? '강사 수정' : '강사 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={600}
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

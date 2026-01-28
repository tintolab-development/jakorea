/**
 * 일정 캘린더 페이지
 * Phase 3.1: 캘린더 뷰 + 일정 관리
 * Phase 2: 리팩토링 패턴 적용
 */

import { useState, useEffect } from 'react'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { ScheduleCalendar } from '@/features/schedule/ui/schedule-calendar'
import { ScheduleForm } from '@/features/schedule/ui/schedule-form'
import { ScheduleDetailDrawer } from '@/features/schedule/ui/schedule-detail-drawer'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useScheduleStore } from '@/features/schedule/model/schedule-store'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import type { Schedule } from '@/types/domain'
import type { ScheduleFormData } from '@/entities/schedule/model/schema'

export function ScheduleCalendarPage() {
  const {
    schedules,
    loading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    checkConflict,
    selectedSchedule: storeSelectedSchedule,
    setSelectedSchedule: setStoreSelectedSchedule,
    clearSelectedSchedule,
  } = useScheduleStore()
  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: selectedSchedule,
    setSelectedItem: setSelectedSchedule,
  } = useModalState<Schedule>()

  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingSchedule,
    isEditing: isEditingMode,
  } = useModalState<Schedule>()

  // Delete 모달 상태 관리
  const {
    open: deleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
    selectedItem: scheduleToDelete,
  } = useModalState<Schedule>()

  const [conflicts, setConflicts] = useState<Schedule[]>([])
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleDateSelect = (date: Dayjs, schedule?: Schedule) => {
    // schedule이 있는 경우: 일정 상세 drawer 열기
    if (schedule) {
      setSelectedSchedule(schedule)
      setStoreSelectedSchedule(schedule) // store에도 동기화
      openDrawer(schedule)
    } else {
      // schedule이 없는 경우 (빈 날짜 셀 클릭): 일정 등록 모달 열기
      // 해당 날짜를 초기값으로 설정
      setInitialDate(date.format('YYYY-MM-DD'))
      openFormModal()
    }
  }

  const handleFormSubmit = async (data: ScheduleFormData) => {
    try {
      // 중복 체크
      const scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        date: data.date,
        instructorId: data.instructorId || undefined,
      }

      const detectedConflicts = checkConflict(scheduleData, editingSchedule?.id)
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts)
        Modal.confirm({
          title: MESSAGES.title.scheduleConflict,
          content: MESSAGES.confirm.scheduleConflict(detectedConflicts.length),
          onOk: async () => {
            if (editingSchedule) {
              await updateSchedule(editingSchedule.id, data)
              showSuccessMessage(MESSAGES.success.updated)
              // store의 updateSchedule이 이미 selectedSchedule을 업데이트하므로 로컬 상태도 동기화
              if (storeSelectedSchedule && selectedSchedule?.id === storeSelectedSchedule.id) {
                setSelectedSchedule(storeSelectedSchedule)
              }
            } else {
              await createSchedule(scheduleData)
              showSuccessMessage(MESSAGES.success.created)
            }
            closeFormModal()
            setInitialDate(undefined)
            setConflicts([])
            fetchSchedules()
          },
        })
        return
      }

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data)
        showSuccessMessage(MESSAGES.success.updated)
        // store의 updateSchedule이 이미 selectedSchedule을 업데이트하므로 로컬 상태도 동기화
        if (storeSelectedSchedule && selectedSchedule?.id === storeSelectedSchedule.id) {
          setSelectedSchedule(storeSelectedSchedule)
        }
      } else {
        await createSchedule(scheduleData)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      setConflicts([])
      fetchSchedules()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSchedule ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'ScheduleFormSubmit',
      })
    }
  }

  const handleEdit = () => {
    if (selectedSchedule) {
      openFormModal(selectedSchedule)
      closeDrawer()
    }
  }

  const handleDeleteClick = () => {
    if (selectedSchedule) {
      openDeleteModal(selectedSchedule)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return

    try {
      await deleteSchedule(scheduleToDelete.id)
      showSuccessMessage(MESSAGES.success.deleted)
      closeDeleteModal()
      if (selectedSchedule?.id === scheduleToDelete.id) {
        closeDrawer()
        setSelectedSchedule(null)
        clearSelectedSchedule() // store도 초기화
      }
      fetchSchedules()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ScheduleDelete',
      })
    }
  }

  // 모든 일정의 중복 체크
  const allConflicts: Schedule[] = []
  schedules.forEach(schedule => {
    if (schedule.instructorId) {
      const detected = checkConflict(schedule, schedule.id)
      if (detected.length > 0) {
        allConflicts.push(schedule)
      }
    }
  })

  return (
    <div>
      <Space style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, width: '100%', justifyContent: 'flex-end' }}>
        {/* <h1 style={{ margin: 0 }}>일정 관리</h1> */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setInitialDate(undefined) // 버튼 클릭 시에는 오늘 날짜 사용
            openFormModal()
          }}
        >
          일정 등록
        </Button>
      </Space>

      <ScheduleCalendar
        schedules={schedules}
        onDateSelect={handleDateSelect}
        conflicts={allConflicts}
      />

      <ScheduleDetailDrawer
        open={drawerOpen}
        schedule={selectedSchedule || undefined}
        onClose={() => {
          closeDrawer()
          setSelectedSchedule(null)
          clearSelectedSchedule() // store도 초기화
        }}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
        isConflict={allConflicts.some(c => c.id === selectedSchedule?.id)}
      />

      <Modal
        title={isEditingMode ? MESSAGES.title.scheduleEdit : MESSAGES.title.scheduleCreate}
        open={formModalOpen}
        onCancel={() => {
          closeFormModal()
          setInitialDate(undefined)
          setConflicts([])
        }}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.large}
      >
        <ScheduleForm
          schedule={editingSchedule || undefined}
          initialDate={initialDate}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            closeFormModal()
            setInitialDate(undefined)
            setConflicts([])
          }}
          loading={loading}
          conflicts={conflicts}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title={MESSAGES.title.scheduleDelete}
        content={MESSAGES.confirm.deleteSchedule}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteModal}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

/**
 * 일정 캘린더 페이지
 * Phase 3.1: 캘린더 뷰 + 일정 관리
 */

import { useState, useEffect } from 'react'
import { Button, Space, Modal, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { ScheduleCalendar } from '@/features/schedule/ui/schedule-calendar'
import { ScheduleForm } from '@/features/schedule/ui/schedule-form'
import { ScheduleDetailDrawer } from '@/features/schedule/ui/schedule-detail-drawer'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useScheduleStore } from '@/features/schedule/model/schedule-store'
import type { Schedule } from '@/types/domain'
import type { ScheduleFormData } from '@/entities/schedule/model/schema'

export function ScheduleCalendarPage() {
  const { schedules, loading, fetchSchedules, createSchedule, updateSchedule, deleteSchedule, checkConflict } =
    useScheduleStore()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [conflicts, setConflicts] = useState<Schedule[]>([])
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleDateSelect = (date: Dayjs, schedule?: Schedule) => {
    // schedule이 있는 경우: 일정 상세 drawer 열기
    if (schedule) {
      setSelectedSchedule(schedule)
      setDrawerOpen(true)
    } else {
      // schedule이 없는 경우 (빈 날짜 셀 클릭): 일정 등록 모달 열기
      // 해당 날짜를 초기값으로 설정
      setInitialDate(date.format('YYYY-MM-DD'))
      setEditingSchedule(null)
      setFormModalOpen(true)
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
          title: '일정 중복 경고',
          content: `${detectedConflicts.length}개의 일정과 시간이 겹칩니다. 계속 진행하시겠습니까?`,
          onOk: async () => {
            if (editingSchedule) {
              await updateSchedule(editingSchedule.id, data)
              message.success('일정이 수정되었습니다')
            } else {
              await createSchedule(scheduleData)
              message.success('일정이 등록되었습니다')
            }
            setFormModalOpen(false)
            setEditingSchedule(null)
            setInitialDate(undefined)
            setConflicts([])
            fetchSchedules()
          },
        })
        return
      }

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data)
        message.success('일정이 수정되었습니다')
      } else {
        await createSchedule(scheduleData)
        message.success('일정이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingSchedule(null)
      setConflicts([])
      fetchSchedules()
    } catch {
      message.error(editingSchedule ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  const handleEdit = () => {
    if (selectedSchedule) {
      setEditingSchedule(selectedSchedule)
      setDrawerOpen(false)
      setFormModalOpen(true)
    }
  }

  const handleDeleteClick = () => {
    if (selectedSchedule) {
      setScheduleToDelete(selectedSchedule)
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return

    try {
      await deleteSchedule(scheduleToDelete.id)
      message.success('일정이 삭제되었습니다')
      setDeleteModalOpen(false)
      setScheduleToDelete(null)
      if (selectedSchedule?.id === scheduleToDelete.id) {
        setDrawerOpen(false)
        setSelectedSchedule(null)
      }
      fetchSchedules()
    } catch {
      message.error('삭제 중 오류가 발생했습니다')
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
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>일정 관리</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setInitialDate(undefined) // 버튼 클릭 시에는 오늘 날짜 사용
            setEditingSchedule(null)
            setFormModalOpen(true)
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
        schedule={selectedSchedule}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSchedule(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
        isConflict={allConflicts.some(c => c.id === selectedSchedule?.id)}
      />

      <Modal
        title={editingSchedule ? '일정 수정' : '일정 등록'}
        open={formModalOpen}
        onCancel={() => {
          setFormModalOpen(false)
          setEditingSchedule(null)
          setInitialDate(undefined)
          setConflicts([])
        }}
        footer={null}
        width={800}
      >
        <ScheduleForm
          schedule={editingSchedule || undefined}
          initialDate={initialDate}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormModalOpen(false)
            setEditingSchedule(null)
            setInitialDate(undefined)
            setConflicts([])
          }}
          loading={loading}
          conflicts={conflicts}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="일정 삭제"
        content="정말 이 일정을 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false)
          setScheduleToDelete(null)
        }}
        confirmText="삭제"
        danger
      />
    </div>
  )
}


import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  getApplicantPreferredDateKeys,
  getAssignedLectureDateKeys,
  getSlotsForLectureAssignDate,
  parseInstructorLectureAssignSchedule,
  resolveLectureAssignModalCalendarState,
  toLectureAssignItem,
  type InstructorLectureAssignItem,
  type InstructorLectureAssignSlot,
} from './instructor-lecture-assign-schedule'

export type InstructorLectureAssignConfirmPayload = {
  assignments: InstructorLectureAssignItem[]
}

export function useInstructorLectureAssignModal(params: {
  open: boolean
  programId: string
  instructor: ApplicantInstructorRow
  allInstructors: ApplicantInstructorRow[]
}) {
  const { open, programId, instructor, allInstructors } = params

  const schedule = useMemo(
    () => parseInstructorLectureAssignSchedule(programId),
    [programId]
  )

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [assignedItems, setAssignedItems] = useState<InstructorLectureAssignItem[]>([])

  useEffect(() => {
    if (!open) return
    const { scheduleMonth, selectedDate: initialDate } = resolveLectureAssignModalCalendarState(
      schedule,
      instructor
    )
    setCurrentMonth(scheduleMonth)
    setSelectedDate(initialDate)
    setAssignedItems([])
  }, [open, instructor, schedule])

  const selectedDateKey = selectedDate.format('YYYY-MM-DD')

  const slotsForDay = useMemo(
    () =>
      getSlotsForLectureAssignDate(
        schedule,
        selectedDateKey,
        assignedItems,
        allInstructors,
        instructor.id
      ),
    [schedule, selectedDateKey, assignedItems, allInstructors, instructor.id]
  )

  const preferredDateKeys = useMemo(
    () => getApplicantPreferredDateKeys(instructor),
    [instructor]
  )

  const assignedDateKeys = useMemo(
    () => getAssignedLectureDateKeys(assignedItems),
    [assignedItems]
  )

  const handleSelectDate = useCallback(
    (date: Dayjs) => {
      if (schedule.disabledDate(date)) return
      setSelectedDate(date)
    },
    [schedule]
  )

  const handleAddSlot = useCallback((slot: InstructorLectureAssignSlot) => {
    if (slot.disabled) return
    setAssignedItems(prev => {
      if (prev.some(item => item.slotKey === slot.key)) return prev
      return [...prev, toLectureAssignItem(slot)]
    })
  }, [])

  const handleRemoveAssignment = useCallback((slotKey: string) => {
    setAssignedItems(prev => prev.filter(item => item.slotKey !== slotKey))
  }, [])

  const canConfirm = assignedItems.length > 0

  return {
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    selectedDateKey,
    slotsForDay,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    canConfirm,
  }
}

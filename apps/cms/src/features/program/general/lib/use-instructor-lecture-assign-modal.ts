import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { Program } from '@/types/domain'
import {
  getApplicantPreferredDateKeys,
  getAssignedLectureDateKeys,
  getIndividualLectureAssignSlots,
  getSlotsForLectureAssignDate,
  parseInstructorLectureAssignSchedule,
  resolveProgramForIndividualLectureAssign,
  resolveLectureAssignModalCalendarState,
  toIndividualLectureAssignItem,
  toLectureAssignItem,
  type InstructorLectureAssignItem,
  type InstructorLectureAssignSlot,
} from './instructor-lecture-assign-schedule'

export type InstructorLectureAssignModalVariant = 'organization' | 'individual'

export type InstructorLectureAssignConfirmPayload = {
  assignments: InstructorLectureAssignItem[]
}

export function useInstructorLectureAssignModal(params: {
  open: boolean
  variant?: InstructorLectureAssignModalVariant
  programId: string
  program?: Program | null
  instructor: ApplicantInstructorRow
  allInstructors: ApplicantInstructorRow[]
}) {
  const {
    open,
    variant = 'organization',
    programId,
    program = null,
    instructor,
    allInstructors,
  } = params

  const isIndividual = variant === 'individual'

  const schedule = useMemo(
    () => parseInstructorLectureAssignSchedule(programId),
    [programId]
  )

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [assignedItems, setAssignedItems] = useState<InstructorLectureAssignItem[]>([])

  useEffect(() => {
    if (!open) return
    if (isIndividual) {
      setAssignedItems([])
      return
    }
    const { scheduleMonth, selectedDate: initialDate } = resolveLectureAssignModalCalendarState(
      schedule,
      instructor
    )
    setCurrentMonth(scheduleMonth)
    setSelectedDate(initialDate)
    setAssignedItems([])
  }, [open, instructor, schedule, isIndividual])

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

  const individualProgram = useMemo(
    () => (isIndividual ? resolveProgramForIndividualLectureAssign(program, programId) : null),
    [isIndividual, program, programId]
  )

  const individualSlots = useMemo(() => {
    if (!isIndividual || !individualProgram) return []
    return getIndividualLectureAssignSlots(
      individualProgram,
      instructor,
      allInstructors,
      instructor.id
    )
  }, [isIndividual, individualProgram, instructor, allInstructors])

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

  const handleAddSlot = useCallback(
    (slot: InstructorLectureAssignSlot) => {
      if (slot.disabled) return
      setAssignedItems(prev => {
        if (prev.some(item => item.slotKey === slot.key)) return prev
        const nextItem = isIndividual ? toIndividualLectureAssignItem(slot) : toLectureAssignItem(slot)
        return [...prev, nextItem]
      })
    },
    [isIndividual]
  )

  const handleRemoveAssignment = useCallback((slotKey: string) => {
    setAssignedItems(prev => prev.filter(item => item.slotKey !== slotKey))
  }, [])

  const canConfirm = assignedItems.length > 0

  return {
    variant,
    isIndividual,
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    selectedDateKey,
    slotsForDay,
    individualSlots,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    canConfirm,
  }
}

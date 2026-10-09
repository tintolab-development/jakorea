import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { fetchGeneralOrganizationApplicationsPage } from '@/features/program/general/api/admin-applications-service'
import { fetchInstructorApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  buildIndividualLectureAssignSlotsFromScheduleSlots,
  getApplicantPreferredDateKeys,
  getAssignedLectureDateKeys,
  getIndividualLectureAssignSlots,
  getSlotsForLectureAssignDate,
  parseInstructorLectureAssignSchedule,
  parseInstructorLectureAssignScheduleFromInstitutions,
  resolveProgramForIndividualLectureAssign,
  resolveLectureAssignModalCalendarState,
  toIndividualLectureAssignItem,
  toLectureAssignItem,
  type InstructorLectureAssignItem,
  type InstructorLectureAssignSlot,
} from './instructor-lecture-assign-schedule'

const ASSIGN_ORG_PAGE_LIMIT = 40

/**
 * GENERAL 기관 강사 배정 후보 = 승인된 기관의 희망 일정(+ resolvedScheduleId).
 * OSA(`schedule-assignments`) 선배정은 필수가 아니다 (노션 기획).
 */
async function fetchApprovedOrganizationApplicationsForLectureAssign(
  programId: string
): Promise<ApplicantSchoolRow[]> {
  const rows: ApplicantSchoolRow[] = []
  let page = 0
  for (;;) {
    const result = await fetchGeneralOrganizationApplicationsPage(programId, { page })
    rows.push(...result.rows)
    if (!result.hasMore) break
    page += 1
    if (page > ASSIGN_ORG_PAGE_LIMIT) break
  }
  return rows.filter(row => row.approvalStatus === 'approved')
}

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
  const organizationRemoteEnabled = shouldUseOrganizationApplicationRemoteApi()

  const organizationApplicationsQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorLectureAssignInstitutions(programId),
    queryFn: () => fetchApprovedOrganizationApplicationsForLectureAssign(programId),
    enabled: open && !isIndividual && organizationRemoteEnabled && Boolean(programId.trim()),
    staleTime: 30_000,
    retry: false,
  })

  const schedule = useMemo(
    () =>
      !isIndividual && organizationRemoteEnabled && organizationApplicationsQuery.data
        ? parseInstructorLectureAssignScheduleFromInstitutions(organizationApplicationsQuery.data)
        : parseInstructorLectureAssignSchedule(programId),
    [isIndividual, organizationApplicationsQuery.data, organizationRemoteEnabled, programId]
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

  const instructorApplicationId = instructor.id.trim()
  const individualRemote =
    isIndividual && organizationRemoteEnabled && Number.isFinite(Number(instructorApplicationId))

  const instructorDetailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorDetail(instructorApplicationId),
    queryFn: () => fetchInstructorApplicationDetailRemote(instructorApplicationId),
    enabled: open && individualRemote && Boolean(instructorApplicationId),
    staleTime: 30_000,
    retry: false,
  })

  const individualSlots = useMemo(() => {
    if (individualRemote) {
      return buildIndividualLectureAssignSlotsFromScheduleSlots(
        instructorDetailQuery.data?.availableScheduleSlots ?? [],
        {
          schoolName:
            individualProgram?.mainTitle?.trim() ||
            individualProgram?.title?.trim() ||
            '개인 프로그램',
          allInstructors,
          excludeInstructorId: instructor.id,
        }
      )
    }
    if (!isIndividual || !individualProgram) return []
    return getIndividualLectureAssignSlots(
      individualProgram,
      instructor,
      allInstructors,
      instructor.id
    )
  }, [
    individualRemote,
    instructorDetailQuery.data,
    isIndividual,
    individualProgram,
    instructor,
    allInstructors,
  ])

  const individualSlotsLoading = individualRemote && instructorDetailQuery.isPending
  const individualSlotsError = individualRemote && instructorDetailQuery.isError

  const singleRemoteSlot =
    individualRemote && individualSlots.length === 1 ? individualSlots[0] : undefined
  useEffect(() => {
    if (!open || !singleRemoteSlot) return
    setAssignedItems(prev =>
      prev.length > 0 ? prev : [toIndividualLectureAssignItem(singleRemoteSlot)]
    )
  }, [open, singleRemoteSlot])

  const preferredDateKeys = useMemo(() => getApplicantPreferredDateKeys(instructor), [instructor])

  const assignedDateKeys = useMemo(() => getAssignedLectureDateKeys(assignedItems), [assignedItems])

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
        const nextItem = isIndividual
          ? toIndividualLectureAssignItem(slot)
          : toLectureAssignItem(slot)
        return [...prev, nextItem]
      })
    },
    [isIndividual]
  )

  const handleRemoveAssignment = useCallback((slotKey: string) => {
    setAssignedItems(prev => prev.filter(item => item.slotKey !== slotKey))
  }, [])

  const canConfirm = assignedItems.length > 0

  const organizationSlotsEmptyText =
    !isIndividual && organizationRemoteEnabled && organizationApplicationsQuery.isPending
      ? '배정 가능한 기관·일정을 불러오는 중입니다.'
      : '이 날짜에 배정 가능한 기관이 없습니다.'

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
    individualRemote,
    individualSlotsLoading,
    individualSlotsError,
    organizationSlotsEmptyText,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    canConfirm,
  }
}

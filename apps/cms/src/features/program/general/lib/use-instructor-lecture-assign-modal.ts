import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  fetchGeneralOrganizationApplicationsPage,
  hydrateOrganizationApplicationSchedules,
} from '@/features/program/general/api/admin-applications-service'
import { fetchInstructorApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
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
  programId: string,
  queryClient: QueryClient
): Promise<ApplicantSchoolRow[]> {
  const rows: ApplicantSchoolRow[] = []
  let page = 0
  for (;;) {
    const result = await fetchGeneralOrganizationApplicationsPage(
      programId,
      { queryClient },
      { page }
    )
    rows.push(...result.rows)
    if (!result.hasMore) break
    page += 1
    if (page > ASSIGN_ORG_PAGE_LIMIT) break
  }
  const approved = rows.filter(row => row.approvalStatus === 'approved')
  return hydrateOrganizationApplicationSchedules(approved, queryClient)
}

export type InstructorLectureAssignModalVariant = 'organization' | 'individual'

/** 기관 배정은 캘린더+당일 기관 카드가 기본. 슬롯 목록은 개인이거나 승인 기관이 없을 때만. */
export function resolveInstructorLectureAssignLayout(params: {
  isIndividual: boolean
  organizationRemoteEnabled: boolean
  organizationApplicationsSuccess: boolean
  approvedOrganizationCount: number
  instructorDetailReady: boolean
}): { showNoApprovedOrganizationBanner: boolean; useSlotListLayout: boolean } {
  const showNoApprovedOrganizationBanner =
    !params.isIndividual &&
    params.organizationRemoteEnabled &&
    params.organizationApplicationsSuccess &&
    params.approvedOrganizationCount === 0 &&
    params.instructorDetailReady
  return {
    showNoApprovedOrganizationBanner,
    useSlotListLayout: params.isIndividual || showNoApprovedOrganizationBanner,
  }
}

export type InstructorLectureAssignConfirmPayload = {
  assignments: InstructorLectureAssignItem[]
}

function resolveAvailableScheduleSlotsEmptyText(params: {
  loading: boolean
  error: boolean
  applicationStatus?: string
  submittedAt?: string | null
  instructorSubmittedScheduleHint: boolean
}): string {
  if (params.loading) return '배정 가능한 일정을 불러오는 중입니다.'
  if (params.error) return '배정 가능한 일정을 불러오지 못했습니다. 다시 시도해 주세요.'
  const submitted =
    Boolean(params.submittedAt?.trim()) ||
    params.applicationStatus === 'SUBMITTED' ||
    params.instructorSubmittedScheduleHint
  if (!submitted) return '강사가 강의 가능 일정을 제출하지 않았습니다.'
  return '제출된 일정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
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
  const queryClient = useQueryClient()

  const organizationApplicationsQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorLectureAssignInstitutions(programId),
    queryFn: () => fetchApprovedOrganizationApplicationsForLectureAssign(programId, queryClient),
    enabled: open && !isIndividual && organizationRemoteEnabled && Boolean(programId.trim()),
    staleTime: 30_000,
    retry: false,
  })

  const instructorAssignmentBoardQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.instructorAssignments(programId),
    queryFn: () => fetchGeneralInstructorAssignmentBoard(programId),
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
  const useRemoteInstructorDetail =
    organizationRemoteEnabled &&
    open &&
    Boolean(instructorApplicationId) &&
    Number.isFinite(Number(instructorApplicationId))

  const instructorDetailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorDetail(instructorApplicationId),
    queryFn: () => fetchInstructorApplicationDetailRemote(instructorApplicationId),
    enabled: useRemoteInstructorDetail,
    staleTime: 30_000,
    retry: false,
  })

  const programDisplayName =
    program?.mainTitle?.trim() ||
    program?.title?.trim() ||
    (isIndividual ? '개인 프로그램' : '프로그램')

  const detailScheduleSlots = useMemo(() => {
    if (!useRemoteInstructorDetail || !instructorDetailQuery.isSuccess) return []
    return buildIndividualLectureAssignSlotsFromScheduleSlots(
      instructorDetailQuery.data?.availableScheduleSlots ?? [],
      {
        schoolName: programDisplayName,
        allInstructors,
        excludeInstructorId: instructor.id,
      }
    )
  }, [
    useRemoteInstructorDetail,
    instructorDetailQuery.isSuccess,
    instructorDetailQuery.data,
    programDisplayName,
    allInstructors,
    instructor.id,
  ])

  const useAvailableScheduleSlotsUi = useRemoteInstructorDetail && instructorDetailQuery.isSuccess

  const { showNoApprovedOrganizationBanner, useSlotListLayout } =
    resolveInstructorLectureAssignLayout({
      isIndividual,
      organizationRemoteEnabled,
      organizationApplicationsSuccess: organizationApplicationsQuery.isSuccess,
      approvedOrganizationCount: organizationApplicationsQuery.data?.length ?? 0,
      instructorDetailReady: useAvailableScheduleSlotsUi,
    })

  const legacyIndividualSlots = useMemo(() => {
    if (!isIndividual || !individualProgram || useRemoteInstructorDetail) return []
    return getIndividualLectureAssignSlots(
      individualProgram,
      instructor,
      allInstructors,
      instructor.id
    )
  }, [isIndividual, individualProgram, useRemoteInstructorDetail, instructor, allInstructors])

  const availableSlots = useMemo(() => {
    if (useSlotListLayout) {
      return useAvailableScheduleSlotsUi ? detailScheduleSlots : legacyIndividualSlots
    }
    return slotsForDay
  }, [
    useSlotListLayout,
    useAvailableScheduleSlotsUi,
    detailScheduleSlots,
    legacyIndividualSlots,
    slotsForDay,
  ])

  const detailSlotsLoading = useRemoteInstructorDetail && instructorDetailQuery.isPending
  const detailSlotsError = useRemoteInstructorDetail && instructorDetailQuery.isError

  const instructorSubmittedScheduleHint =
    (instructor.preferredScheduleSlots?.length ?? 0) > 0 ||
    Boolean(instructorDetailQuery.data?.availableScheduleMemo?.trim())

  const scheduleSlotsEmptyText = resolveAvailableScheduleSlotsEmptyText({
    loading: detailSlotsLoading,
    error: detailSlotsError,
    applicationStatus: instructorDetailQuery.data?.applicationStatus,
    submittedAt: instructorDetailQuery.data?.submittedAt,
    instructorSubmittedScheduleHint,
  })

  const singleRemoteSlot =
    useSlotListLayout && useAvailableScheduleSlotsUi && detailScheduleSlots.length === 1
      ? detailScheduleSlots[0]
      : undefined

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
        const usePeriodStyleItem =
          isIndividual || useSlotListLayout || Boolean(slot.label?.trim())
        const nextItem = usePeriodStyleItem
          ? toIndividualLectureAssignItem(slot)
          : toLectureAssignItem(slot)
        return [...prev, { ...nextItem, scheduleLead: prev.length === 0 }]
      })
    },
    [isIndividual, useSlotListLayout]
  )

  const handleRemoveAssignment = useCallback((slotKey: string) => {
    setAssignedItems(prev => prev.filter(item => item.slotKey !== slotKey))
  }, [])

  const handleToggleScheduleLead = useCallback((slotKey: string, scheduleLead: boolean) => {
    setAssignedItems(prev =>
      prev.map(item => (item.slotKey === slotKey ? { ...item, scheduleLead } : item))
    )
  }, [])

  const existingLeadScheduleIds = useMemo(() => {
    const ids = new Set<number>()
    for (const assignment of instructorAssignmentBoardQuery.data?.assignments ?? []) {
      if (assignment.scheduleLead !== true || assignment.scheduleId == null) continue
      const status = assignment.assignmentStatus?.toUpperCase()
      if (status === 'CANCELLED' || status === 'CANCELED' || status === 'INACTIVE') continue
      ids.add(assignment.scheduleId)
    }
    return ids
  }, [instructorAssignmentBoardQuery.data?.assignments])

  const canConfirm = assignedItems.length > 0

  const organizationSlotsEmptyText =
    !isIndividual && organizationRemoteEnabled && organizationApplicationsQuery.isPending
      ? '배정 가능한 기관·일정을 불러오는 중입니다.'
      : '이 날짜에 배정 가능한 기관이 없습니다.'

  const slotsEmptyText = useSlotListLayout
    ? useAvailableScheduleSlotsUi
      ? scheduleSlotsEmptyText
      : '등록된 교육 일정이 없습니다.'
    : organizationSlotsEmptyText

  return {
    variant,
    isIndividual,
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    selectedDateKey,
    slotsForDay,
    availableSlots,
    useAvailableScheduleSlotsUi,
    useSlotListLayout,
    detailSlotsLoading,
    detailSlotsError,
    scheduleSlotsEmptyText,
    slotsEmptyText,
    showNoApprovedOrganizationBanner,
    organizationSlotsEmptyText,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    handleToggleScheduleLead,
    existingLeadScheduleIds,
    existingLeadQueryReady: instructorAssignmentBoardQuery.isSuccess,
    canConfirm,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  buildUjatProgramScheduleDates,
  resolveEducationSemesterForIsoDate,
  type UjatInstitutionEducationSemesterKey,
} from '../education-schedule'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  createEmptyRow,
  ensureUjatScheduleAssignDays,
  getUjatScheduleAssignDraftRegionState,
  patchUjatScheduleAssignDay,
  patchUjatScheduleAssignEstimation,
  patchUjatScheduleAssignMaxClassesPerDay,
  replaceUjatScheduleAssignRegionState,
} from './store'
import type { UjatScheduleAssignRow } from './types'
import {
  computeVolunteerEducationDays,
  listTempAssignedSchoolsForDate,
  sumSelectedGradeClassCount,
} from './utils'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildScheduleIdByIsoDateMap,
  fetchProgramSchedulesLoose,
  fetchUjatOrganizationScheduleAssignments,
  fetchUjatTemporarySchedule,
  putUjatTemporarySchedule,
} from '@/features/program/ujat/api/temporary-schedule-api'
import {
  applyTemporaryScheduleSlotsToDraft,
  buildTemporaryScheduleSaveRequest,
} from './temporary-schedule-mapper'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

export function useUjatInstitutionScheduleAssign(
  regionKey: UjatInstitutionApplicationRegionKey,
  programId?: string | null
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const queryClient = useQueryClient()
  const [version, setVersion] = useState(0)
  const [hydrating, setHydrating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [organizationNamesByApplicationId, setOrganizationNamesByApplicationId] = useState<
    Record<string, string>
  >({})
  const hydratedKeyRef = useRef<string | null>(null)

  const remoteQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', {
      status: 'TEMP_ASSIGNED',
    }),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, {
        status: 'TEMP_ASSIGNED',
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const schedulesQuery = useQuery({
    queryKey: ujatQueryKeys.programSchedules(programId ?? ''),
    queryFn: () => fetchProgramSchedulesLoose(String(programId)),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const scheduleIdByIsoDate = useMemo(
    () => buildScheduleIdByIsoDateMap(schedulesQuery.data ?? []),
    [schedulesQuery.data]
  )

  const applicationRows = useMemo(() => {
    void version
    const rows = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
    return rows
      .filter(row => row.regionKey === regionKey)
      .map(row => ({
        ...row,
        // 기관 신청 목록의 명칭이 비어 있거나 ID로 내려오는 경우에도
        // 임시 배정 API의 organizationName을 표시값으로 사용한다.
        institutionName:
          organizationNamesByApplicationId[row.id]?.trim() || row.institutionName,
      }))
  }, [organizationNamesByApplicationId, regionKey, remoteQuery.data, version])

  useEffect(() => {
    if (!remoteEnabled || !programId) return
    if (schedulesQuery.isLoading) return
    const hydrateKey = `${programId}:${regionKey}:${scheduleIdByIsoDate.size}`
    if (hydratedKeyRef.current === hydrateKey) return
    let cancelled = false

    void (async () => {
      setHydrating(true)
      try {
        let draft = getUjatScheduleAssignDraftRegionState(regionKey)
        const assignmentList = await fetchUjatOrganizationScheduleAssignments(String(programId))
        const slots = assignmentList.content ?? []
        const organizationNames: Record<string, string> = {}
        const byApp = new Map<string, typeof slots>()
        for (const slot of slots) {
          const appId = slot.organizationApplicationId
          if (appId == null) continue
          const key = String(appId)
          if (slot.organizationName?.trim()) {
            organizationNames[key] = slot.organizationName.trim()
          }
          const list = byApp.get(key) ?? []
          list.push(slot)
          byApp.set(key, list)
        }

        if (!cancelled) setOrganizationNamesByApplicationId(organizationNames)

        const regionCode = toUjatEducationRegionCode(regionKey)
        for (const [appId, appSlots] of byApp) {
          const matchedRegion = appSlots.some(
            s =>
              !s.educationRegionCode ||
              s.educationRegionCode.toUpperCase() === regionCode
          )
          if (!matchedRegion) continue
          draft = applyTemporaryScheduleSlotsToDraft({
            regionState: draft,
            institutionRowId: appId,
            slots: appSlots,
            scheduleIdByIsoDate,
          })
        }

        const appIds = (remoteQuery.data?.pages.flatMap(page => page.rows) ?? [])
          .filter(row => row.regionKey === regionKey)
          .map(row => row.id)

        for (const appId of appIds) {
          if (byApp.has(appId)) continue
          try {
            const detail = await fetchUjatTemporarySchedule(String(programId), appId)
            draft = applyTemporaryScheduleSlotsToDraft({
              regionState: draft,
              institutionRowId: appId,
              slots: detail.slots ?? [],
              scheduleIdByIsoDate,
            })
          } catch {
            // 미배정 가능
          }
        }

        if (!cancelled) {
          replaceUjatScheduleAssignRegionState(regionKey, draft)
          hydratedKeyRef.current = hydrateKey
          setVersion(v => v + 1)
        }
      } finally {
        if (!cancelled) setHydrating(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    programId,
    regionKey,
    remoteEnabled,
    remoteQuery.data,
    scheduleIdByIsoDate,
    schedulesQuery.isLoading,
  ])

  const regionState = useMemo(() => {
    void version
    return getUjatScheduleAssignDraftRegionState(regionKey)
  }, [regionKey, version])

  const organizationNamesByApplicationIdForView = organizationNamesByApplicationId

  const bump = useCallback(() => setVersion(v => v + 1), [])

  const assignDates = useMemo(
    () =>
      buildUjatProgramScheduleDates(
        schedulesQuery.data ?? [],
        resolveUjatRegistrationBasicInfoOverlay()
      ),
    [schedulesQuery.data]
  )

  useEffect(() => {
    if (assignDates.length === 0) return
    ensureUjatScheduleAssignDays(
      regionKey,
      assignDates.map(entry => entry.isoDate)
    )
    setVersion(v => v + 1)
  }, [assignDates, regionKey])

  const schoolsByDate = useMemo(() => {
    const map: Record<string, ReturnType<typeof listTempAssignedSchoolsForDate>> = {}
    for (const { isoDate } of assignDates) {
      const available = listTempAssignedSchoolsForDate(applicationRows, regionKey, isoDate)
      const assignedIds = new Set(
        regionState.days[isoDate]?.rows
          .map(row => row.institutionRowId)
          .filter((id): id is string => Boolean(id)) ?? []
      )

      // 기존 임시 배정 행은 날짜별 scheduleSlots가 비어 있어도
      // 선택값을 유지해야 하므로, 현재 날짜에 이미 배정된 기관을 옵션에 보강한다.
      const byId = new Map(available.map(row => [row.id, row]))
      for (const row of applicationRows) {
        if (row.tempAssignmentStatus === 'temp_assigned' && assignedIds.has(row.id)) {
          byId.set(row.id, row)
        }
      }
      map[isoDate] = [...byId.values()]
    }
    return map
  }, [applicationRows, regionKey, assignDates, regionState])

  const addAssignmentRow = useCallback(
    (isoDate: string) => {
      patchUjatScheduleAssignDay(regionKey, isoDate, day => ({
        ...day,
        rows: [...day.rows, createEmptyRow()],
      }))
      bump()
    },
    [regionKey, bump]
  )

  const updateAssignmentRow = useCallback(
    (isoDate: string, rowId: string, patch: Partial<UjatScheduleAssignRow>) => {
      patchUjatScheduleAssignDay(regionKey, isoDate, day => ({
        ...day,
        rows: day.rows.map(row => (row.id === rowId ? { ...row, ...patch } : row)),
      }))
      bump()
    },
    [regionKey, bump]
  )

  const removeAssignmentRow = useCallback(
    (isoDate: string, rowId: string) => {
      patchUjatScheduleAssignDay(regionKey, isoDate, day => {
        if (day.rows.length <= 1) return day
        return {
          ...day,
          rows: day.rows.filter(row => row.id !== rowId),
        }
      })
      bump()
    },
    [regionKey, bump]
  )

  const setMaxClassesPerDay = useCallback(
    (value: string) => {
      patchUjatScheduleAssignMaxClassesPerDay(regionKey, value.replace(/\D/g, ''))
      bump()
    },
    [regionKey, bump]
  )

  const setExpectedVolunteerCount = useCallback(
    (semester: UjatInstitutionEducationSemesterKey, value: string) => {
      patchUjatScheduleAssignEstimation(regionKey, semester, {
        expectedVolunteerCount: value.replace(/\D/g, ''),
      })
      bump()
    },
    [regionKey, bump]
  )

  const semesterClassTotals = useMemo(() => {
    const totals: Record<UjatInstitutionEducationSemesterKey, number> = { h1: 0, h2: 0 }
    for (const { isoDate } of assignDates) {
      const day = regionState.days[isoDate]
      if (!day) continue
      const semester =
        assignDates.find(entry => entry.isoDate === isoDate)?.semester ??
        resolveEducationSemesterForIsoDate(isoDate)
      if (semester == null) continue
      const daySum = day.rows.reduce(
        (sum, row) => sum + sumSelectedGradeClassCount(row.gradeValues),
        0
      )
      totals[semester] += daySum
    }
    return totals
  }, [assignDates, regionState.days])

  const volunteerEducationDays = useMemo(() => {
    const out: Record<UjatInstitutionEducationSemesterKey, number | null> = { h1: null, h2: null }

    for (const semester of ['h1', 'h2'] as const) {
      const expectedClasses = semesterClassTotals[semester]
      const volunteers = Number.parseInt(regionState.estimation[semester].expectedVolunteerCount, 10)
      out[semester] = computeVolunteerEducationDays(expectedClasses, volunteers)
    }
    return out
  }, [regionState.estimation, semesterClassTotals])

  const saveTemporarySchedules = useCallback(async () => {
    if (!remoteEnabled || !programId) {
      return { ok: false as const, message: '원격 API가 비활성 상태입니다.' }
    }
    setSaving(true)
    try {
      const draft = getUjatScheduleAssignDraftRegionState(regionKey)
      const institutionIds = new Set<string>()
      for (const day of Object.values(draft.days)) {
        for (const row of day.rows) {
          if (row.institutionRowId && row.gradeValues.length > 0) {
            institutionIds.add(row.institutionRowId)
          }
        }
      }
      if (institutionIds.size === 0) {
        return { ok: false as const, message: '저장할 학급 배정이 없습니다.' }
      }
      if (scheduleIdByIsoDate.size === 0) {
        return {
          ok: false as const,
          message: '프로그램 일정(scheduleId)을 찾지 못했습니다. 일정 등록 후 다시 시도해 주세요.',
        }
      }

      for (const institutionId of institutionIds) {
        const body = buildTemporaryScheduleSaveRequest({
          regionKey,
          regionState: draft,
          institutionRowId: institutionId,
          scheduleIdByIsoDate,
        })
        if (!body) continue
        await putUjatTemporarySchedule(String(programId), institutionId, body)
      }

      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplications(String(programId), {
          status: 'TEMP_ASSIGNED',
        }),
      })
      hydratedKeyRef.current = null
      setVersion(v => v + 1)
      return { ok: true as const }
    } catch (error) {
      return {
        ok: false as const,
        message: readApiErrorAlertMessage(error, '임시 배정 저장에 실패했습니다. 다시 시도해 주세요.'),
      }
    } finally {
      setSaving(false)
    }
  }, [programId, queryClient, regionKey, remoteEnabled, scheduleIdByIsoDate])

  return {
    assignDates,
    regionState,
    schoolsByDate,
    organizationNamesByApplicationId: organizationNamesByApplicationIdForView,
    addAssignmentRow,
    updateAssignmentRow,
    removeAssignmentRow,
    setMaxClassesPerDay,
    setExpectedVolunteerCount,
    semesterClassTotals,
    volunteerEducationDays,
    saveTemporarySchedules,
    hydrating,
    saving,
    remoteEnabled,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  buildUjatScheduleAssignDates,
  collectPreferredEducationIsoDates,
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
  listAssignableSchoolsForDate,
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
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
  const listQuery = useMemo(
    () => ({ educationRegionCode }),
    [educationRegionCode]
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', listQuery),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, listQuery),
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

  const allApplicationRows = useMemo(
    () => remoteQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [remoteQuery.data]
  )

  const preferredIsoDates = useMemo(
    () => collectPreferredEducationIsoDates(allApplicationRows),
    [allApplicationRows]
  )

  const preferredScheduleIdByIso = useMemo(() => {
    const ids: Record<string, number> = {}
    for (const row of allApplicationRows) {
      Object.assign(ids, row.preferredScheduleIdByIso)
    }
    return ids
  }, [allApplicationRows])

  const scheduleIdByIsoDate = useMemo(
    () =>
      buildScheduleIdByIsoDateMap(
        schedulesQuery.data ?? [],
        preferredIsoDates,
        preferredScheduleIdByIso
      ),
    [preferredIsoDates, preferredScheduleIdByIso, schedulesQuery.data]
  )

  const applicationRows = useMemo(() => {
    void version
    return allApplicationRows
      .filter(row => row.regionKey === regionKey)
      .map(row => ({
        ...row,
        institutionName:
          organizationNamesByApplicationId[row.id]?.trim() || row.institutionName,
      }))
  }, [allApplicationRows, organizationNamesByApplicationId, regionKey, version])

  const fetchNextPage = remoteQuery.fetchNextPage
  const hasNextPage = remoteQuery.hasNextPage
  const isFetchingNextPage = remoteQuery.isFetchingNextPage

  useEffect(() => {
    if (!remoteEnabled || !hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, remoteEnabled])

  useEffect(() => {
    if (!remoteEnabled || !programId) return
    if (schedulesQuery.isLoading || remoteQuery.isLoading || isFetchingNextPage) return
    if (hasNextPage) return
    const appIds = allApplicationRows
      .filter(row => row.regionKey === regionKey)
      .map(row => row.id)
      .join(',')
    const hydrateKey = `${programId}:${regionKey}:${appIds}:${preferredIsoDates.join(',')}`
    if (hydratedKeyRef.current === hydrateKey) return
    let cancelled = false

    void (async () => {
      setHydrating(true)
      try {
        let draft = getUjatScheduleAssignDraftRegionState(regionKey)
        const assignmentList = await fetchUjatOrganizationScheduleAssignments(String(programId), {
          educationRegionCode,
        })
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

        const regionAppIds = allApplicationRows
          .filter(row => row.regionKey === regionKey)
          .map(row => row.id)

        for (const appId of regionAppIds) {
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
    allApplicationRows,
    educationRegionCode,
    preferredIsoDates,
    programId,
    regionKey,
    remoteEnabled,
    hasNextPage,
    isFetchingNextPage,
    remoteQuery.isLoading,
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
      buildUjatScheduleAssignDates({
        preferredIsoDates,
        schedules: schedulesQuery.data ?? [],
        overlay: resolveUjatRegistrationBasicInfoOverlay(),
      }),
    [preferredIsoDates, schedulesQuery.data]
  )

  useEffect(() => {
    if (hydrating) return
    if (assignDates.length === 0) return
    ensureUjatScheduleAssignDays(
      regionKey,
      assignDates.map(entry => entry.isoDate)
    )
    setVersion(v => v + 1)
  }, [assignDates, hydrating, regionKey])

  const schoolsByDate = useMemo(() => {
    const map: Record<string, ReturnType<typeof listAssignableSchoolsForDate>> = {}
    for (const { isoDate } of assignDates) {
      const available = listAssignableSchoolsForDate(applicationRows, regionKey, isoDate)
      const assignedIds = new Set(
        regionState.days[isoDate]?.rows
          .map(row => row.institutionRowId)
          .filter((id): id is string => Boolean(id)) ?? []
      )

      const byId = new Map(available.map(row => [row.id, row]))
      for (const row of applicationRows) {
        if (assignedIds.has(row.id)) {
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
      for (const institutionId of institutionIds) {
        const body = buildTemporaryScheduleSaveRequest({
          regionKey,
          regionState: draft,
          institutionRowId: institutionId,
          scheduleIdByIsoDate,
        })
        if (!body) {
          return {
            ok: false as const,
            message:
              '해당 희망일의 하루 일정(scheduleId)을 찾지 못했습니다. 연간 기간 일정으로는 저장할 수 없습니다.',
          }
        }
        const assignedDates = Object.values(draft.days).filter(day =>
          day.rows.some(
            row => row.institutionRowId === institutionId && row.gradeValues.length > 0
          )
        )
        if (assignedDates.some(day => !scheduleIdByIsoDate.has(day.isoDate))) {
          return {
            ok: false as const,
            message:
              '해당 희망일의 하루 일정(scheduleId)을 찾지 못했습니다. 연간 기간 일정으로는 저장할 수 없습니다.',
          }
        }
        await putUjatTemporarySchedule(String(programId), institutionId, body)
      }

      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(String(programId)),
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationScheduleAssignments(
          String(programId),
          educationRegionCode
        ),
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.programSchedules(String(programId)),
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
  }, [educationRegionCode, programId, queryClient, regionKey, remoteEnabled, scheduleIdByIsoDate])

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

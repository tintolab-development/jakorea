import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  buildUjatScheduleAssignDates,
  collectPreferredEducationIsoDates,
  resolveEducationSemesterForIsoDate,
  type UjatInstitutionEducationSemesterKey,
} from '../education-schedule'
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
  isScheduleAssignEstimationInputsEntered,
  listAssignableSchoolsForDate,
  sumSelectedGradeClassCount,
} from './utils'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  applyPlanningEstimatesToRegionState,
  buildMergedPlanningEstimatePutBody,
  fetchUjatPlanningEstimates,
  replaceUjatPlanningEstimates,
} from '@/features/program/ujat/api/planning-estimates-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildScheduleIdByIsoDateMap,
  fetchProgramSchedulesLoose,
  fetchUjatOrganizationScheduleAssignments,
  fetchUjatTemporarySchedule,
  putUjatTemporarySchedule,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { fetchUjatTypedDetailRemote } from '@/features/program/ujat/api/typed-detail-client'
import {
  applyTemporaryScheduleSlotsToDraft,
  buildTemporaryScheduleSaveRequest,
  collectStudentCountByClass,
  serializeRemoteTemporaryScheduleSlots,
  serializeTemporaryScheduleSlots,
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
  // remote 활성 시 첫 paint부터 로딩 — 탭 전환 empty → content 시프트 방지
  const [hydrating, setHydrating] = useState(() => remoteEnabled)
  const [saving, setSaving] = useState(false)
  const [organizationNamesByApplicationId, setOrganizationNamesByApplicationId] = useState<
    Record<string, string>
  >({})
  const hydratedKeyRef = useRef<string | null>(null)
  const studentCountByClassRef = useRef<Map<string, number>>(new Map())
  const hydratedSignatureByInstitutionRef = useRef<Map<string, string>>(new Map())
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
  const listQuery = useMemo(
    () => ({ educationRegionCode }),
    [educationRegionCode]
  )

  useEffect(() => {
    if (!remoteEnabled) {
      setHydrating(false)
      return
    }
    // programId 지연 주입·재조회 시 skeleton 유지
    hydratedKeyRef.current = null
    setHydrating(true)
  }, [programId, remoteEnabled])

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
  const typedDetailQuery = useQuery({
    queryKey: ujatQueryKeys.typedDetail(programId ?? ''),
    queryFn: () => fetchUjatTypedDetailRemote(String(programId)),
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
        studentCountByClassRef.current = collectStudentCountByClass(slots)
        hydratedSignatureByInstitutionRef.current = new Map()
        const organizationNames: Record<string, string> = {}
        const byApp = new Map<string, typeof slots>()
        const remoteSlotsByApp = new Map<string, typeof slots>()
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
          const counts = collectStudentCountByClass(appSlots, appId)
          for (const [key, value] of counts) studentCountByClassRef.current.set(key, value)
          remoteSlotsByApp.set(appId, appSlots)
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
            const detailSlots = detail.slots ?? []
            const counts = collectStudentCountByClass(detailSlots, appId)
            for (const [key, value] of counts) studentCountByClassRef.current.set(key, value)
            if (detailSlots.length > 0) remoteSlotsByApp.set(appId, detailSlots)
            draft = applyTemporaryScheduleSlotsToDraft({
              regionState: draft,
              institutionRowId: appId,
              slots: detailSlots,
              scheduleIdByIsoDate,
            })
          } catch {
            // 미배정 가능
          }
        }

        // studentCount는 API slots[].studentCount만 사용 (BE hydrate SSOT). gradeBlocks FE 보완 금지.

        try {
          const estimates = await fetchUjatPlanningEstimates(String(programId))
          draft = applyPlanningEstimatesToRegionState(draft, estimates, educationRegionCode)
        } catch {
          // 산정값 미존재·조회 실패 시 슬롯 hydrate는 유지
        }

        if (!cancelled) {
          const signatures = new Map<string, string>()
          const institutionIds = new Set<string>([
            ...byApp.keys(),
            ...regionAppIds,
          ])
          for (const institutionId of institutionIds) {
            const remoteSlots = remoteSlotsByApp.get(institutionId) ?? []
            if (remoteSlots.length > 0) {
              // 서버 응답 studentCount(hydrate 포함) 서명
              signatures.set(
                institutionId,
                serializeRemoteTemporaryScheduleSlots(remoteSlots)
              )
              continue
            }
            const body = buildTemporaryScheduleSaveRequest({
              regionKey,
              regionState: draft,
              institutionRowId: institutionId,
              scheduleIdByIsoDate,
              studentCountByClass: studentCountByClassRef.current,
            })
            signatures.set(
              institutionId,
              body ? serializeTemporaryScheduleSlots(body.slots) : ''
            )
          }
          hydratedSignatureByInstitutionRef.current = signatures
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
        typedDetail: typedDetailQuery.data,
      }),
    [preferredIsoDates, schedulesQuery.data, typedDetailQuery.data]
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
    (semester: UjatInstitutionEducationSemesterKey, value: string) => {
      patchUjatScheduleAssignMaxClassesPerDay(regionKey, semester, value.replace(/\D/g, ''))
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
        resolveEducationSemesterForIsoDate(isoDate, typedDetailQuery.data)
      if (semester == null) continue
      const daySum = day.rows.reduce(
        (sum, row) => sum + sumSelectedGradeClassCount(row.gradeValues),
        0
      )
      totals[semester] += daySum
    }
    return totals
  }, [assignDates, regionState.days, typedDetailQuery.data])

  const volunteerEducationDays = useMemo(() => {
    const out: Record<UjatInstitutionEducationSemesterKey, number | null> = { h1: null, h2: null }

    for (const semester of ['h1', 'h2'] as const) {
      const expectedClasses = semesterClassTotals[semester]
      const maxRaw = regionState.estimation[semester].maxClassesPerDay
      const volunteerRaw = regionState.estimation[semester].expectedVolunteerCount
      const volunteers = Number.parseInt(volunteerRaw, 10)
      const inputsEntered = isScheduleAssignEstimationInputsEntered(maxRaw, volunteerRaw)
      out[semester] = computeVolunteerEducationDays(expectedClasses, volunteers, inputsEntered)
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
      const institutionIds = new Set<string>(hydratedSignatureByInstitutionRef.current.keys())
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

      const results: Array<{ institutionId: string; name: string; ok: boolean; message?: string }> =
        []
      const nameById = new Map(
        applicationRows.map(row => [row.id, row.institutionName?.trim() || ''])
      )

      for (const institutionId of institutionIds) {
        const name =
          organizationNamesByApplicationId[institutionId]?.trim() ||
          nameById.get(institutionId) ||
          institutionId
        const body = buildTemporaryScheduleSaveRequest({
          regionKey,
          regionState: draft,
          institutionRowId: institutionId,
          scheduleIdByIsoDate,
          studentCountByClass: studentCountByClassRef.current,
        })
        const nextSignature = body ? serializeTemporaryScheduleSlots(body.slots) : ''
        const previousSignature =
          hydratedSignatureByInstitutionRef.current.get(institutionId) ?? ''
        if (nextSignature === previousSignature) continue
        if (!body) {
          results.push({
            institutionId,
            name,
            ok: false,
            message:
              '해당 희망일의 하루 일정(scheduleId)을 찾지 못했습니다. 연간 기간 일정으로는 저장할 수 없습니다.',
          })
          continue
        }
        try {
          const saved = await putUjatTemporarySchedule(String(programId), institutionId, body)
          const savedSlots = saved.slots ?? []
          const savedCounts = collectStudentCountByClass(savedSlots, institutionId)
          for (const [key, value] of savedCounts) {
            studentCountByClassRef.current.set(key, value)
          }
          hydratedSignatureByInstitutionRef.current.set(
            institutionId,
            savedSlots.length > 0
              ? serializeRemoteTemporaryScheduleSlots(savedSlots)
              : nextSignature
          )
          results.push({ institutionId, name, ok: true })
        } catch (error) {
          results.push({
            institutionId,
            name,
            ok: false,
            message: readApiErrorAlertMessage(
              error,
              '임시 배정 저장에 실패했습니다. 다시 시도해 주세요.'
            ),
          })
        }
      }

      const slotFailed = results.filter(item => !item.ok)
      const slotsOk = slotFailed.length === 0
      const slotSummary =
        results.length === 0
          ? '변경된 배정이 없습니다.'
          : slotFailed.length > 0
            ? slotFailed
                .map(item =>
                  item.message
                    ? `${item.name}: ${item.message}`
                    : `${item.name}: 저장에 실패했습니다.`
                )
                .join('\n')
            : '학급 배정이 저장되었습니다.'

      let estimatesOk = false
      let estimatesMessage = ''
      try {
        const existing = await fetchUjatPlanningEstimates(String(programId))
        const body = buildMergedPlanningEstimatePutBody({
          existing,
          educationRegionCode,
          regionState: draft,
        })
        await replaceUjatPlanningEstimates(String(programId), body)
        estimatesOk = true
        estimatesMessage = '산정값이 저장되었습니다.'
      } catch (error) {
        estimatesMessage = readApiErrorAlertMessage(
          error,
          '산정값 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      }

      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(String(programId)),
      })
      await queryClient.invalidateQueries({
        queryKey: [
          ...ujatQueryKeys.organizationApplicationsRoot(String(programId)),
          'schedule-assignments',
        ],
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.programSchedules(String(programId)),
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.planningEstimates(String(programId)),
      })
      hydratedKeyRef.current = null
      setVersion(v => v + 1)

      if (!slotsOk || !estimatesOk) {
        const parts = [
          slotsOk ? `학급 배정: ${slotSummary}` : `학급 배정 실패:\n${slotSummary}`,
          estimatesOk ? `산정값: ${estimatesMessage}` : `산정값 실패: ${estimatesMessage}`,
        ]
        return { ok: false as const, message: parts.join('\n'), results }
      }

      if (results.length === 0) {
        return {
          ok: true as const,
          message: `${slotSummary}\n${estimatesMessage}`,
          results,
        }
      }
      return { ok: true as const, message: `${slotSummary}\n${estimatesMessage}`, results }
    } catch (error) {
      return {
        ok: false as const,
        message: readApiErrorAlertMessage(error, '임시 배정 저장에 실패했습니다. 다시 시도해 주세요.'),
      }
    } finally {
      setSaving(false)
    }
  }, [
    applicationRows,
    educationRegionCode,
    organizationNamesByApplicationId,
    programId,
    queryClient,
    regionKey,
    remoteEnabled,
    scheduleIdByIsoDate,
  ])

  const daysPending =
    assignDates.length > 0 &&
    assignDates.some(({ isoDate }) => regionState.days[isoDate] == null)

  const contentLoading =
    remoteEnabled &&
    (remoteQuery.isLoading ||
      schedulesQuery.isLoading ||
      Boolean(hasNextPage) ||
      isFetchingNextPage ||
      hydrating ||
      daysPending)

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
    contentLoading,
    saving,
    remoteEnabled,
  }
}

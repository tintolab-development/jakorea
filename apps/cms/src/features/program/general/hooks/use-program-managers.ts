/**
 * 프로그램 상세 담당자 정보 — list/CRUD hybrid (remote ↔ mock)
 * Cache: Class C (standard nested list) — staleTime 30s, invalidate on mutation
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addGeneralProgramManager,
  deleteGeneralProgramManager,
  fetchGeneralProgramManagers,
  updateGeneralProgramManager,
} from '@/features/program/general/api/admin-general-programs-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  getAssignableManagerCandidates,
  getMockProgramManagers,
  type ProgramManagerRow,
} from '@/data/mock/program-managers'
import { fetchAdminsPageRemote } from '@/features/user/api/members-api-client'
import type { ProgramRole } from '@/types/user'

export type AssignableManagerCandidate = {
  id: string
  name: string
  email: string
  phone: string
  adminId?: number
}

export function useProgramManagers(programId: string | undefined) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const queryClient = useQueryClient()

  const [localManagers, setLocalManagers] = useState<ProgramManagerRow[]>(() =>
    programId ? getMockProgramManagers(programId) : []
  )

  useEffect(() => {
    if (remoteEnabled || !programId) return
    setLocalManagers(getMockProgramManagers(programId))
  }, [programId, remoteEnabled])

  const listQuery = useQuery({
    queryKey: generalProgramQueryKeys.managers(programId ?? ''),
    queryFn: () => fetchGeneralProgramManagers(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const candidatesQuery = useQuery({
    queryKey: generalProgramQueryKeys.managerCandidates(),
    queryFn: async (): Promise<AssignableManagerCandidate[]> => {
      const page = await fetchAdminsPageRemote({ page: 0, size: 100, status: 'ACTIVE' })
      return (page.items ?? [])
        .filter(item => item.id != null && item.name?.trim())
        .map(item => ({
          id: String(item.id),
          name: item.name!.trim(),
          email: item.email?.trim() || '',
          phone: item.phone?.trim() || '',
          adminId: item.id,
        }))
    },
    enabled: remoteEnabled,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const managers = useMemo(() => {
    if (!programId) return []
    if (remoteEnabled) {
      if (listQuery.isError) return []
      const rows = listQuery.data ?? []
      const phoneByAdminId = new Map(
        (candidatesQuery.data ?? [])
          .filter(c => c.adminId != null && c.phone.trim())
          .map(c => [c.adminId!, c.phone] as const)
      )
      return rows.map(row => {
        if (row.phone.trim()) return row
        if (row.adminId == null) return row
        const phone = phoneByAdminId.get(row.adminId)
        return phone ? { ...row, phone } : row
      })
    }
    return localManagers
  }, [
    candidatesQuery.data,
    listQuery.data,
    listQuery.isError,
    localManagers,
    programId,
    remoteEnabled,
  ])

  const invalidateManagers = useCallback(async () => {
    if (!programId) return
    await queryClient.invalidateQueries({
      queryKey: generalProgramQueryKeys.managers(programId),
    })
  }, [programId, queryClient])

  const addMutation = useMutation({
    mutationFn: async (payload: {
      adminId: number
      role: ProgramRole
      /** mock fallback fields */
      name?: string
      email?: string
      phone?: string
    }) => {
      if (!programId) throw new Error('programId가 없습니다.')
      if (remoteEnabled) {
        return addGeneralProgramManager(programId, {
          adminId: payload.adminId,
          role: payload.role,
        })
      }
      const nextNo =
        localManagers.length > 0 ? Math.max(...localManagers.map(r => r.no)) + 1 : 1
      const newRow: ProgramManagerRow = {
        id: `manager-new-${Date.now()}`,
        no: nextNo,
        name: payload.name ?? '-',
        email: payload.email ?? '',
        phone: payload.phone ?? '',
        role: payload.role,
        registeredAt: formatNow(),
      }
      setLocalManagers(prev => [newRow, ...prev])
      return newRow
    },
    retry: false,
    onSuccess: async () => {
      if (remoteEnabled) await invalidateManagers()
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { assignmentId: string; role: ProgramRole }) => {
      if (!programId) throw new Error('programId가 없습니다.')
      if (remoteEnabled) {
        return updateGeneralProgramManager(programId, payload.assignmentId, {
          role: payload.role,
        })
      }
      setLocalManagers(prev =>
        prev.map(row =>
          row.id === payload.assignmentId ? { ...row, role: payload.role } : row
        )
      )
      return null
    },
    retry: false,
    onSuccess: async () => {
      if (remoteEnabled) await invalidateManagers()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (assignmentIds: string[]) => {
      if (!programId) throw new Error('programId가 없습니다.')
      if (remoteEnabled) {
        for (const assignmentId of assignmentIds) {
          await deleteGeneralProgramManager(programId, assignmentId)
        }
        return
      }
      const keys = new Set(assignmentIds)
      setLocalManagers(prev => prev.filter(row => !keys.has(row.id)))
    },
    retry: false,
    onSuccess: async () => {
      if (remoteEnabled) await invalidateManagers()
    },
  })

  const getAssignableCandidates = useCallback(
    (excludeNames: readonly string[]): AssignableManagerCandidate[] => {
      if (remoteEnabled) {
        const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()))
        const assignedAdminIds = new Set(
          managers.map(m => m.adminId).filter((id): id is number => id != null)
        )
        return (candidatesQuery.data ?? []).filter(c => {
          if (c.adminId != null && assignedAdminIds.has(c.adminId)) return false
          return !exclude.has(c.name.trim().toLowerCase())
        })
      }
      return getAssignableManagerCandidates(excludeNames)
    },
    [candidatesQuery.data, managers, remoteEnabled]
  )

  return {
    managers,
    loading: remoteEnabled ? listQuery.isLoading || listQuery.isFetching : false,
    isRemoteDataSource: remoteEnabled && !listQuery.isError,
    isMutating:
      addMutation.isPending || updateRoleMutation.isPending || deleteMutation.isPending,
    getAssignableCandidates,
    candidatesLoading: remoteEnabled ? candidatesQuery.isFetching : false,
    addManager: async (payload: {
      adminId?: number
      role: ProgramRole
      name: string
      email: string
      phone: string
    }) => {
      try {
        if (remoteEnabled) {
          if (payload.adminId == null) {
            throw new Error('등록할 관리자(adminId)가 없습니다.')
          }
          await addMutation.mutateAsync({
            adminId: payload.adminId,
            role: payload.role,
          })
        } else {
          await addMutation.mutateAsync({
            adminId: 0,
            role: payload.role,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
          })
        }
        return { ok: true as const }
      } catch (error) {
        return {
          ok: false as const,
          message: getGeneralProgramApiErrorMessage(
            error,
            '담당자 등록에 실패했습니다. 다시 시도해 주세요.'
          ),
        }
      }
    },
    updateManagerRole: async (assignmentId: string, role: ProgramRole) => {
      try {
        await updateRoleMutation.mutateAsync({ assignmentId, role })
        return { ok: true as const }
      } catch (error) {
        return {
          ok: false as const,
          message: getGeneralProgramApiErrorMessage(
            error,
            '권한 변경에 실패했습니다. 다시 시도해 주세요.'
          ),
        }
      }
    },
    deleteManagers: async (assignmentIds: string[]) => {
      try {
        await deleteMutation.mutateAsync(assignmentIds)
        return { ok: true as const }
      } catch (error) {
        return {
          ok: false as const,
          message: getGeneralProgramApiErrorMessage(
            error,
            '담당자 삭제에 실패했습니다. 다시 시도해 주세요.'
          ),
        }
      }
    },
  }
}

function formatNow(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${h}:${min}`
}

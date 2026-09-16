/**
 * 프로그램 상세 담당자 정보 — remote only
 * Cache: Class C (standard nested list) — staleTime 30s, invalidate on mutation
 */

import { useCallback, useMemo } from 'react'
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
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import { fetchAdminsPageRemote } from '@/features/user/api/members-api-client'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
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

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && Boolean(programId),
    'general-program-managers',
    '프로그램 담당자'
  )

  const queryClient = useQueryClient()

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
        .filter(item => item.adminAccountId != null && item.name?.trim())
        .map(item => ({
          id: String(item.adminAccountId),
          name: item.name!.trim(),
          email: item.email?.trim() || '',
          phone: item.phone?.trim() || '',
          adminId: item.adminAccountId,
        }))
    },
    enabled: remoteEnabled,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const managers = useMemo((): ProgramManagerRow[] => {
    if (!programId || !remoteEnabled) return []
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
  }, [candidatesQuery.data, listQuery.data, listQuery.isError, programId, remoteEnabled])

  const invalidateManagers = useCallback(async () => {
    if (!programId) return
    await queryClient.invalidateQueries({
      queryKey: generalProgramQueryKeys.managers(programId),
    })
  }, [programId, queryClient])

  const addMutation = useMutation({
    mutationFn: async (payload: { adminId: number; role: ProgramRole }) => {
      if (!programId) throw new Error('programId가 없습니다.')
      return addGeneralProgramManager(programId, {
        adminId: payload.adminId,
        role: payload.role,
      })
    },
    retry: false,
    onSuccess: async () => {
      await invalidateManagers()
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { assignmentId: string; role: ProgramRole }) => {
      if (!programId) throw new Error('programId가 없습니다.')
      return updateGeneralProgramManager(programId, payload.assignmentId, {
        role: payload.role,
      })
    },
    retry: false,
    onSuccess: async () => {
      await invalidateManagers()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (assignmentIds: string[]) => {
      if (!programId) throw new Error('programId가 없습니다.')
      for (const assignmentId of assignmentIds) {
        await deleteGeneralProgramManager(programId, assignmentId)
      }
    },
    retry: false,
    onSuccess: async () => {
      await invalidateManagers()
    },
  })

  const getAssignableCandidates = useCallback(
    (excludeNames: readonly string[]): AssignableManagerCandidate[] => {
      if (!remoteEnabled) return []
      const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()))
      const assignedAdminIds = new Set(
        managers.map(m => m.adminId).filter((id): id is number => id != null)
      )
      return (candidatesQuery.data ?? []).filter(c => {
        if (c.adminId != null && assignedAdminIds.has(c.adminId)) return false
        return !exclude.has(c.name.trim().toLowerCase())
      })
    },
    [candidatesQuery.data, managers, remoteEnabled]
  )

  return {
    managers,
    loading: remoteEnabled ? listQuery.isLoading || listQuery.isFetching : false,
    isRemoteDataSource: remoteEnabled && !listQuery.isError,
    isMutating:
      addMutation.isPending || updateRoleMutation.isPending || deleteMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    getAssignableCandidates,
    candidatesLoading: remoteEnabled ? candidatesQuery.isFetching : false,
    addManager: async (payload: {
      adminId?: number
      role: ProgramRole
      name: string
      email: string
      phone: string
    }) => {
      if (!remoteEnabled) {
        return {
          ok: false as const,
          message: '프로그램 API를 사용할 수 없습니다.',
        }
      }
      try {
        if (payload.adminId == null) {
          throw new Error('등록할 관리자(adminId)가 없습니다.')
        }
        await addMutation.mutateAsync({
          adminId: payload.adminId,
          role: payload.role,
        })
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
      if (!remoteEnabled) {
        return {
          ok: false as const,
          message: '프로그램 API를 사용할 수 없습니다.',
        }
      }
      try {
        await updateRoleMutation.mutateAsync({ assignmentId, role })
        return { ok: true as const }
      } catch (error) {
        // OpenAPI 409: 상태 충돌 시 목록 재조회 후 안내
        await invalidateManagers()
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
      if (!remoteEnabled) {
        return {
          ok: false as const,
          message: '프로그램 API를 사용할 수 없습니다.',
        }
      }
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

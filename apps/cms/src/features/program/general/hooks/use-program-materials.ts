import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchProgramMaterialCandidates,
  fetchProgramMaterials,
  saveProgramMaterials,
  type ProgramMaterialAssignmentRequest,
} from '@/features/program/general/api/program-materials-api-client'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'

export function useProgramMaterials(programId: string | undefined, enabled = true) {
  const normalizedProgramId = programId?.trim() ?? ''
  const remoteEnabled = useGeneralProgramsRemoteEnabled(
    enabled && Boolean(normalizedProgramId),
    normalizedProgramId
  )
  const queryClient = useQueryClient()

  const materialsQuery = useQuery({
    queryKey: generalProgramQueryKeys.materials(normalizedProgramId),
    queryFn: () => fetchProgramMaterials(normalizedProgramId),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const candidatesQuery = useQuery({
    queryKey: generalProgramQueryKeys.materialCandidates(normalizedProgramId),
    queryFn: () => fetchProgramMaterialCandidates(normalizedProgramId),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (request: ProgramMaterialAssignmentRequest) =>
      saveProgramMaterials(normalizedProgramId, request),
    onSuccess: async snapshot => {
      queryClient.setQueryData(generalProgramQueryKeys.materials(normalizedProgramId), snapshot)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.materialCandidates(normalizedProgramId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.detail(normalizedProgramId),
        }),
        queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.institutions(normalizedProgramId),
        }),
      ])
    },
  })

  return {
    materials: materialsQuery.data,
    candidates: candidatesQuery.data ?? [],
    isLoading: materialsQuery.isPending || candidatesQuery.isPending,
    isFetching: materialsQuery.isFetching || candidatesQuery.isFetching,
    error: materialsQuery.error ?? candidatesQuery.error ?? null,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    remoteEnabled,
    refetch: async () => {
      await Promise.all([materialsQuery.refetch(), candidatesQuery.refetch()])
    },
  }
}

export type ProgramMaterialEditorMode = 'UNDECIDED' | 'NONE' | 'ASSIGNED'

export function useProgramMaterialEditorState(
  assignmentStatus: ProgramMaterialEditorMode | undefined,
  itemKeys: string[]
) {
  const [mode, setMode] = useState<ProgramMaterialEditorMode>('UNDECIDED')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- 서버 snapshot 변경 시 편집 draft를 재동기화 */
  useEffect(() => {
    if (dirty) return
    setMode(assignmentStatus ?? 'UNDECIDED')
    setSelectedKeys(itemKeys)
  }, [assignmentStatus, dirty, itemKeys])
  /* eslint-enable react-hooks/set-state-in-effect */

  return useMemo(
    () => ({
      mode,
      setMode: (next: ProgramMaterialEditorMode) => {
        setMode(next)
        setDirty(true)
      },
      selectedKeys,
      setSelectedKeys: (next: string[]) => {
        setSelectedKeys(next)
        setDirty(true)
      },
      reset: () => {
        setDirty(false)
        setMode(assignmentStatus ?? 'UNDECIDED')
        setSelectedKeys(itemKeys)
      },
    }),
    [assignmentStatus, itemKeys, mode, selectedKeys]
  )
}

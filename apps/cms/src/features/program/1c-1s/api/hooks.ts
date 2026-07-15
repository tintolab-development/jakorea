import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { shouldUseCompanySchoolRemoteApi } from './capabilities'
import { shouldRetryCompanySchoolQuery } from './errors'
import type { CompanySchoolListFilters } from './list-params'
import { companySchoolQueryKeys } from './query-keys'
import {
  createCompanySchoolProgram,
  deleteCompanySchoolProgram,
  getCompanySchoolProgram,
  listCompanySchoolPrograms,
  updateCompanySchoolProgram,
} from './service'

function filtersKey(filters: CompanySchoolListFilters, remoteEnabled: boolean): string {
  return JSON.stringify({ source: remoteEnabled ? 'remote' : 'mock', ...filters })
}

export function useCompanySchoolPrograms(
  filters: CompanySchoolListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseCompanySchoolRemoteApi()
  return useQuery({
    queryKey: companySchoolQueryKeys.list(filtersKey(filters, remoteEnabled)),
    queryFn: () => listCompanySchoolPrograms(filters),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: shouldRetryCompanySchoolQuery,
  })
}

export function useCompanySchoolProgramDetail(
  programId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: companySchoolQueryKeys.detail(programId ?? ''),
    queryFn: () => getCompanySchoolProgram(programId!),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: shouldRetryCompanySchoolQuery,
  })
}

export function useCreateCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.create(),
    mutationFn: createCompanySchoolProgram,
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(companySchoolQueryKeys.detail(program.id), program)
      void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
    },
  })
}

export function useUpdateCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.update(''),
    mutationFn: ({
      programId,
      program,
      patch,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
    }) => updateCompanySchoolProgram(programId, program, patch),
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(companySchoolQueryKeys.detail(program.id), program)
      void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
    },
  })
}

export function useDeleteCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.delete(''),
    mutationFn: deleteCompanySchoolProgram,
    retry: false,
    onSuccess: (_data, programId) => {
      queryClient.removeQueries({ queryKey: companySchoolQueryKeys.detail(programId) })
      void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
    },
  })
}

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getIndividualApplicantTextbookCatalog,
  shouldUseTextbooksRemoteApi,
} from '@/features/textbook/api/admin-textbooks-service'
import {
  listMockTextbookCatalogForIndividualApplicant,
  serializeIndividualTextbookCatalogKey,
} from '@/features/textbook/api/textbook-program-catalog'
import { buildIndividualApplicantTextbookOptions } from '@/features/program/general/lib/individual-applicant-textbook'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'

/**
 * 개인 참여자 승인 후 교재 셀렉 — matches(사업분야+학년).
 * 사업분야·신청 학년이 둘 다 있을 때만 remote matches를 호출한다.
 * 프로그램 교재 배정 목록은 신청 교재의 허용 목록으로 사용하지 않는다.
 */
export function useIndividualApplicantTextbookOptions(
  program: Program | null | undefined,
  educationGrade?: string
) {
  const grade = educationGrade?.trim() ?? ''
  const businessArea = normalizeProgramBusinessAreaValue(program?.businessArea) || ''
  const canFetchMatches = Boolean(program && businessArea && grade)
  const catalogKey = program ? serializeIndividualTextbookCatalogKey(program, grade) : ''
  const remoteEnabled = shouldUseTextbooksRemoteApi() && canFetchMatches
  const mockCatalog = useMemo(
    () =>
      program && canFetchMatches
        ? listMockTextbookCatalogForIndividualApplicant(program, grade)
        : [],
    [canFetchMatches, grade, program]
  )

  const matchesQuery = useQuery({
    queryKey: dataManagementQueryKeys.textbooks.matches(`individual|${catalogKey}`),
    queryFn: () => getIndividualApplicantTextbookCatalog(program!, grade),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const catalog: TextbookRow[] | undefined = useMemo(
    () =>
      !remoteEnabled
        ? mockCatalog
        : matchesQuery.data !== undefined
          ? matchesQuery.data
          : matchesQuery.isPending || matchesQuery.isLoading
            ? undefined
            : [],
    [matchesQuery.data, matchesQuery.isLoading, matchesQuery.isPending, mockCatalog, remoteEnabled]
  )

  const options = useMemo(
    () => buildIndividualApplicantTextbookOptions(program, grade, catalog),
    [catalog, grade, program]
  )

  return {
    options,
    catalog,
    isLoading: remoteEnabled && (matchesQuery.isPending || matchesQuery.isLoading),
  }
}

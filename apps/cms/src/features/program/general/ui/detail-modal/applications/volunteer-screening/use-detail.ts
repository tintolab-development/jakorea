import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
import { APPLICANT_ID_PARAM } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  resolveGeneralVolunteerDocScreeningDetailMeta,
  screeningDocPassedDetailTitle,
  screeningInterview2DetailTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'

export type GeneralVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

export type GeneralVolunteerApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
}

export type GeneralVolunteerApplicantDetailMetaChangeHandler = (
  meta: GeneralVolunteerApplicantDetailMeta | null
) => void

function getDetailMeta(
  variant: GeneralVolunteerApplicantDetailVariant,
  name: string,
  interviewEnabled: boolean,
  subjectKind: ScreeningSubjectKind = 'volunteer'
): { title: string; breadcrumbLabel: string } {
  if (variant === 'doc_passed') {
    return { title: screeningDocPassedDetailTitle(subjectKind, name), breadcrumbLabel: name }
  }
  if (variant === 'interview2') {
    return { title: screeningInterview2DetailTitle(subjectKind, name), breadcrumbLabel: name }
  }
  return resolveGeneralVolunteerDocScreeningDetailMeta(name, interviewEnabled)
}

export function useGeneralVolunteerApplicantDetail({
  programId,
  list,
  variant,
  subjectKind = 'volunteer',
  interviewEnabled = true,
  loading = false,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  programId: string
  list: GeneralVolunteerApplicantRow[]
  variant: GeneralVolunteerApplicantDetailVariant
  subjectKind?: ScreeningSubjectKind
  /** 봉사자 면접 여부. false면 1차 서류 심사 대상자 상세 대신 신청 상세 제목 */
  interviewEnabled?: boolean
  loading?: boolean
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedApplicant, setSelectedApplicant] = useState<GeneralVolunteerApplicantRow | null>(
    null
  )
  const selectedApplicantRef = useRef(selectedApplicant)
  selectedApplicantRef.current = selectedApplicant
  const programIdRef = useRef(programId)

  const clearApplicantIdFromUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    if (!next.has(APPLICANT_ID_PARAM)) return
    next.delete(APPLICANT_ID_PARAM)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const { toSearch: navigateToListAncestor } = useNavigateToAncestor()

  /** 사용자가 상세를 닫을 때 — 지나온 목록 엔트리로 뒤로, 없으면 replace */
  const closeApplicantIdToList = useCallback(() => {
    if (!new URLSearchParams(window.location.search).has(APPLICANT_ID_PARAM)) return
    navigateToListAncestor(current => {
      const next = new URLSearchParams(current)
      next.delete(APPLICANT_ID_PARAM)
      return next
    })
  }, [navigateToListAncestor])

  const setApplicantIdInUrl = useCallback(
    (applicantId: string) => {
      const next = new URLSearchParams(searchParams)
      if (next.get(APPLICANT_ID_PARAM) === applicantId) return
      next.set(APPLICANT_ID_PARAM, applicantId)
      setSearchParams(next, { replace: false })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (programIdRef.current === programId) return
    programIdRef.current = programId
    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [clearApplicantIdFromUrl, programId])

  useEffect(() => {
    // 헤더 X → 부모 handleHeaderClose가 호출 — 목록으로만 복귀
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (!selectedApplicantRef.current) return false
      setSelectedApplicant(null)
      closeApplicantIdToList()
      return true
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [closeApplicantIdToList, onRegisterApplicantCloseHandler])

  useEffect(() => {
    if (!onVolunteerApplicantDetailMetaChange) return
    onVolunteerApplicantDetailMetaChange(
      selectedApplicant
        ? getDetailMeta(variant, selectedApplicant.name, interviewEnabled, subjectKind)
        : null
    )
  }, [
    interviewEnabled,
    onVolunteerApplicantDetailMetaChange,
    selectedApplicant,
    subjectKind,
    variant,
  ])

  useEffect(() => {
    const applicantId = searchParams.get(APPLICANT_ID_PARAM)
    if (!applicantId) {
      setSelectedApplicant(prev => (prev ? null : prev))
      return
    }

    const fromList = list.find(row => row.id === applicantId)
    if (fromList) {
      setSelectedApplicant(prev => (prev?.id === fromList.id ? prev : fromList))
      return
    }

    if (loading) return
    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [clearApplicantIdFromUrl, list, loading, searchParams])

  useEffect(() => {
    if (!selectedApplicant) return
    const updated = list.find(row => row.id === selectedApplicant.id)
    if (!updated) return
    setSelectedApplicant(prev => (prev === updated ? prev : updated))
  }, [list, selectedApplicant])

  const openApplicantDetail = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      setSelectedApplicant(row)
      setApplicantIdInUrl(row.id)
    },
    [setApplicantIdInUrl]
  )

  return {
    selectedApplicant,
    openApplicantDetail,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { UjatDocumentScreeningConfirmRequest } from './ujat-volunteer-document-screening-actions'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_APPLICANT_ID_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  confirmUjatVolunteerDocumentApprove,
  confirmUjatVolunteerDocumentReject,
} from './ujat-volunteer-document-screening-actions'
import {
  getUjatVolunteerDocPassedDetailTitle,
  getUjatVolunteerDocScreeningDetailTitle,
  getUjatVolunteerInterview2DetailTitle,
} from './ujat-volunteer-applicant-detail-title'

export type UjatVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'
export type UjatVolunteerApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
}
export type UjatVolunteerApplicantDetailMetaChangeHandler = (
  meta: UjatVolunteerApplicantDetailMeta | null
) => void
export type UseUjatVolunteerApplicantDetailParams = {
  programId: string
  half: UjatVolunteerRecruitHalf
  list: UjatVolunteerApplicantRow[]
  detailVariant: UjatVolunteerApplicantDetailVariant
  applyDocumentScreeningStatus: (ids: string[], status: 'pass' | 'fail') => void
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: UjatVolunteerApplicantDetailMetaChangeHandler
  showDocumentScreeningConfirm: (options: UjatDocumentScreeningConfirmRequest) => void
}

function getVolunteerApplicantDetailTitle(
  detailVariant: UjatVolunteerApplicantDetailVariant,
  half: UjatVolunteerRecruitHalf,
  name: string
): string {
  if (detailVariant === 'doc_passed') {
    return getUjatVolunteerDocPassedDetailTitle(half, name)
  }
  if (detailVariant === 'interview2') {
    return getUjatVolunteerInterview2DetailTitle(half, name)
  }
  return getUjatVolunteerDocScreeningDetailTitle(half, name)
}

export function useUjatVolunteerApplicantDetail({
  programId,
  half,
  list,
  detailVariant,
  applyDocumentScreeningStatus,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
  showDocumentScreeningConfirm,
}: UseUjatVolunteerApplicantDetailParams) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedApplicant, setSelectedApplicant] = useState<UjatVolunteerApplicantRow | null>(null)
  const selectedApplicantRef = useRef(selectedApplicant)
  selectedApplicantRef.current = selectedApplicant
  const scopeRef = useRef({ programId, half })

  const clearApplicantIdFromUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    if (!next.has(UJAT_APPLICANT_ID_PARAM)) return
    next.delete(UJAT_APPLICANT_ID_PARAM)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const setApplicantIdInUrl = useCallback(
    (applicantId: string) => {
      const next = new URLSearchParams(searchParams)
      if (next.get(UJAT_APPLICANT_ID_PARAM) === applicantId) return
      next.set(UJAT_APPLICANT_ID_PARAM, applicantId)
      setSearchParams(next, { replace: false })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    const prev = scopeRef.current
    if (prev.programId === programId && prev.half === half) return
    scopeRef.current = { programId, half }
    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [programId, half, clearApplicantIdFromUrl])

  useEffect(() => {
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (selectedApplicantRef.current) {
        setSelectedApplicant(null)
        clearApplicantIdFromUrl()
        return true
      }
      return false
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [clearApplicantIdFromUrl, onRegisterApplicantCloseHandler])

  const selectedApplicantName = selectedApplicant?.name

  useEffect(() => {
    if (!onVolunteerApplicantDetailMetaChange) return
    onVolunteerApplicantDetailMetaChange(
      selectedApplicantName
        ? {
            title: getVolunteerApplicantDetailTitle(detailVariant, half, selectedApplicantName),
            breadcrumbLabel: selectedApplicantName,
          }
        : null
    )
    return () => onVolunteerApplicantDetailMetaChange(null)
  }, [detailVariant, half, onVolunteerApplicantDetailMetaChange, selectedApplicantName])

  /** URL → state: 현재 탭 목록에 있는 지원자만 상세 연동 (다른 탭 applicantId는 URL에서 제거) */
  useEffect(() => {
    const applicantId = searchParams.get(UJAT_APPLICANT_ID_PARAM)
    if (!applicantId) {
      setSelectedApplicant(prev => (prev ? null : prev))
      return
    }

    const fromList = list.find(row => row.id === applicantId)
    if (fromList) {
      setSelectedApplicant(prev => (prev?.id === fromList.id ? prev : fromList))
      return
    }

    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [clearApplicantIdFromUrl, list, searchParams])

  const selectedApplicantId = selectedApplicant?.id

  useEffect(() => {
    if (!selectedApplicantId) return
    const updated = list.find(row => row.id === selectedApplicantId)
    if (updated) {
      setSelectedApplicant(updated)
    }
  }, [list, selectedApplicantId])

  const openApplicantDetail = useCallback(
    (row: UjatVolunteerApplicantRow) => {
      setSelectedApplicant(row)
      setApplicantIdInUrl(row.id)
    },
    [setApplicantIdInUrl]
  )

  const closeApplicantDetail = useCallback(() => {
    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [clearApplicantIdFromUrl])

  const handleDocumentReject = useCallback(() => {
    if (!selectedApplicant) return
    confirmUjatVolunteerDocumentReject({
      showConfirm: showDocumentScreeningConfirm,
      count: 1,
      onConfirm: () => {
        applyDocumentScreeningStatus([selectedApplicant.id], 'fail')
      },
    })
  }, [applyDocumentScreeningStatus, selectedApplicant, showDocumentScreeningConfirm])

  const handleDocumentApprove = useCallback(() => {
    if (!selectedApplicant) return
    confirmUjatVolunteerDocumentApprove({
      showConfirm: showDocumentScreeningConfirm,
      count: 1,
      onConfirm: () => {
        applyDocumentScreeningStatus([selectedApplicant.id], 'pass')
      },
    })
  }, [applyDocumentScreeningStatus, selectedApplicant, showDocumentScreeningConfirm])

  return {
    selectedApplicant,
    openApplicantDetail,
    closeApplicantDetail,
    handleDocumentReject,
    handleDocumentApprove,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { UjatDocumentScreeningConfirmRequest } from './ujat-volunteer-document-screening-actions'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatVolunteerRecruitHalf } from '@/features/program/model/ujat-volunteer-screening-constants'
import { UJAT_APPLICANT_ID_PARAM } from '@/features/program/ui/detail-modal/ujat-program-detail-url'
import {
  confirmUjatVolunteerDocumentApprove,
  confirmUjatVolunteerDocumentReject,
} from './ujat-volunteer-document-screening-actions'
import {
  getUjatVolunteerDocPassedDetailTitle,
  getUjatVolunteerDocScreeningDetailTitle,
} from './ujat-volunteer-applicant-detail-title'

export type UjatVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed'

export function useUjatVolunteerApplicantDetail({
  programId,
  half,
  list,
  detailVariant,
  applyDocumentScreeningStatus,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailTitleChange,
  showDocumentScreeningConfirm,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
  list: UjatVolunteerApplicantRow[]
  detailVariant: UjatVolunteerApplicantDetailVariant
  applyDocumentScreeningStatus: (ids: string[], status: 'pass' | 'fail') => void
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailTitleChange?: (title: string | null) => void
  showDocumentScreeningConfirm: (options: UjatDocumentScreeningConfirmRequest) => void
}) {
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
      setSearchParams(next, { replace: true })
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

  useEffect(() => {
    if (!onVolunteerApplicantDetailTitleChange) return
    const titleForApplicant = (name: string) =>
      detailVariant === 'doc_passed'
        ? getUjatVolunteerDocPassedDetailTitle(half, name)
        : getUjatVolunteerDocScreeningDetailTitle(half, name)
    onVolunteerApplicantDetailTitleChange(
      selectedApplicant ? titleForApplicant(selectedApplicant.name) : null
    )
    return () => onVolunteerApplicantDetailTitleChange(null)
  }, [detailVariant, half, onVolunteerApplicantDetailTitleChange, selectedApplicant])

  /** URL → state: 현재 탭 목록에 있는 지원자만 상세 연동 (다른 탭 applicantId는 URL에서 제거) */
  useEffect(() => {
    const applicantId = searchParams.get(UJAT_APPLICANT_ID_PARAM)
    if (!applicantId) return

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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_APPLICANT_ID_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  getUjatVolunteerDocPassedDetailTitle,
  getUjatVolunteerDocScreeningDetailTitle,
  getUjatVolunteerInterview2DetailTitle,
} from './detail-title'

export type ApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'
export type ApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
}
export type ApplicantDetailMetaChangeHandler = (
  meta: ApplicantDetailMeta | null
) => void
export type UseApplicantDetailParams = {
  programId: string
  half: UjatVolunteerRecruitHalf
  list: UjatVolunteerApplicantRow[]
  detailVariant: ApplicantDetailVariant
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: ApplicantDetailMetaChangeHandler
  onRequestDocumentApprove?: (row: UjatVolunteerApplicantRow) => void
  onRequestDocumentReject?: (row: UjatVolunteerApplicantRow) => void
}

function getVolunteerApplicantDetailTitle(
  detailVariant: ApplicantDetailVariant,
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

export function useApplicantDetail({
  programId,
  half,
  list,
  detailVariant,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
  onRequestDocumentApprove,
  onRequestDocumentReject,
}: UseApplicantDetailParams) {
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

  const { toSearch: navigateToListAncestor } = useNavigateToAncestor()

  /** 사용자가 상세를 닫을 때 — 지나온 목록 엔트리로 뒤로, 없으면 replace */
  const closeApplicantIdToList = useCallback(() => {
    if (!new URLSearchParams(window.location.search).has(UJAT_APPLICANT_ID_PARAM)) return
    navigateToListAncestor(current => {
      const next = new URLSearchParams(current)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      return next
    })
  }, [navigateToListAncestor])

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
    // 헤더 X / ESC → 모달 handleHeaderClose가 호출 — 목록으로만 복귀
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (selectedApplicantRef.current) {
        setSelectedApplicant(null)
        closeApplicantIdToList()
        return true
      }
      return false
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [closeApplicantIdToList, onRegisterApplicantCloseHandler])

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
    closeApplicantIdToList()
  }, [closeApplicantIdToList])

  const handleDocumentReject = useCallback(() => {
    if (!selectedApplicant || !onRequestDocumentReject) return
    onRequestDocumentReject(selectedApplicant)
  }, [onRequestDocumentReject, selectedApplicant])

  const handleDocumentApprove = useCallback(() => {
    if (!selectedApplicant || !onRequestDocumentApprove) return
    onRequestDocumentApprove(selectedApplicant)
  }, [onRequestDocumentApprove, selectedApplicant])

  return {
    selectedApplicant,
    openApplicantDetail,
    closeApplicantDetail,
    handleDocumentReject,
    handleDocumentApprove,
  }
}

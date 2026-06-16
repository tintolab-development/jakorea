import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { APPLICANT_ID_PARAM } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  screeningDoc1DetailTitle,
  screeningDocPassedDetailTitle,
  screeningInterview2DetailTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'

export type GeneralVolunteerApplicantDetailVariant =
  | 'doc_screening'
  | 'doc_passed'
  | 'interview2'

export type GeneralVolunteerApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
}

export type GeneralVolunteerApplicantDetailMetaChangeHandler = (
  meta: GeneralVolunteerApplicantDetailMeta | null
) => void

function getDetailTitle(
  variant: GeneralVolunteerApplicantDetailVariant,
  name: string,
  subjectKind: ScreeningSubjectKind = 'volunteer'
): string {
  if (variant === 'doc_passed') return screeningDocPassedDetailTitle(subjectKind, name)
  if (variant === 'interview2') return screeningInterview2DetailTitle(subjectKind, name)
  return screeningDoc1DetailTitle(subjectKind, name)
}

export function useGeneralVolunteerApplicantDetail({
  programId,
  list,
  variant,
  subjectKind = 'volunteer',
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  programId: string
  list: GeneralVolunteerApplicantRow[]
  variant: GeneralVolunteerApplicantDetailVariant
  subjectKind?: ScreeningSubjectKind
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedApplicant, setSelectedApplicant] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const selectedApplicantRef = useRef(selectedApplicant)
  selectedApplicantRef.current = selectedApplicant
  const programIdRef = useRef(programId)

  const clearApplicantIdFromUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    if (!next.has(APPLICANT_ID_PARAM)) return
    next.delete(APPLICANT_ID_PARAM)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

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
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (!selectedApplicantRef.current) return false
      setSelectedApplicant(null)
      clearApplicantIdFromUrl()
      return true
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [clearApplicantIdFromUrl, onRegisterApplicantCloseHandler])

  useEffect(() => {
    if (!onVolunteerApplicantDetailMetaChange) return
    onVolunteerApplicantDetailMetaChange(
      selectedApplicant
        ? {
            title: getDetailTitle(variant, selectedApplicant.name, subjectKind),
            breadcrumbLabel: selectedApplicant.name,
          }
        : null
    )
  }, [onVolunteerApplicantDetailMetaChange, selectedApplicant, subjectKind, variant])

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

    setSelectedApplicant(null)
    clearApplicantIdFromUrl()
  }, [clearApplicantIdFromUrl, list, searchParams])

  useEffect(() => {
    if (!selectedApplicant) return
    const updated = list.find(row => row.id === selectedApplicant.id)
    if (!updated) return
    setSelectedApplicant(prev => {
      if (prev?.id === updated.id && prev.name === updated.name) return prev
      return updated
    })
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

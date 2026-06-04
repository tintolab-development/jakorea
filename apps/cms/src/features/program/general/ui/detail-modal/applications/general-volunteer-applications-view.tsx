import { useCallback } from 'react'
import type { Program } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UjatVolunteerDocScreeningSection } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-doc-screening-section'
import { UjatVolunteerDocPassedSection } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-doc-passed-section'
import { UjatVolunteerInterview2Section } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview2-section'
import type { UjatVolunteerApplicantDetailMeta } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/use-ujat-volunteer-applicant-detail'
import './participant-applications.css'

/** 일반 프로그램은 상·하반기 구분 없이 단일 봉사자 모집 — mock·UJAT 심사 UI는 h1 슬롯 재사용 */
const GENERAL_VOLUNTEER_RECRUIT_HALF: UjatVolunteerRecruitHalf = 'h1'

export type GeneralVolunteerApplicationsTab =
  | 'vol_all'
  | 'vol_doc1'
  | 'vol_doc_passed'
  | 'vol_interview2'

export interface GeneralVolunteerApplicationsViewProps {
  program: Program
  activeTab: string
  interviewEnabled: boolean
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: (meta: UjatVolunteerApplicantDetailMeta | null) => void
}

function normalizeGeneralVolunteerApplicantMeta(
  meta: UjatVolunteerApplicantDetailMeta
): UjatVolunteerApplicantDetailMeta {
  const stripHalfPrefix = (value: string) => value.replace(/^(상반기|하반기)\s+/, '')
  return {
    title: stripHalfPrefix(meta.title),
    breadcrumbLabel: stripHalfPrefix(meta.breadcrumbLabel),
  }
}

function resolveVolunteerScreenTab(
  activeTab: string,
  interviewEnabled: boolean
): GeneralVolunteerApplicationsTab {
  if (!interviewEnabled) return 'vol_all'
  if (activeTab === 'vol_doc_passed' || activeTab === 'vol_interview2') return activeTab
  return 'vol_doc1'
}

export function GeneralVolunteerApplicationsView({
  program,
  activeTab,
  interviewEnabled,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: GeneralVolunteerApplicationsViewProps) {
  const screenTab = resolveVolunteerScreenTab(activeTab, interviewEnabled)

  const handleVolunteerApplicantDetailMetaChange = useCallback(
    (meta: UjatVolunteerApplicantDetailMeta | null) => {
      if (!meta) {
        onVolunteerApplicantDetailMetaChange?.(null)
        return
      }
      onVolunteerApplicantDetailMetaChange?.(normalizeGeneralVolunteerApplicantMeta(meta))
    },
    [onVolunteerApplicantDetailMetaChange]
  )

  const sharedSectionProps = {
    programId: program.id,
    half: GENERAL_VOLUNTEER_RECRUIT_HALF,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange: handleVolunteerApplicantDetailMetaChange,
  }

  return (
    <div className="participant-applications">
      {screenTab === 'vol_doc_passed' ? (
        <UjatVolunteerDocPassedSection {...sharedSectionProps} />
      ) : screenTab === 'vol_interview2' ? (
        <UjatVolunteerInterview2Section {...sharedSectionProps} />
      ) : (
        <UjatVolunteerDocScreeningSection {...sharedSectionProps} columnPreset="general" />
      )}
    </div>
  )
}

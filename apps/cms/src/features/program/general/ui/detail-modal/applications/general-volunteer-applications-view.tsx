import { useCallback } from 'react'
import type { Program } from '@/types/domain'
import { GeneralVolunteerDocScreeningSection } from './volunteer-screening/doc-screening-section'
import { GeneralVolunteerDocPassedSection } from './volunteer-screening/doc-passed-section'
import { GeneralVolunteerInterview2Section } from './volunteer-screening/interview2-section'
import type { GeneralVolunteerApplicantDetailMeta } from './volunteer-screening/use-detail'
import './participant-applications.css'

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
  onVolunteerApplicantDetailMetaChange?: (meta: GeneralVolunteerApplicantDetailMeta | null) => void
}

function normalizeGeneralVolunteerApplicantMeta(
  meta: GeneralVolunteerApplicantDetailMeta
): GeneralVolunteerApplicantDetailMeta {
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
    (meta: GeneralVolunteerApplicantDetailMeta | null) => {
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
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange: handleVolunteerApplicantDetailMetaChange,
  }

  return (
    <div className="participant-applications">
      {screenTab === 'vol_doc_passed' ? (
        <GeneralVolunteerDocPassedSection
          program={program}
          onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
          onVolunteerApplicantDetailMetaChange={handleVolunteerApplicantDetailMetaChange}
        />
      ) : screenTab === 'vol_interview2' ? (
        <GeneralVolunteerInterview2Section {...sharedSectionProps} />
      ) : (
        <GeneralVolunteerDocScreeningSection {...sharedSectionProps} />
      )}
    </div>
  )
}

import type { Program } from '@/types/domain'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/general-survey-audience'
import {
  generalIndividualApplicationFilterFields,
  generalOrganizationApplicationFilterFields,
} from '@/features/program/general/lib/general-application-filter-fields'
import { ApplicantList } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import './general-participant-applications.css'

export interface GeneralParticipantApplicationsViewProps {
  program: Program
  listTitle: string
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
}

export function GeneralParticipantApplicationsView({
  program,
  listTitle,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
}: GeneralParticipantApplicationsViewProps) {
  const isIndividual = isGeneralIndividualProgram(program)

  if (isIndividual) {
    return (
      <div className="general-participant-applications">
        <ApplicantList
          menu="individual-applications"
          program={program}
          programId={program.id}
          listTitle={listTitle}
          filterFields={generalIndividualApplicationFilterFields}
          detailVariant="general"
          onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
          onApplicantDetailMetaChange={onApplicantDetailMetaChange}
        />
      </div>
    )
  }

  return (
    <div className="general-participant-applications">
      <ApplicantList
        menu="institutions"
        program={program}
        programId={program.id}
        listTitle={listTitle}
        filterFields={generalOrganizationApplicationFilterFields}
        institutionColumnPreset="general-detail"
        sessionLinePreset="general-detail"
        detailVariant="general"
        onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
        onApplicantDetailMetaChange={onApplicantDetailMetaChange}
      />
    </div>
  )
}

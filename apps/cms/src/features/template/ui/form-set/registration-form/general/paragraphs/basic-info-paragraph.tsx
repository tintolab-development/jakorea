import type { ReactNode } from 'react'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import type {
  ProgramRegistrationParticipantState,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ProgramRegistrationBasicInfoSponsorFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph-sponsor-fields'
import { ProgramRegistrationBasicInfoTitleFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph-title-fields'
import {
  ProgramRegistrationBasicInfoBusinessFieldField,
  ProgramRegistrationBasicInfoCourseDeliveredByField,
  ProgramRegistrationBasicInfoEducationCourseField,
  ProgramRegistrationBasicInfoEducationVenueFields,
  ProgramRegistrationBasicInfoFooterIpsTypeField,
  ProgramRegistrationBasicInfoIpOwnedField,
  ProgramRegistrationBasicInfoOperationRangeField,
  ProgramRegistrationBasicInfoPartnerInvolvementField,
  ProgramRegistrationBasicInfoParticipantTypesField,
  ProgramRegistrationBasicInfoSurveyItemsField,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph-overlay-fields'
import { TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import '@/features/template/ui/form-editor/form-editor.css'
import './program-registration-paragraph.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

type ProgramRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
  hideEducationPlace?: boolean
  includeFooterIpsType?: boolean
  participantTypesEdit?: ReactNode
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
  trainedTeachersDefaults?: boolean
  programType?: ProgramRegistrationType
  lockParticipantTypes?: boolean
}

export function ProgramRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange,
  onOrganizationChange,
  onTeacherInstructorChange,
  onVolunteerChange,
  hideEducationPlace = false,
  includeFooterIpsType = false,
  participantTypesEdit,
  sponsorId: sponsorIdProp,
  onSponsorIdChange,
  sponsorContactId: sponsorContactIdProp,
  onSponsorContactIdChange,
  trainedTeachersDefaults = false,
  programType,
  lockParticipantTypes = false,
}: ProgramRegistrationBasicInfoParagraphProps) {
  const overlayPrefix = trainedTeachersDefaults
    ? TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX
    : 'generalRegistration.basicInfo'

  const overlayFieldProps = { overlayPrefix, trainedTeachersDefaults }

  return (
    <>
      <DetailInfoForm
        title="기본 정보*"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <ProgramRegistrationBasicInfoTitleFields
          trainedTeachersDefaults={trainedTeachersDefaults}
          lockDetailedProgramToNone={programType === 'schedule'}
        />
        <DetailInfoForm.Row type="double">
          <ProgramRegistrationBasicInfoOperationRangeField overlayPrefix={overlayPrefix} />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            readOnlyDisplay
            view={
              <span className="form-editor-template-field-hint-text">
                {PROGRAM_PROGRESS_STATIC_HINT}
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <ProgramRegistrationBasicInfoParticipantTypesField
            participant={participant}
            lockParticipantTypes={lockParticipantTypes}
            participantTypesEdit={participantTypesEdit}
            onIndividualChange={onIndividualChange}
            onOrganizationChange={onOrganizationChange}
            onTeacherInstructorChange={onTeacherInstructorChange}
            onVolunteerChange={onVolunteerChange}
          />
          <ProgramRegistrationBasicInfoBusinessFieldField {...overlayFieldProps} />
        </DetailInfoForm.Row>
        <ProgramRegistrationBasicInfoSponsorFields
          sponsorId={sponsorIdProp}
          onSponsorIdChange={onSponsorIdChange}
          sponsorContactId={sponsorContactIdProp}
          onSponsorContactIdChange={onSponsorContactIdChange}
          trainedTeachersDefaults={trainedTeachersDefaults}
        />
        {hideEducationPlace ? null : (
          <DetailInfoForm.Row type="single">
            <ProgramRegistrationBasicInfoEducationVenueFields overlayPrefix={overlayPrefix} />
          </DetailInfoForm.Row>
        )}
        <DetailInfoForm.Row type="single">
          <ProgramRegistrationBasicInfoSurveyItemsField {...overlayFieldProps} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title=""
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <ProgramRegistrationBasicInfoEducationCourseField {...overlayFieldProps} />
          <ProgramRegistrationBasicInfoIpOwnedField {...overlayFieldProps} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <ProgramRegistrationBasicInfoCourseDeliveredByField {...overlayFieldProps} />
          <ProgramRegistrationBasicInfoPartnerInvolvementField {...overlayFieldProps} />
        </DetailInfoForm.Row>
        {includeFooterIpsType ? (
          <DetailInfoForm.Row type="single">
            <ProgramRegistrationBasicInfoFooterIpsTypeField {...overlayFieldProps} />
          </DetailInfoForm.Row>
        ) : null}
      </DetailInfoForm>
    </>
  )
}

import { memo, useMemo, type ReactNode } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { GeneralParticipantAudienceCheckboxGroup } from '@/features/program/general/ui/participant-audience-checkbox-group'
import { TEMPLATE_FORM_BUSINESS_AREA_OPTIONS } from '@/features/template/lib/template-form-select-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import {
  initialProgramRegistrationSurveyItems,
  PROGRAM_REGISTRATION_SURVEY_ITEM_IDS,
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
  type ProgramRegistrationSurveyItemId,
} from '@/features/template/lib/program-registration-survey-items'
import {
  useProgramRegistrationOverlayKv,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  ProgramRegistrationOverlaySelectField,
} from '@/features/template/ui/form-set/registration-form/shared/registration-overlay-fields'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  normalizeTrainedTeachersAllSelectValue,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'

type OperationRangeSeal = { start: string; end: string } | null

function participantTypeLabel(
  value: (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value']
) {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value
}

function EducationVenueDetailInput({ overlayKey }: { overlayKey: string }) {
  const [educationVenueDetail, setEducationVenueDetail] = useProgramRegistrationOverlayKv(
    overlayKey,
    ''
  )
  return (
    <CmsInput
      inputSize="small"
      placeholder="교육이 진행될 상세 장소를 입력해 주세요"
      width="100%"
      style={{ flex: '1 1 0', minWidth: 0 }}
      value={educationVenueDetail}
      onChange={event => setEducationVenueDetail(event.target.value)}
    />
  )
}

type OverlayPrefixProps = {
  overlayPrefix: string
  trainedTeachersDefaults: boolean
}

export const ProgramRegistrationBasicInfoOperationRangeField = memo(
  function ProgramRegistrationBasicInfoOperationRangeField({
    overlayPrefix,
  }: Pick<OverlayPrefixProps, 'overlayPrefix'>) {
    const [operationAnchorIso, setOperationAnchorIso] = useProgramRegistrationOverlayKv<
      string | null
    >(`${overlayPrefix}.operationAnchorIso`, null)
    const [operationRangeSeal, setOperationRangeSeal] = useProgramRegistrationOverlayKv<
      OperationRangeSeal
    >(`${overlayPrefix}.operationRangeSeal`, null)

    const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
    const setOperationAnchorDate = (next: Dayjs | null) => {
      setOperationAnchorIso(next == null ? null : next.toISOString())
    }
    const operationRange: [Dayjs, Dayjs] | null = useMemo(() => {
      if (operationRangeSeal == null) return null
      return [dayjs(operationRangeSeal.start), dayjs(operationRangeSeal.end)]
    }, [operationRangeSeal])
    const setOperationRange = (next: [Dayjs, Dayjs] | null) => {
      if (next == null) {
        setOperationRangeSeal(null)
        return
      }
      setOperationRangeSeal({ start: next[0].toISOString(), end: next[1].toISOString() })
    }
    const operationRangeWithTime = useMemo(
      () =>
        operationRange == null ? false : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
      [operationRange]
    )

    return (
      <DetailInfoForm.Field
        label="사업 운영 기간"
        validationKey="basicInfo.operationRangeSeal"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <ParagraphDatePicker inputSize="small"
              mode="single"
              presetMode="period"
              value={operationAnchorDate}
              width="100%"
              placeholder="사업 운영 기간을 선택하세요"
              preferPeriodModeInPopover
              suppressAutoTodayWhenEmpty
              excludeBusinessPeriodConstraint
              appliedSurfaceRange={operationRange}
              appliedSurfaceWithTime={operationRangeWithTime}
              onRangeChange={range => setOperationRange(range)}
              onChange={next => {
                if (next == null) return
                setOperationAnchorDate(next)
              }}
            />
          </div>
        }
        view="-"
      />
    )
  }
)

type ParticipantTypesRowProps = {
  participant: ProgramRegistrationParticipantState
  lockParticipantTypes: boolean
  participantTypesEdit?: ReactNode
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
}

export const ProgramRegistrationBasicInfoParticipantTypesField = memo(
  function ProgramRegistrationBasicInfoParticipantTypesField({
    participant,
    lockParticipantTypes,
    participantTypesEdit,
    onIndividualChange,
    onOrganizationChange,
    onTeacherInstructorChange,
    onVolunteerChange,
  }: ParticipantTypesRowProps) {
    return (
      <DetailInfoForm.Field
        label="참여자 유형"
        validationKey="basicInfo.audience"
        edit={
          participantTypesEdit ?? (
            <div className="detail-info-form-inputs-wrapper">
              <GeneralParticipantAudienceCheckboxGroup
                individual={participant.individual}
                organization={participant.organization}
                disabled={lockParticipantTypes}
                onIndividualChange={onIndividualChange}
                onOrganizationChange={onOrganizationChange}
              />
              <CmsCheckbox
                checkboxSize="medium"
                checked={participant.teacherInstructor === true}
                disabled={lockParticipantTypes}
                onChange={e => onTeacherInstructorChange(e.target.checked)}
              >
                {participantTypeLabel('teacher_instructor')}
              </CmsCheckbox>
              <CmsCheckbox
                checkboxSize="medium"
                checked={participant.volunteer === true}
                disabled={lockParticipantTypes}
                onChange={e => onVolunteerChange(e.target.checked)}
              >
                {participantTypeLabel('volunteer')}
              </CmsCheckbox>
            </div>
          )
        }
        view="-"
      />
    )
  }
)

export const ProgramRegistrationBasicInfoBusinessFieldField = memo(
  function ProgramRegistrationBasicInfoBusinessFieldField({
    overlayPrefix,
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    return (
      <ProgramRegistrationOverlaySelectField
        label="사업 분야"
        validationKey="basicInfo.businessField"
        overlayKey={`${overlayPrefix}.businessField`}
        placeholder="사업 분야를 선택하세요"
        options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
        defaultValue={trainedTeachersDefaults ? 'economy_finance' : ''}
      />
    )
  }
)

export const ProgramRegistrationBasicInfoEducationVenueFields = memo(
  function ProgramRegistrationBasicInfoEducationVenueFields({
    overlayPrefix,
  }: Pick<OverlayPrefixProps, 'overlayPrefix'>) {
    const educationVenueDetailKey = `${overlayPrefix}.educationVenueDetail`
    const [educationVenueKind, setEducationVenueKind] = useProgramRegistrationOverlayKv<
      'inside' | 'outside' | 'other'
    >(`${overlayPrefix}.educationVenueKind`, 'inside')

    return (
      <DetailInfoForm.Field
        label="교육 장소"
        validationKey="basicInfo.educationVenueDetail"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <CmsRadioGroup
              size="medium"
              value={educationVenueKind}
              onChange={e =>
                setEducationVenueKind(e.target.value as 'inside' | 'outside' | 'other')
              }
            >
              <CmsRadio size="medium" value="inside">기관 안</CmsRadio>
              <CmsRadio size="medium" value="outside">기관 밖</CmsRadio>
              <CmsRadio size="medium" value="other">기타(직접입력)</CmsRadio>
            </CmsRadioGroup>
            <DetailInfoForm.InputsSeparator />
            <EducationVenueDetailInput overlayKey={educationVenueDetailKey} />
          </div>
        }
        view="-"
      />
    )
  }
)

export const ProgramRegistrationBasicInfoSurveyItemsField = memo(
  function ProgramRegistrationBasicInfoSurveyItemsField({
    overlayPrefix,
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    const surveyItemsDefault = initialProgramRegistrationSurveyItems(trainedTeachersDefaults)
    const [surveyItems] = useProgramRegistrationOverlayKv<
      Record<ProgramRegistrationSurveyItemId, boolean>
    >(`${overlayPrefix}.surveyItems`, surveyItemsDefault)

    const toggleSurveyItem = (id: ProgramRegistrationSurveyItemId) => (e: CheckboxChangeEvent) => {
      updateProgramRegistrationOverlayKey<Record<ProgramRegistrationSurveyItemId, boolean>>(
        `${overlayPrefix}.surveyItems`,
        prev => ({
          ...(prev ?? initialProgramRegistrationSurveyItems(trainedTeachersDefaults)),
          [id]: e.target.checked,
        })
      )
    }

    return (
      <DetailInfoForm.Field
        label="설문 진행 항목"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            {PROGRAM_REGISTRATION_SURVEY_ITEM_IDS.map(id => (
              <CmsCheckbox
                key={id}
                checkboxSize="medium"
                checked={surveyItems[id]}
                onChange={toggleSurveyItem(id)}
              >
                {PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS[id]}
              </CmsCheckbox>
            ))}
          </div>
        }
        view="-"
      />
    )
  }
)

export const ProgramRegistrationBasicInfoEducationCourseField = memo(
  function ProgramRegistrationBasicInfoEducationCourseField({
    overlayPrefix,
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    const [educationCourseRaw, setEducationCourse] = useProgramRegistrationOverlayKv(
      `${overlayPrefix}.educationCourse`,
      trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_ALL_VALUE : ''
    )
    const educationCourse = trainedTeachersDefaults
      ? normalizeTrainedTeachersAllSelectValue(educationCourseRaw)
      : educationCourseRaw

    return (
      <DetailInfoForm.Field
        label="교육 과정"
        validationKey="basicInfo.educationCourse"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <CmsSelect
              inputSize="small"
              placeholder="선택하세요"
              withAllOption={false}
              width={240}
              options={[...PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS]}
              value={trainedTeachersDefaults ? educationCourse : educationCourse || undefined}
              onChange={v => setEducationCourse(String(v ?? ''))}
            />
          </div>
        }
        view="-"
      />
    )
  }
)

export const ProgramRegistrationBasicInfoIpOwnedField = memo(
  function ProgramRegistrationBasicInfoIpOwnedField({
    overlayPrefix,
  }: OverlayPrefixProps) {
    return (
      <ProgramRegistrationOverlaySelectField
        label="IP Owned"
        validationKey="basicInfo.ipOwned"
        overlayKey={`${overlayPrefix}.ipOwned`}
        placeholder="선택하세요"
        options={[...PROGRAM_REGISTRATION_IP_OWNED_OPTIONS]}
        defaultValue=""
      />
    )
  }
)

export const ProgramRegistrationBasicInfoCourseDeliveredByField = memo(
  function ProgramRegistrationBasicInfoCourseDeliveredByField({
    overlayPrefix,
  }: OverlayPrefixProps) {
    return (
      <ProgramRegistrationOverlaySelectField
        label="Course Delivered By"
        validationKey="basicInfo.courseDeliveredBy"
        overlayKey={`${overlayPrefix}.courseDeliveredBy`}
        placeholder="선택하세요"
        options={[...PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS]}
        defaultValue=""
      />
    )
  }
)

export const ProgramRegistrationBasicInfoPartnerInvolvementField = memo(
  function ProgramRegistrationBasicInfoPartnerInvolvementField({
    overlayPrefix,
  }: OverlayPrefixProps) {
    const [partnerInvolvement, setPartnerInvolvement] = useProgramRegistrationOverlayKv<
      'yes' | 'no' | ''
    >(`${overlayPrefix}.partnerInvolvement`, '')

    return (
      <DetailInfoForm.Field
        label="Partner Involvement"
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <CmsRadioGroup
              size="medium"
              // 미선택('')·키 없음은 저장 빌더와 동일하게 Yes(true)로 표시 — 'no'만 No
              value={partnerInvolvement === 'no' ? 'no' : 'yes'}
              onChange={e => setPartnerInvolvement(e.target.value as 'yes' | 'no')}
            >
              <CmsRadio size="medium" value="yes">Yes</CmsRadio>
              <CmsRadio size="medium" value="no">No</CmsRadio>
            </CmsRadioGroup>
          </div>
        }
        view="-"
      />
    )
  }
)

export const ProgramRegistrationBasicInfoFooterIpsTypeField = memo(
  function ProgramRegistrationBasicInfoFooterIpsTypeField({ overlayPrefix }: OverlayPrefixProps) {
    const [footerIpsType, setFooterIpsType] = useProgramRegistrationOverlayKv<
      ProgramRegistrationIpsTypeValue
    >(`${overlayPrefix}.footerIpsType`, { category: '', detail: '' })

    return (
      <DetailInfoForm.Field
        label="IPS 유형"
        fullRow
        edit={<ProgramRegistrationIpsTypeFields value={footerIpsType} onChange={setFooterIpsType} />}
        view="-"
      />
    )
  }
)

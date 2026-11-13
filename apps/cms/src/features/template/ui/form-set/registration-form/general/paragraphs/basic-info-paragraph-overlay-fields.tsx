import { memo, useMemo, type ReactNode } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { GeneralParticipantAudienceCheckboxGroup } from '@/features/program/general/ui/participant-audience-checkbox-group'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_IPS_FIELD_LABELS,
} from '@/features/template/lib/template-form-select-options'
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
import { ProgramRegistrationOverlaySelectField } from '@/features/template/ui/form-set/registration-form/shared/registration-overlay-fields'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  normalizeTrainedTeachersAllSelectValue,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

type OperationRangeSeal = { start: string; end: string } | null

/**
 * 교육받은 교사 템플릿 관리 등록 폼(시안 5767:196354) IP Owned·Course Delivered By 초기값 「JA」.
 * 신규 등록 RHF 시작값(`createNewTrainedTeachersRegistrationRhfValues`)과 같다. 템플릿 관리에는 RHF가 없어
 * overlay 키가 비어 있을 때만 쓴다. 일반 프로그램·프로그램 화면은 기존대로 미선택.
 */
const TRAINED_TEACHERS_TEMPLATE_IPS_OWNER_DEFAULT = 'ja'

function useTrainedTeachersTemplateSelectDefault(trainedTeachersDefaults: boolean): string {
  const isTemplateManagement = useIsTemplateManagementScreen()
  return trainedTeachersDefaults && isTemplateManagement
    ? TRAINED_TEACHERS_TEMPLATE_IPS_OWNER_DEFAULT
    : ''
}

/** 일반 프로그램 템플릿 관리 등록 폼 시안(12931:3800 · 12829:411618) 셀렉트 폭 — 교육 과정·IP Owned·Course Delivered By */
const GENERAL_TEMPLATE_IPS_OWNER_SELECT_WIDTH = 140
/** 같은 시안 「사업 분야」 셀렉트 폭 */
const GENERAL_TEMPLATE_BUSINESS_FIELD_SELECT_WIDTH = 200
/** 등록 위저드·상세 수정 기존 폭 */
const DEFAULT_BASIC_INFO_SELECT_WIDTH = 240

/** 교육받은 교사 템플릿 관리 등록 폼 시안(5767:196354) — 교육 과정·IP Owned·Course Delivered By ≈200 (사업 분야는 240 그대로) */
const TRAINED_TEACHERS_TEMPLATE_IPS_OWNER_SELECT_WIDTH = 200

/** 템플릿 관리 화면에서만 시안 폭을 쓴다. 등록·상세는 기존 폭 */
function useGeneralTemplateSelectWidth(
  trainedTeachersDefaults: boolean,
  templateWidth: number
): number {
  const isTemplateManagement = useIsTemplateManagementScreen()
  if (!isTemplateManagement) return DEFAULT_BASIC_INFO_SELECT_WIDTH
  if (!trainedTeachersDefaults) return templateWidth
  return templateWidth === GENERAL_TEMPLATE_IPS_OWNER_SELECT_WIDTH
    ? TRAINED_TEACHERS_TEMPLATE_IPS_OWNER_SELECT_WIDTH
    : DEFAULT_BASIC_INFO_SELECT_WIDTH
}

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

/** 일반 프로그램 셀렉트(교육 과정·IP Owned·Course Delivered By) 플레이스홀더 — 시안 「전체」. 교육받은 교사는 기존 문구 */
function basicInfoSelectPlaceholder(trainedTeachersDefaults: boolean): string {
  return trainedTeachersDefaults ? '선택해 주세요' : '전체'
}

export const ProgramRegistrationBasicInfoOperationRangeField = memo(
  function ProgramRegistrationBasicInfoOperationRangeField({
    overlayPrefix,
  }: Pick<OverlayPrefixProps, 'overlayPrefix'>) {
    const [operationAnchorIso, setOperationAnchorIso] = useProgramRegistrationOverlayKv<
      string | null
    >(`${overlayPrefix}.operationAnchorIso`, null)
    const [operationRangeSeal, setOperationRangeSeal] =
      useProgramRegistrationOverlayKv<OperationRangeSeal>(
        `${overlayPrefix}.operationRangeSeal`,
        null
      )

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
    return (
      <DetailInfoForm.Field
        label="사업 운영 기간"
        validationKey="basicInfo.operationRangeSeal"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="period"
              value={operationAnchorDate}
              width="100%"
              placeholder="사업 운영 기간을 선택해 주세요"
              preferPeriodModeInPopover
              suppressAutoTodayWhenEmpty
              excludeBusinessPeriodConstraint
              showTimeToggle={false}
              appliedSurfaceRange={operationRange}
              appliedSurfaceWithTime={false}
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
                // 시안: 개인·학교/기관은 상호 배타 — 한쪽 선택 시 다른 쪽 비활성(해제 후 전환)
                individualDisabled={lockParticipantTypes || participant.organization}
                organizationDisabled={lockParticipantTypes || participant.individual}
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
    trainedTeachersDefaults = false,
  }: Pick<OverlayPrefixProps, 'overlayPrefix'> & Partial<OverlayPrefixProps>) {
    const width = useGeneralTemplateSelectWidth(
      trainedTeachersDefaults,
      GENERAL_TEMPLATE_BUSINESS_FIELD_SELECT_WIDTH
    )
    return (
      <ProgramRegistrationOverlaySelectField
        label="사업 분야"
        width={width}
        validationKey="basicInfo.businessField"
        overlayKey={`${overlayPrefix}.businessField`}
        placeholder="사업 분야를 선택해 주세요"
        options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
        // 교육받은 교사 시안(9899:221372): 사업 분야 미선택(placeholder)
        defaultValue=""
      />
    )
  }
)

export const ProgramRegistrationBasicInfoEducationVenueFields = memo(
  function ProgramRegistrationBasicInfoEducationVenueFields({
    overlayPrefix,
  }: Pick<OverlayPrefixProps, 'overlayPrefix'>) {
    const educationVenueDetailKey = `${overlayPrefix}.educationVenueDetail`
    // 시안: 기본 미선택 — 등록 시 필수 선택(`basicInfo.educationVenueKind`)
    const [educationVenueKind, setEducationVenueKind] = useProgramRegistrationOverlayKv<
      'inside' | 'outside' | 'other' | ''
    >(`${overlayPrefix}.educationVenueKind`, '')

    return (
      <DetailInfoForm.Field
        label="교육 장소"
        validationKey={['basicInfo.educationVenueKind', 'basicInfo.educationVenueDetail']}
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
              <CmsRadio size="medium" value="inside">
                기관 안
              </CmsRadio>
              <CmsRadio size="medium" value="outside">
                기관 밖
              </CmsRadio>
              <CmsRadio size="medium" value="other">
                기타(직접입력)
              </CmsRadio>
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
    const selectWidth = useGeneralTemplateSelectWidth(
      trainedTeachersDefaults,
      GENERAL_TEMPLATE_IPS_OWNER_SELECT_WIDTH
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
              placeholder={basicInfoSelectPlaceholder(trainedTeachersDefaults)}
              withAllOption={false}
              width={selectWidth}
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
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    const defaultValue = useTrainedTeachersTemplateSelectDefault(trainedTeachersDefaults)
    const selectWidth = useGeneralTemplateSelectWidth(
      trainedTeachersDefaults,
      GENERAL_TEMPLATE_IPS_OWNER_SELECT_WIDTH
    )
    return (
      <ProgramRegistrationOverlaySelectField
        width={selectWidth}
        label={TEMPLATE_FORM_IPS_FIELD_LABELS.ipOwned}
        validationKey="basicInfo.ipOwned"
        overlayKey={`${overlayPrefix}.ipOwned`}
        placeholder={basicInfoSelectPlaceholder(trainedTeachersDefaults)}
        options={[...PROGRAM_REGISTRATION_IP_OWNED_OPTIONS]}
        defaultValue={defaultValue}
      />
    )
  }
)

export const ProgramRegistrationBasicInfoCourseDeliveredByField = memo(
  function ProgramRegistrationBasicInfoCourseDeliveredByField({
    overlayPrefix,
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    const defaultValue = useTrainedTeachersTemplateSelectDefault(trainedTeachersDefaults)
    const selectWidth = useGeneralTemplateSelectWidth(
      trainedTeachersDefaults,
      GENERAL_TEMPLATE_IPS_OWNER_SELECT_WIDTH
    )
    return (
      <ProgramRegistrationOverlaySelectField
        width={selectWidth}
        label={TEMPLATE_FORM_IPS_FIELD_LABELS.courseDeliveredBy}
        validationKey="basicInfo.courseDeliveredBy"
        overlayKey={`${overlayPrefix}.courseDeliveredBy`}
        placeholder={basicInfoSelectPlaceholder(trainedTeachersDefaults)}
        options={[...PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS]}
        defaultValue={defaultValue}
      />
    )
  }
)

export const ProgramRegistrationBasicInfoPartnerInvolvementField = memo(
  function ProgramRegistrationBasicInfoPartnerInvolvementField({
    overlayPrefix,
    trainedTeachersDefaults,
  }: OverlayPrefixProps) {
    const [partnerInvolvement, setPartnerInvolvement] = useProgramRegistrationOverlayKv<
      'yes' | 'no' | ''
    >(`${overlayPrefix}.partnerInvolvement`, '')
    const isTemplateManagement = useIsTemplateManagementScreen()

    // 일반: 시안대로 미선택('')은 미선택 표시 — 등록 시 필수 선택(`basicInfo.partnerInvolvement`).
    // 교육받은 교사: 미선택('')·키 없음은 저장 빌더(`partnerInvolvementFromOverlay`)와 동일하게 No — 'yes'만 Yes.
    // 단, 템플릿 관리 화면은 라디오를 모두 미선택으로 시작한다(사용자 결정 2026-11-13) — 고른 값만 보인다.
    const radioValue =
      trainedTeachersDefaults && !isTemplateManagement
        ? partnerInvolvement === 'yes'
          ? 'yes'
          : 'no'
        : partnerInvolvement === 'yes' || partnerInvolvement === 'no'
          ? partnerInvolvement
          : ''

    return (
      <DetailInfoForm.Field
        label={TEMPLATE_FORM_IPS_FIELD_LABELS.partnerInvolvement}
        validationKey={trainedTeachersDefaults ? undefined : 'basicInfo.partnerInvolvement'}
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <CmsRadioGroup
              size="medium"
              value={radioValue}
              onChange={e => setPartnerInvolvement(e.target.value as 'yes' | 'no')}
            >
              <CmsRadio size="medium" value="yes">
                Yes
              </CmsRadio>
              <CmsRadio size="medium" value="no">
                No
              </CmsRadio>
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
    const [footerIpsType, setFooterIpsType] =
      useProgramRegistrationOverlayKv<ProgramRegistrationIpsTypeValue>(
        `${overlayPrefix}.footerIpsType`,
        { category: '', detail: '' }
      )

    return (
      <DetailInfoForm.Field
        label="IPS 유형"
        fullRow
        edit={
          <ProgramRegistrationIpsTypeFields value={footerIpsType} onChange={setFooterIpsType} />
        }
        view="-"
      />
    )
  }
)

import { useMemo, type ReactNode } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { GeneralParticipantAudienceCheckboxGroup } from '@/features/program/general/ui/participant-audience-checkbox-group'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
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
import { ProgramRegistrationBasicInfoSponsorFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph-sponsor-fields'
import { ProgramRegistrationBasicInfoTitleFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph-title-fields'
import '@/features/template/ui/form-editor/form-editor.css'
import './program-registration-paragraph.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

type OperationRangeSeal = { start: string; end: string } | null

function participantTypeLabel(
  value: (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value']
) {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value
}

type ProgramRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
  /** true면 교육 장소 행 미노출 (교육받은 교사 등록 폼) */
  hideEducationPlace?: boolean
  /** true면 하단 테이블에 IPS 유형 행 추가 (교육받은 교사 등록 폼) */
  includeFooterIpsType?: boolean
  /** 참여자 유형 편집 슬롯 — 지정 시 기본 체크박스 그룹 대신 렌더 (교육받은 교사 잠금 UI) */
  participantTypesEdit?: ReactNode
  /** controlled — 부모(editor)에서 등록 완료 스냅샷으로 전달 */
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
  /** controlled — 부모(editor)에서 등록 완료 스냅샷으로 전달 */
  programTitleKo?: string
  onProgramTitleKoChange?: (title: string) => void
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
  programTitleKo: programTitleKoProp,
  onProgramTitleKoChange,
}: ProgramRegistrationBasicInfoParagraphProps) {
  const [businessField, setBusinessField] = useProgramRegistrationOverlayKv(
    'generalRegistration.basicInfo.businessField',
    ''
  )
  const [partnerInvolvement, setPartnerInvolvement] = useProgramRegistrationOverlayKv<
    'yes' | 'no'
  >('generalRegistration.basicInfo.partnerInvolvement', 'yes')
  
  const [operationAnchorIso, setOperationAnchorIso] = useProgramRegistrationOverlayKv<
    string | null
  >('generalRegistration.basicInfo.operationAnchorIso', dayjs().startOf('day').toISOString())
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const setOperationAnchorDate = (next: Dayjs | null) => {
    setOperationAnchorIso(next == null ? null : next.toISOString())
  }

  const [operationRangeSeal, setOperationRangeSeal] = useProgramRegistrationOverlayKv<
    OperationRangeSeal
  >('generalRegistration.basicInfo.operationRangeSeal', null)
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

  const [educationVenueKind, setEducationVenueKind] = useProgramRegistrationOverlayKv<
    'inside' | 'outside' | 'other'
  >('generalRegistration.basicInfo.educationVenueKind', 'inside')
  const [educationVenueDetail, setEducationVenueDetail] = useProgramRegistrationOverlayKv(
    'generalRegistration.basicInfo.educationVenueDetail',
    ''
  )
  const [educationCourse, setEducationCourse] = useProgramRegistrationOverlayKv(
    'generalRegistration.basicInfo.educationCourse',
    ''
  )
  const [ipOwned, setIpOwned] = useProgramRegistrationOverlayKv(
    'generalRegistration.basicInfo.ipOwned',
    ''
  )
  const [courseDeliveredBy, setCourseDeliveredBy] = useProgramRegistrationOverlayKv(
    'generalRegistration.basicInfo.courseDeliveredBy',
    ''
  )
  const [footerIpsType, setFooterIpsType] = useProgramRegistrationOverlayKv<
    ProgramRegistrationIpsTypeValue
  >('generalRegistration.basicInfo.footerIpsType', {
    category: '',
    detail: '',
  })
  const [surveyItems] = useProgramRegistrationOverlayKv<
    Record<ProgramRegistrationSurveyItemId, boolean>
  >('generalRegistration.basicInfo.surveyItems', initialProgramRegistrationSurveyItems())

  const toggleSurveyItem = (id: ProgramRegistrationSurveyItemId) => (e: CheckboxChangeEvent) => {
    updateProgramRegistrationOverlayKey<Record<ProgramRegistrationSurveyItemId, boolean>>(
      'generalRegistration.basicInfo.surveyItems',
      prev => ({ ...(prev ?? initialProgramRegistrationSurveyItems()), [id]: e.target.checked })
    )
  }

  return (
    <>
      <DetailInfoForm
        title="기본 정보*"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <ProgramRegistrationBasicInfoTitleFields
          programTitleKo={programTitleKoProp}
          onProgramTitleKoChange={onProgramTitleKoChange}
        />
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="사업 운영 기간"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={operationAnchorDate}
                  width="100%"
                  placeholder="사업 운영 기간을 선택하세요"
                  preferPeriodModeInPopover
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
          <DetailInfoForm.Field
            label="참여자 유형"
            edit={
              participantTypesEdit ?? (
                <div className="detail-info-form-inputs-wrapper">
                  <GeneralParticipantAudienceCheckboxGroup
                    individual={participant.individual}
                    organization={participant.organization}
                    onIndividualChange={onIndividualChange}
                    onOrganizationChange={onOrganizationChange}
                  />
                  <CmsCheckbox
                    checkboxSize="large"
                    checked={participant.teacherInstructor === true}
                    onChange={e => onTeacherInstructorChange(e.target.checked)}
                  >
                    {participantTypeLabel('teacher_instructor')}
                  </CmsCheckbox>
                  <CmsCheckbox
                    checkboxSize="large"
                    checked={participant.volunteer === true}
                    onChange={e => onVolunteerChange(e.target.checked)}
                  >
                    {participantTypeLabel('volunteer')}
                  </CmsCheckbox>
                </div>
              )
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="사업 분야"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsSelect
                  inputSize="medium"
                  placeholder="사업 분야를 선택하세요"
                  width={240}
                  options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                  value={businessField || undefined}
                  onChange={v => setBusinessField(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <ProgramRegistrationBasicInfoSponsorFields
          sponsorId={sponsorIdProp}
          onSponsorIdChange={onSponsorIdChange}
          sponsorContactId={sponsorContactIdProp}
          onSponsorContactIdChange={onSponsorContactIdChange}
        />
        {hideEducationPlace ? null : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 장소"
              fullRow
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <CmsRadioGroup
                    size="large"
                    value={educationVenueKind}
                    onChange={e =>
                      setEducationVenueKind(e.target.value as 'inside' | 'outside' | 'other')
                    }
                  >
                    <CmsRadio value="inside">기관 안</CmsRadio>
                    <CmsRadio value="outside">기관 밖</CmsRadio>
                    <CmsRadio value="other">기타(직접입력)</CmsRadio>
                  </CmsRadioGroup>
                  <DetailInfoForm.InputsSeparator />
                  <CmsInput
                    inputSize="medium"
                    placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                    width="100%"
                    style={{ flex: '1 1 0', minWidth: 0 }}
                    value={educationVenueDetail}
                    onChange={e => setEducationVenueDetail(e.target.value)}
                  />
                </div>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )}
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                {PROGRAM_REGISTRATION_SURVEY_ITEM_IDS.map(id => (
                  <CmsCheckbox
                    key={id}
                    checkboxSize="large"
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
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="" hideHeader mode="edit" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  inputSize="medium"
                  placeholder="전체"
                  withAllOption={false}
                  width={240}
                  options={[...PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS]}
                  value={educationCourse || undefined}
                  onChange={v => setEducationCourse(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="IP Owned"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  inputSize="medium"
                  placeholder="전체"
                  withAllOption={false}
                  width={240}
                  options={[...PROGRAM_REGISTRATION_IP_OWNED_OPTIONS]}
                  value={ipOwned || undefined}
                  onChange={v => setIpOwned(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  inputSize="medium"
                  placeholder="전체"
                  withAllOption={false}
                  width={240}
                  options={[...PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS]}
                  value={courseDeliveredBy || undefined}
                  onChange={v => setCourseDeliveredBy(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsRadioGroup
                  size="large"
                  value={partnerInvolvement}
                  onChange={e => setPartnerInvolvement(e.target.value as 'yes' | 'no')}
                >
                  <CmsRadio value="yes">Yes</CmsRadio>
                  <CmsRadio value="no">No</CmsRadio>
                </CmsRadioGroup>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        {includeFooterIpsType ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="IPS 유형"
              fullRow
              edit={
                <ProgramRegistrationIpsTypeFields
                  value={footerIpsType}
                  onChange={setFooterIpsType}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : null}
      </DetailInfoForm>
    </>
  )
}

/**
 * 1사 1교 프로그램 등록 폼 — 기본 정보
 * (상단: 일반 프로그램 정보 / 하단: 교육 과정·IP·Partner·IPS — 스크린 구성 기준)
 */
import { useMemo, useState } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/paragraph/shared/writing-form-period-date-picker-field'
import { getSponsorDetailContactsNormalized } from '@/features/sponsor/lib/get-sponsor-detail-contacts'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import { type ProgramRegistrationIpsTypeValue } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '../../general/paragraphs/program-registration-ips-options'

const REP_KO = '1사1교 경제금융교육'
const REP_EN = '1 Company 1 School Economics and Finance Education'

const PROGRAM_PROGRESS_STATIC_VIEW = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const ALL_VALUE = '__all__'

const DETAILED_PROGRAM_MAIN_VALUE = '__economy_1c1s_main__'
const DETAILED_PROGRAM_MAIN_OPTION = {
  value: DETAILED_PROGRAM_MAIN_VALUE,
  label: '1사1교 경제금융교육',
} as const

const BUSINESS_FIELD_FIXED_VALUE = 'economy_finance'

const IPS_PREPARE_FIXED: ProgramRegistrationIpsTypeValue = {
  category: 'prepare',
  detail: 'none',
}

type OrganizationSurveyItemId =
  | 'survey'
  | 'student_satisfaction'
  | 'teacher_satisfaction'
  | 'lecture_evaluation'

function initialOrganizationSurveyItemsAllOn(): Record<OrganizationSurveyItemId, boolean> {
  return {
    survey: true,
    student_satisfaction: true,
    teacher_satisfaction: true,
    lecture_evaluation: true,
  }
}

function participantTypeLabel(
  value: (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value']
) {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value
}

const educationCourseSelectOptions = [
  { value: ALL_VALUE, label: '전체' },
  ...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
]

export type OneCOneSRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
}

export function OneCOneSRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange,
  onOrganizationChange,
}: OneCOneSRegistrationBasicInfoParagraphProps) {
  const [partnerInvolvement, setPartnerInvolvement] = useState<'yes' | 'no'>('no')
  const [teacherChecked, setTeacherChecked] = useState(true)
  const [volunteerChecked, setVolunteerChecked] = useState(false)
  const [educationCourse, setEducationCourse] = useState(ALL_VALUE)
  const [operationAnchorDate, setOperationAnchorDate] = useState<Dayjs | null>(dayjs())
  const [operationRange, setOperationRange] = useState<[Dayjs, Dayjs] | null>(null)
  const operationRangeWithTime = useMemo(
    () =>
      operationRange == null ? false : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
    [operationRange]
  )

  const [sponsorId, setSponsorId] = useState<string>(ALL_VALUE)
  const [managerContactId, setManagerContactId] = useState<string>(ALL_VALUE)
  const [detailedProgramId, setDetailedProgramId] = useState<string>(DETAILED_PROGRAM_MAIN_VALUE)

  const [organizationSurveyItems, setOrganizationSurveyItems] = useState<
    Record<OrganizationSurveyItemId, boolean>
  >(initialOrganizationSurveyItemsAllOn)

  const toggleOrganizationSurveyItem =
    (id: OrganizationSurveyItemId) => (e: CheckboxChangeEvent) => {
      setOrganizationSurveyItems(prev => ({ ...prev, [id]: e.target.checked }))
    }

  const sponsorOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: '전체' },
      ...mockSponsorManagementListRows.map(s => ({ value: s.id, label: s.name })),
    ],
    []
  )

  const selectedSponsor = useMemo<SponsorManagementRow | null>(
    () =>
      sponsorId === ALL_VALUE
        ? null
        : (mockSponsorManagementListRows.find(s => s.id === sponsorId) ?? null),
    [sponsorId]
  )

  const managerOptions = useMemo(() => {
    if (sponsorId === ALL_VALUE) {
      return [{ value: ALL_VALUE, label: '전체' }]
    }
    if (!selectedSponsor) return []
    return getSponsorDetailContactsNormalized(selectedSponsor).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [selectedSponsor, sponsorId])

  const detailedProgramOptions = useMemo(
    () => [
      DETAILED_PROGRAM_MAIN_OPTION,
      ...withDetailedProgramNoneOption(
        mockDetailedProgramManagementListRows.map(row => ({
          value: row.id,
          label: row.name,
        }))
      ),
    ],
    []
  )

  return (
    <>
      <DetailInfoForm
        title="기본 정보"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        {/* ── 상단: 일반 프로그램 정보 ── */}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대표 프로그램명 (국문)"
            edit={
              <CmsInput
                inputSize="medium"
                disabled
                value={REP_KO}
                placeholder="대표 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="대표 프로그램명 (영문)"
            edit={
              <CmsInput
                inputSize="medium"
                disabled
                value={REP_EN}
                placeholder="대표 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            edit={
              <CmsInput
                inputSize="medium"
                placeholder="모집 시 노출될 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  disabled
                  inputSize="medium"
                  placeholder="세부 프로그램명을 선택하세요"
                  width="100%"
                  options={detailedProgramOptions}
                  value={detailedProgramId}
                  onChange={v => setDetailedProgramId(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
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
                {PROGRAM_PROGRESS_STATIC_VIEW}
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 유형"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.individual}
                  disabled={participant.organization}
                  onChange={e => onIndividualChange(e.target.checked)}
                >
                  {participantTypeLabel('individual')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.organization}
                  disabled={participant.individual}
                  onChange={e => onOrganizationChange(e.target.checked)}
                >
                  {participantTypeLabel('school_institution')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={teacherChecked}
                  onChange={e => setTeacherChecked(e.target.checked)}
                >
                  {participantTypeLabel('teacher_instructor')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={volunteerChecked}
                  disabled
                  onChange={e => setVolunteerChecked(e.target.checked)}
                >
                  {participantTypeLabel('volunteer')}
                </CmsCheckbox>
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="사업 분야"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="medium"
                  disabled
                  width={240}
                  options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                  value={BUSINESS_FIELD_FIXED_VALUE}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="medium"
                  placeholder="후원사를 선택하세요"
                  width={240}
                  options={sponsorOptions}
                  value={sponsorId}
                  onChange={v => {
                    const next = String(v ?? '')
                    setSponsorId(next)
                    setManagerContactId(next === ALL_VALUE ? ALL_VALUE : '')
                  }}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="medium"
                  placeholder="후원사 담당자를 선택하세요"
                  width={240}
                  options={managerOptions}
                  value={managerContactId}
                  disabled={sponsorId !== ALL_VALUE && managerOptions.length === 0}
                  onChange={v => setManagerContactId(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationSurveyItems.survey}
                  onChange={toggleOrganizationSurveyItem('survey')}
                >
                  설문조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationSurveyItems.student_satisfaction}
                  onChange={toggleOrganizationSurveyItem('student_satisfaction')}
                >
                  학생 만족도조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationSurveyItems.teacher_satisfaction}
                  onChange={toggleOrganizationSurveyItem('teacher_satisfaction')}
                >
                  교사 만족도조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationSurveyItems.lecture_evaluation}
                  onChange={toggleOrganizationSurveyItem('lecture_evaluation')}
                >
                  강의평가
                </CmsCheckbox>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* ── 하단: 교육 과정 · IP · Course · Partner · IPS ── */}
      <DetailInfoForm title="교육 과정 · IP · Course · Partner · IPS" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="medium"
                  placeholder="교육 과정을 선택하세요"
                  width={240}
                  options={educationCourseSelectOptions}
                  value={educationCourse}
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
                  withAllOption={false}
                  inputSize="medium"
                  disabled
                  width={240}
                  options={[...TEMPLATE_FORM_IP_OWNED_OPTIONS]}
                  value="ja"
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
                  withAllOption={false}
                  inputSize="medium"
                  disabled
                  width={240}
                  options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
                  value="ja"
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            edit={
              <CmsRadioGroup
                size="large"
                value={partnerInvolvement}
                onChange={e => setPartnerInvolvement(e.target.value as 'yes' | 'no')}
              >
                <CmsRadio value="yes">Yes</CmsRadio>
                <CmsRadio value="no">No</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="IPS 유형"
            fullRow
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="medium"
                placeholder="IPS 유형을 선택하세요"
                width={240}
                options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
                value={IPS_PREPARE_FIXED.category}
                onChange={() => {}}
                disabled
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}

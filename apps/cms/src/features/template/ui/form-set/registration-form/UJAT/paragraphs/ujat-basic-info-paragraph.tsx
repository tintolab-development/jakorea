/**
 * UJAT 프로그램 등록 폼 — 기본 정보
 * (1사 1교 프로그램 등록 폼 기본 정보와 동일하게 DetailInfoForm 3구역: 프로그램명 / 운영·설문 / 교육·IPS)
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
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/paragraph/shared/writing-form-period-date-picker-field'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const UJAT_REP_KO_DEFAULT = '대학생경제교육봉사단'
const UJAT_REP_EN_DEFAULT = 'University Students JA Team'
const UJAT_PROGRAM_MANAGEMENT_DEFAULT =
  'JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집'

const PROGRAM_PROGRESS_STATIC_VIEW = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const ALL_VALUE = '__all__'

const DETAILED_PROGRAM_UJAT_VALUE = '__ujat_volunteer_core__'
const DETAILED_PROGRAM_UJAT_OPTION = {
  value: DETAILED_PROGRAM_UJAT_VALUE,
  label: '대학생경제교육봉사단',
} as const

type UjatSurveyRowId =
  | 'survey'
  | 'volunteer_satisfaction'
  | 'school_satisfaction'
  | 'lecture_evaluation'

function initialUjatSurveyItems(): Record<UjatSurveyRowId, boolean> {
  return {
    survey: true,
    volunteer_satisfaction: true,
    school_satisfaction: true,
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

const BLOCK_GAP_STYLE = { marginTop: 16 } as const

export function UjatBasicInfoParagraph() {
  const repKo = UJAT_REP_KO_DEFAULT
  const repEn = UJAT_REP_EN_DEFAULT
  const programManagementName = UJAT_PROGRAM_MANAGEMENT_DEFAULT
  const detailedProgramId = DETAILED_PROGRAM_UJAT_VALUE

  const [operationAnchorDate, setOperationAnchorDate] = useState<Dayjs | null>(dayjs())
  const [operationRange, setOperationRange] = useState<[Dayjs, Dayjs] | null>(null)
  const operationRangeWithTime = useMemo(
    () =>
      operationRange == null ? false : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
    [operationRange]
  )

  const [individualChecked, setIndividualChecked] = useState(false)
  const [organizationChecked, setOrganizationChecked] = useState(true)
  const [teacherChecked, setTeacherChecked] = useState(false)
  const [volunteerChecked, setVolunteerChecked] = useState(true)

  const businessField = 'economy_finance'

  const sponsorId = useMemo(
    () => mockSponsorManagementListRows.find(s => s.name === '제이에이코리아')?.id ?? ALL_VALUE,
    []
  )

  const [surveyItems, setSurveyItems] =
    useState<Record<UjatSurveyRowId, boolean>>(initialUjatSurveyItems)

  const [educationCourse, setEducationCourse] = useState(ALL_VALUE)
  const [partnerInvolvement, setPartnerInvolvement] = useState<'yes' | 'no'>('no')

  const sponsorOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: '전체' },
      ...mockSponsorManagementListRows.map(s => ({ value: s.id, label: s.name })),
    ],
    []
  )

  const managerOptions: Array<{ value: string; label: string }> = []

  const detailedProgramOptions = useMemo(
    () => [
      DETAILED_PROGRAM_UJAT_OPTION,
      ...withDetailedProgramNoneOption(
        mockDetailedProgramManagementListRows.map(row => ({
          value: row.id,
          label: row.name,
        }))
      ),
    ],
    []
  )

  const toggleSurveyItem = (id: UjatSurveyRowId) => (e: CheckboxChangeEvent) => {
    setSurveyItems(prev => ({ ...prev, [id]: e.target.checked }))
  }

  return (
    <>
      {/* ── 대표 프로그램명 ~ 세부 프로그램명 ── */}
      <DetailInfoForm
        title="UJAT 기본 정보 — 프로그램명"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대표 프로그램명 (국문)"
            edit={
              <CmsInput
                inputSize="medium"
                disabled
                value={repKo}
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
                value={repEn}
                placeholder="대표 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 관리명"
            edit={
              <CmsInput
                inputSize="medium"
                disabled
                value={programManagementName}
                placeholder="프로그램 관리명을 입력하세요"
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
                  inputSize="medium"
                  disabled
                  placeholder="세부 프로그램명을 선택하세요"
                  width="100%"
                  options={detailedProgramOptions}
                  value={detailedProgramId}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* ── 사업 운영 기간 ~ 설문 진행 항목 ── */}
      <DetailInfoForm
        title="UJAT 기본 정보 — 운영 및 설문"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
        style={BLOCK_GAP_STYLE}
      >
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
                  checked={individualChecked}
                  onChange={e => setIndividualChecked(e.target.checked)}
                >
                  {participantTypeLabel('individual')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationChecked}
                  onChange={e => setOrganizationChecked(e.target.checked)}
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
                  placeholder="사업 분야를 선택하세요"
                  width={240}
                  options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                  value={businessField}
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
                  disabled
                  placeholder="후원사를 선택하세요"
                  width={240}
                  options={sponsorOptions}
                  value={sponsorId}
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
                  checked={surveyItems.survey}
                  onChange={toggleSurveyItem('survey')}
                >
                  설문조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={surveyItems.volunteer_satisfaction}
                  onChange={toggleSurveyItem('volunteer_satisfaction')}
                >
                  봉사단 만족도조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={surveyItems.school_satisfaction}
                  onChange={toggleSurveyItem('school_satisfaction')}
                >
                  학교 만족도조사
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={surveyItems.lecture_evaluation}
                  onChange={toggleSurveyItem('lecture_evaluation')}
                >
                  강의평가
                </CmsCheckbox>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* ── 교육 과정 ~ IPS 유형 ── */}
      <DetailInfoForm
        title="UJAT 기본 정보 — 교육 과정 및 IPS"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
        style={BLOCK_GAP_STYLE}
      >
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
                disabled
                width={240}
                options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
                value="prepare"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}

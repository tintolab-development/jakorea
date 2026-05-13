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
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { getSponsorDetailContactsNormalized } from '@/features/sponsor/lib/get-sponsor-detail-contacts'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import '@/features/template/ui/form-editor/form-editor.css'
import './program-registration-paragraph.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

type OrganizationSurveyItemId =
  | 'survey'
  | 'student_satisfaction'
  | 'teacher_satisfaction'
  | 'lecture_evaluation'

type IndividualSurveyItemId = 'survey' | 'satisfaction' | 'lecture_evaluation'

function initialOrganizationSurveyItems(): Record<OrganizationSurveyItemId, boolean> {
  return {
    survey: false,
    student_satisfaction: false,
    teacher_satisfaction: false,
    lecture_evaluation: false,
  }
}

function initialIndividualSurveyItems(): Record<IndividualSurveyItemId, boolean> {
  return {
    survey: false,
    satisfaction: false,
    lecture_evaluation: false,
  }
}

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
}

export function ProgramRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange,
  onOrganizationChange,
  onTeacherInstructorChange,
  onVolunteerChange,
}: ProgramRegistrationBasicInfoParagraphProps) {
  const [businessField, setBusinessField] = useState('')
  const [partnerInvolvement, setPartnerInvolvement] = useState<'yes' | 'no'>('yes')
  const [operationAnchorDate, setOperationAnchorDate] = useState<Dayjs | null>(dayjs())
  const [operationRange, setOperationRange] = useState<[Dayjs, Dayjs] | null>(null)
  const operationRangeWithTime = useMemo(
    () =>
      operationRange == null ? false : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
    [operationRange]
  )

  const [sponsorId, setSponsorId] = useState<string>('')
  /** 후원사 상세 담당자 행 `SponsorContactRow.id` (목 데이터; 추후 API 값으로 교체) */
  const [managerContactId, setManagerContactId] = useState<string>('')
  const [detailedProgramId, setDetailedProgramId] = useState<string>('')
  const [educationCourse, setEducationCourse] = useState('')
  const [ipOwned, setIpOwned] = useState('')
  const [courseDeliveredBy, setCourseDeliveredBy] = useState('')
  const [organizationSurveyItems, setOrganizationSurveyItems] = useState<
    Record<OrganizationSurveyItemId, boolean>
  >(initialOrganizationSurveyItems)
  const [individualSurveyItems, setIndividualSurveyItems] = useState<
    Record<IndividualSurveyItemId, boolean>
  >(initialIndividualSurveyItems)

  const toggleOrganizationSurveyItem =
    (id: OrganizationSurveyItemId) => (e: CheckboxChangeEvent) => {
      setOrganizationSurveyItems(prev => ({ ...prev, [id]: e.target.checked }))
    }

  const toggleIndividualSurveyItem = (id: IndividualSurveyItemId) => (e: CheckboxChangeEvent) => {
    setIndividualSurveyItems(prev => ({ ...prev, [id]: e.target.checked }))
  }

  /** `/sponsor` 후원사 관리 목록과 동일 mock (`mockSponsorManagementListRows`) */
  const sponsorOptions = useMemo(
    () => mockSponsorManagementListRows.map(s => ({ value: s.id, label: s.name })),
    []
  )

  const selectedSponsor = useMemo<SponsorManagementRow | null>(
    () => mockSponsorManagementListRows.find(s => s.id === sponsorId) ?? null,
    [sponsorId]
  )

  const managerOptions = useMemo(() => {
    if (!selectedSponsor) return []
    return getSponsorDetailContactsNormalized(selectedSponsor).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [selectedSponsor])

  const detailedProgramOptions = useMemo(
    () =>
      withDetailedProgramNoneOption(
        mockDetailedProgramManagementListRows.map(row => ({
          value: row.id,
          label: row.name,
        }))
      ),
    []
  )

  return (
    <>
      <DetailInfoForm
        title="기본 정보*"
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
                placeholder="상세 프로그램명을 입력하세요"
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
                {PROGRAM_PROGRESS_STATIC_HINT}
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
                    setManagerContactId('')
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
                  inputSize="medium"
                  placeholder="후원사 담당자를 선택하세요"
                  width={240}
                  options={managerOptions}
                  value={managerContactId}
                  disabled={!sponsorId || managerOptions.length === 0}
                  onChange={v => setManagerContactId(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 장소"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsRadioGroup size="large" value="inside">
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
                {participant.organization ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <CmsCheckbox
                      checkboxSize="large"
                      checked={individualSurveyItems.survey}
                      onChange={toggleIndividualSurveyItem('survey')}
                    >
                      설문조사
                    </CmsCheckbox>
                    <CmsCheckbox
                      checkboxSize="large"
                      checked={individualSurveyItems.satisfaction}
                      onChange={toggleIndividualSurveyItem('satisfaction')}
                    >
                      만족도조사
                    </CmsCheckbox>
                    <CmsCheckbox
                      checkboxSize="large"
                      checked={individualSurveyItems.lecture_evaluation}
                      onChange={toggleIndividualSurveyItem('lecture_evaluation')}
                    >
                      강의평가
                    </CmsCheckbox>
                  </>
                )}
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="" hideHeader mode="edit">
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
      </DetailInfoForm>
    </>
  )
}

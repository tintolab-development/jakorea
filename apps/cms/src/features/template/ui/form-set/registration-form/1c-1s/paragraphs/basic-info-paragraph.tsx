/**
 * 1사 1교 프로그램 등록 폼 — 기본 정보
 * (상단: 일반 프로그램 정보 / 하단: 교육 과정·IP·Partner·IPS — 스크린 구성 기준)
 */
import { useMemo, useState } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '../../general/paragraphs/program-registration-ips-options'
import {
  initialProgramRegistrationSurveyItems,
  PROGRAM_REGISTRATION_SURVEY_ITEM_IDS,
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
  type ProgramRegistrationSurveyItemId,
} from '@/features/template/lib/program-registration-survey-items'

const REP_KO = '1사1교 경제금융교육'
const REP_EN = '1 Company 1 School Economics and Finance Education'

const PROGRAM_PROGRESS_STATIC_VIEW = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const ALL_VALUE = '__all__'

const DETAILED_PROGRAM_MAIN_VALUE = '__economy_1c1s_main__'
const DETAILED_PROGRAM_MAIN_OPTION = {
  value: DETAILED_PROGRAM_MAIN_VALUE,
  label: '1사1교 경제금융교육',
} as const

const IPS_PREPARE_DEFAULT = 'prepare'

const BUSINESS_FIELD_DEFAULT = 'economy_finance'

const educationCourseSelectOptions = [
  { value: ALL_VALUE, label: '전체' },
  ...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
]

export type OneCOneSRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
}

export function OneCOneSRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange: _onIndividualChange,
  onOrganizationChange,
  onTeacherInstructorChange,
}: OneCOneSRegistrationBasicInfoParagraphProps) {
  const [repKo, setRepKo] = useState(REP_KO)
  const [repEn, setRepEn] = useState(REP_EN)
  const [businessField, setBusinessField] = useState(BUSINESS_FIELD_DEFAULT)
  const [ipOwned, setIpOwned] = useState('ja')
  const [courseDeliveredBy, setCourseDeliveredBy] = useState('ja')
  const [ipsCategory, setIpsCategory] = useState(IPS_PREPARE_DEFAULT)
  const [partnerInvolvement, setPartnerInvolvement] = useState<'yes' | 'no'>('no')
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

  const [surveyItems, setSurveyItems] = useState<
    Record<ProgramRegistrationSurveyItemId, boolean>
  >(() => initialProgramRegistrationSurveyItems(true))

  const toggleSurveyItem = (id: ProgramRegistrationSurveyItemId) => (e: CheckboxChangeEvent) => {
    setSurveyItems(prev => ({ ...prev, [id]: e.target.checked }))
  }

  const { options: sponsorApiOptions } = useSponsorSelectOptions()
  const contactsQuery = useSponsorContactsQuery(
    sponsorId === ALL_VALUE ? null : sponsorId,
    sponsorId !== ALL_VALUE && Boolean(sponsorId)
  )

  const sponsorOptions = useMemo(
    () => [{ value: ALL_VALUE, label: '전체' }, ...sponsorApiOptions],
    [sponsorApiOptions]
  )

  const managerOptions = useMemo(() => {
    if (sponsorId === ALL_VALUE) {
      return [{ value: ALL_VALUE, label: '전체' }]
    }
    if (!sponsorId) return []
    return (contactsQuery.data ?? []).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [contactsQuery.data, sponsorId])

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
                value={repKo}
                onChange={e => setRepKo(e.target.value)}
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
                value={repEn}
                onChange={e => setRepEn(e.target.value)}
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
                <CmsCheckbox checkboxSize="large" checked={false} disabled>
                  개인
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.organization}
                  onChange={e => onOrganizationChange(e.target.checked)}
                >
                  학교/기관
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.teacherInstructor === true}
                  onChange={e => onTeacherInstructorChange(e.target.checked)}
                >
                  강사
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="large" checked={false} disabled>
                  봉사자
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
                  placeholder="사업 분야를 선택하세요"
                  width={240}
                  options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                  value={businessField}
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

      <DetailInfoForm title="" hideHeader mode="edit">
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
                  placeholder="전체"
                  width={240}
                  options={[...TEMPLATE_FORM_IP_OWNED_OPTIONS]}
                  value={ipOwned}
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
                  withAllOption={false}
                  inputSize="medium"
                  placeholder="전체"
                  width={240}
                  options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
                  value={courseDeliveredBy}
                  onChange={v => setCourseDeliveredBy(String(v ?? ''))}
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
                value={ipsCategory}
                onChange={v => setIpsCategory(String(v ?? ''))}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}

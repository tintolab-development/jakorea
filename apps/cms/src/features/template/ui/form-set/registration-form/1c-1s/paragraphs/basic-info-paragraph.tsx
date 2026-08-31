/**
 * 1사 1교 프로그램 등록 폼 — 기본 정보
 * (상단: 일반 프로그램 정보 / 하단: 교육 과정·IP·Partner·IPS — 스크린 구성 기준)
 */
import { useMemo } from 'react'
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
import { useProgramRegistrationOverlayKv, updateProgramRegistrationOverlayKey } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

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

type OperationRangeSeal = { start: string; end: string } | null

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
  const [repKo, setRepKo] = useProgramRegistrationOverlayKv('economyRegistration.basicInfo.repKo', REP_KO)
  const [repEn, setRepEn] = useProgramRegistrationOverlayKv('economyRegistration.basicInfo.repEn', REP_EN)
  const [businessField, setBusinessField] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.businessField',
    BUSINESS_FIELD_DEFAULT
  )
  const [ipOwned, setIpOwned] = useProgramRegistrationOverlayKv('economyRegistration.basicInfo.ipOwned', 'ja')
  const [courseDeliveredBy, setCourseDeliveredBy] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.courseDeliveredBy',
    'ja'
  )
  const [ipsCategory, setIpsCategory] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.ipsCategory',
    IPS_PREPARE_DEFAULT
  )
  const [partnerInvolvement, setPartnerInvolvement] = useProgramRegistrationOverlayKv<'yes' | 'no'>(
    'economyRegistration.basicInfo.partnerInvolvement',
    'no'
  )
  const [educationCourse, setEducationCourse] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.educationCourse',
    ALL_VALUE
  )
  
  const [operationAnchorIso, setOperationAnchorIso] = useProgramRegistrationOverlayKv<string | null>(
    'economyRegistration.basicInfo.operationAnchorIso',
    null
  )
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const setOperationAnchorDate = (next: Dayjs | null) => {
    setOperationAnchorIso(next == null ? null : next.toISOString())
  }

  const [operationRangeSeal, setOperationRangeSeal] = useProgramRegistrationOverlayKv<OperationRangeSeal>(
    'economyRegistration.basicInfo.operationRangeSeal',
    null
  )
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

  const [sponsorId, setSponsorId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.sponsorId',
    ALL_VALUE
  )
  const [managerContactId, setManagerContactId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.managerContactId',
    ALL_VALUE
  )
  const [detailedProgramId, setDetailedProgramId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.detailedProgramId',
    DETAILED_PROGRAM_MAIN_VALUE
  )
  const [publicProgramTitle, setPublicProgramTitle] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.publicProgramTitle',
    REP_KO
  )

  const [surveyItems] = useProgramRegistrationOverlayKv<
    Record<ProgramRegistrationSurveyItemId, boolean>
  >('economyRegistration.basicInfo.surveyItems', initialProgramRegistrationSurveyItems(true))

  const toggleSurveyItem = (id: ProgramRegistrationSurveyItemId) => (e: CheckboxChangeEvent) => {
    updateProgramRegistrationOverlayKey<Record<ProgramRegistrationSurveyItemId, boolean>>(
      'economyRegistration.basicInfo.surveyItems',
      prev => ({
        ...(prev ?? initialProgramRegistrationSurveyItems(true)),
        [id]: e.target.checked,
      })
    )
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
                value={publicProgramTitle}
                onChange={e => setPublicProgramTitle(e.target.value)}
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

/**
 * UJAT 프로그램 등록 폼 — 기본 정보
 * (1사 1교 프로그램 등록 폼 기본 정보와 동일하게 DetailInfoForm 3구역: 프로그램명 / 운영·설문 / 교육·IPS)
 */
import { useEffect, useMemo } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
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
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

import {
  UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT,
  UJAT_BASIC_INFO_REP_EN_DEFAULT,
  UJAT_BASIC_INFO_REP_KO_DEFAULT,
  UJAT_DEFAULT_SPONSOR_ID,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
  UJAT_SURVEY_ITEMS_DEFAULT,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  PROGRAM_REGISTRATION_SURVEY_ITEM_IDS,
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
} from '@/features/template/lib/program-registration-survey-items'

const PROGRAM_PROGRESS_STATIC_VIEW = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const DETAILED_PROGRAM_UJAT_OPTION = {
  value: UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  label: UJAT_DETAILED_PROGRAM_UJAT_LABEL,
} as const

function participantTypeLabel(
  value: (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value']
) {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value
}

const educationCourseSelectOptions = [...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS]

const BLOCK_GAP_STYLE = { marginTop: 16 } as const

type OperationRangeSeal = { start: string; end: string } | null

export function UjatBasicInfoParagraph() {
  const [repKo, setRepKo] = useUjatProgramRegistrationOverlayKv('ujat.basicInfo.repKo', UJAT_BASIC_INFO_REP_KO_DEFAULT)
  const [repEn, setRepEn] = useUjatProgramRegistrationOverlayKv('ujat.basicInfo.repEn', UJAT_BASIC_INFO_REP_EN_DEFAULT)
  const [programManagementName, setProgramManagementName] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.programManagementName',
    UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT
  )
  const [detailedProgramId, setDetailedProgramId] = useUjatProgramRegistrationOverlayKv<string>(
    'ujat.basicInfo.detailedProgramId',
    UJAT_DETAILED_PROGRAM_UJAT_VALUE
  )

  const [operationAnchorIso, setOperationAnchorIso] = useUjatProgramRegistrationOverlayKv<string | null>(
    'ujat.basicInfo.operationAnchorIso',
    null
  )
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const setOperationAnchorDate = (next: Dayjs | null) => {
    setOperationAnchorIso(next == null ? null : next.toISOString())
  }

  const [operationRangeSeal, setOperationRangeSeal] = useUjatProgramRegistrationOverlayKv<OperationRangeSeal>(
    'ujat.basicInfo.operationRangeSeal',
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

  const [individualChecked, setIndividualChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.individual',
    false
  )
  const [organizationChecked, setOrganizationChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.organization',
    true
  )
  const [teacherChecked, setTeacherChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.teacher',
    false
  )
  const [volunteerChecked, setVolunteerChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.volunteer',
    true
  )

  useEffect(() => {
    if (!organizationChecked) setOrganizationChecked(true)
    if (!volunteerChecked) setVolunteerChecked(true)
    if (individualChecked) setIndividualChecked(false)
    if (teacherChecked) setTeacherChecked(false)
  }, [
    organizationChecked,
    volunteerChecked,
    individualChecked,
    teacherChecked,
    setOrganizationChecked,
    setVolunteerChecked,
    setIndividualChecked,
    setTeacherChecked,
  ])

  const [businessField, setBusinessField] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.businessField',
    'economy_finance'
  )

  const [sponsorId, setSponsorId] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.sponsorId',
    UJAT_DEFAULT_SPONSOR_ID
  )

  const [ipOwned, setIpOwned] = useUjatProgramRegistrationOverlayKv('ujat.basicInfo.ipOwned', 'ja')
  const [courseDeliveredBy, setCourseDeliveredBy] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.courseDeliveredBy',
    'ja'
  )
  const [ipsCategory, setIpsCategory] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.ipsCategory',
    'prepare'
  )

  const [surveyItems] = useUjatProgramRegistrationOverlayKv<Record<UjatSurveyRowId, boolean>>(
    'ujat.basicInfo.surveyItems',
    UJAT_SURVEY_ITEMS_DEFAULT
  )

  const [educationCourse, setEducationCourse] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.educationCourse',
    ''
  )
  const [partnerInvolvement, setPartnerInvolvement] = useUjatProgramRegistrationOverlayKv<'yes' | 'no'>(
    'ujat.basicInfo.partnerInvolvement',
    'no'
  )

  const sponsorOptions = useMemo(
    () => [
      { value: UJAT_SPONSOR_ALL_VALUE, label: '전체' },
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
    updateUjatProgramRegistrationOverlayKey<Record<UjatSurveyRowId, boolean>>(
      'ujat.basicInfo.surveyItems',
      prev => ({
        ...(prev ?? UJAT_SURVEY_ITEMS_DEFAULT),
        [id]: e.target.checked,
      })
    )
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
            label="프로그램 관리명"
            edit={
              <CmsInput
                inputSize="medium"
                value={programManagementName}
                onChange={e => setProgramManagementName(e.target.value)}
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
                  disabled
                >
                  {participantTypeLabel('individual')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={organizationChecked}
                  disabled
                >
                  {participantTypeLabel('school_institution')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={teacherChecked}
                  disabled
                >
                  {participantTypeLabel('teacher_instructor')}
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={volunteerChecked}
                  disabled
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
                  onChange={v => setSponsorId(String(v ?? ''))}
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
              <CmsSelect
                withAllOption={false}
                inputSize="medium"
                placeholder="교육 과정을 선택하세요"
                width={240}
                options={educationCourseSelectOptions}
                value={educationCourse}
                onChange={v => setEducationCourse(String(v ?? ''))}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="IP Owned"
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="medium"
                width={240}
                options={[...TEMPLATE_FORM_IP_OWNED_OPTIONS]}
                value={ipOwned}
                onChange={v => setIpOwned(String(v ?? ''))}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="medium"
                width={240}
                options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
                value={courseDeliveredBy}
                onChange={v => setCourseDeliveredBy(String(v ?? ''))}
              />
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

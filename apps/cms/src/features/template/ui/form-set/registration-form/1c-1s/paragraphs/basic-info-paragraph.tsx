/**
 * 1사 1교 프로그램 등록 폼 — 기본 정보
 * (참여자 유형: 학교/기관·강사 checked·disabled 고정. 상단: 일반 프로그램 정보 / 하단: 교육 과정·IP·Partner·IPS)
 */
import { useEffect, useMemo } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useDetailedProgramSelectOptions } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import {
  COMPANY_SCHOOL_DEFAULT_REP_EN,
  COMPANY_SCHOOL_DEFAULT_REP_KO,
  createNewCompanySchoolRegistrationRhfValues,
} from '@/features/program/1c-1s/lib/registration-rhf-values'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { formatSponsorManagerSelectLabel } from '@/features/program/general/model/common-info-edit-schema'
import { useProgramSponsorContactsMaskedQuery } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useRegistrationCatalogReady } from '@/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  isSponsorContactUnselected,
  normalizeSponsorContactUnselectedSelection,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
  withSponsorContactUnselectedOption,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  TEMPLATE_FORM_IPS_FIELD_LABELS,
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
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
import {
  ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  ECONOMY_REGISTRATION_PROGRAM_TITLE_KO_DEFAULT,
  patchProgramRegistrationOverlay,
  useProgramRegistrationOverlayKv,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

const REP_KO = ECONOMY_REGISTRATION_PROGRAM_TITLE_KO_DEFAULT
const REP_EN = ''

const PROGRAM_PROGRESS_STATIC_VIEW = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const ALL_VALUE = '__all__'
const EMPTY_MANAGER_CONTACT_IDS: string[] = []

function asUnselectedSelectValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return !trimmed || trimmed === ALL_VALUE ? '' : trimmed
}
const ECONOMY_SURVEY_ITEMS_DEFAULT = initialProgramRegistrationSurveyItems(true)

/**
 * 과거 셀렉트 기본값이던 가짜 id. 1사1교는 BE에 CURRICULUM 으로 전송되어 세부 프로그램 마스터 id(숫자)가
 * 필수이므로 옵션에서 제거했고, 잔존 overlay 값 판별용으로만 남긴다.
 */
const LEGACY_DETAILED_PROGRAM_MAIN_VALUE = '__economy_1c1s_main__'

function isLegacyDetailedProgramValue(value: string): boolean {
  return (
    value === LEGACY_DETAILED_PROGRAM_MAIN_VALUE ||
    value === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
  )
}

type OperationRangeSeal = { start: string; end: string } | null

const educationCourseSelectOptions = [...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS]

const TEMPLATE_MANAGEMENT_COMPACT_SELECT_WIDTH = 200

/**
 * 템플릿 관리 등록 폼(시안 5767:191506) 초기 선택값 — 프로그램 신규 등록 시작값(시안 9899:215345)과 같다.
 * 템플릿 관리 화면에는 1사1교 등록 RHF가 없어 overlay 키가 비어 있을 때만 쓴다(저장값은 그대로 보인다).
 * 모듈 순환 참조를 피하려고 렌더 시점에 한 번만 만든다.
 */
type OneCOneSSelectDefaults = {
  businessField: string
  ipOwned: string
  courseDeliveredBy: string
  partnerInvolvement: 'yes' | 'no' | ''
  ipsCategory: string
}

let templateManagementSelectDefaultsCache: OneCOneSSelectDefaults | null = null

function getTemplateManagementSelectDefaults(): OneCOneSSelectDefaults {
  if (templateManagementSelectDefaultsCache == null) {
    const values = createNewCompanySchoolRegistrationRhfValues()
    templateManagementSelectDefaultsCache = {
      businessField: values.businessField,
      ipOwned: values.ipOwned,
      courseDeliveredBy: values.courseDeliveredBy,
      // 템플릿 관리 라디오는 모두 미선택으로 시작한다(사용자 결정 2026-11-13) — 셀렉트만 시작값을 쓴다
      partnerInvolvement: '',
      ipsCategory: values.ipsCategory,
    }
  }
  return templateManagementSelectDefaultsCache
}

const EMPTY_SELECT_DEFAULTS: OneCOneSSelectDefaults = {
  businessField: '',
  ipOwned: '',
  courseDeliveredBy: '',
  partnerInvolvement: '',
  ipsCategory: '',
}

function EconomyOverlayTextField({
  label,
  validationKey,
  overlayKey,
  placeholder,
  defaultValue = '',
}: {
  label: string
  validationKey: string
  overlayKey: string
  placeholder: string
  defaultValue?: string
}) {
  const [value, setValue] = useProgramRegistrationOverlayKv(overlayKey, defaultValue)
  return (
    <DetailInfoForm.Field
      label={label}
      validationKey={validationKey}
      edit={
        <CmsInput
          inputSize="small"
          placeholder={placeholder}
          width="100%"
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      }
      view="-"
    />
  )
}

export type OneCOneSRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
}

export function OneCOneSRegistrationBasicInfoParagraph({
  participant: _participant,
  onIndividualChange: _onIndividualChange,
  onOrganizationChange: _onOrganizationChange,
  onTeacherInstructorChange: _onTeacherInstructorChange,
}: OneCOneSRegistrationBasicInfoParagraphProps) {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const selectDefaults = isTemplateManagementScreen
    ? getTemplateManagementSelectDefaults()
    : EMPTY_SELECT_DEFAULTS
  /** 템플릿 관리 시안(5767:191506) 셀렉트 폭 ≈200 — 등록 위저드·상세는 기존 240 유지 */
  const compactSelectWidth = isTemplateManagementScreen
    ? TEMPLATE_MANAGEMENT_COMPACT_SELECT_WIDTH
    : 240
  const [businessField, setBusinessField] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.businessField',
    selectDefaults.businessField
  )
  const [ipOwned, setIpOwned] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.ipOwned',
    selectDefaults.ipOwned
  )
  const [courseDeliveredBy, setCourseDeliveredBy] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.courseDeliveredBy',
    selectDefaults.courseDeliveredBy
  )
  const [ipsCategory, setIpsCategory] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.ipsCategory',
    selectDefaults.ipsCategory
  )
  const [partnerInvolvement, setPartnerInvolvement] = useProgramRegistrationOverlayKv<
    'yes' | 'no' | ''
  >('economyRegistration.basicInfo.partnerInvolvement', selectDefaults.partnerInvolvement)
  const [educationCourse, setEducationCourse] = useProgramRegistrationOverlayKv(
    'economyRegistration.basicInfo.educationCourse',
    ''
  )

  const [operationAnchorIso, setOperationAnchorIso] = useProgramRegistrationOverlayKv<
    string | null
  >('economyRegistration.basicInfo.operationAnchorIso', null)
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const setOperationAnchorDate = (next: Dayjs | null) => {
    setOperationAnchorIso(next == null ? null : next.toISOString())
  }

  const [operationRangeSeal, setOperationRangeSeal] =
    useProgramRegistrationOverlayKv<OperationRangeSeal>(
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
    ''
  )
  const [managerContactId, setManagerContactId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.managerContactId',
    ''
  )
  const [managerContactIds, setManagerContactIds] = useProgramRegistrationOverlayKv<string[]>(
    'economyRegistration.basicInfo.managerContactIds',
    EMPTY_MANAGER_CONTACT_IDS
  )
  const [detailedProgramId, setDetailedProgramId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.detailedProgramId',
    ''
  )
  const [, setDetailedProgramName] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.detailedProgramName',
    ''
  )
  const [surveyItems] = useProgramRegistrationOverlayKv<
    Record<ProgramRegistrationSurveyItemId, boolean>
  >('economyRegistration.basicInfo.surveyItems', ECONOMY_SURVEY_ITEMS_DEFAULT)

  const toggleSurveyItem = (id: ProgramRegistrationSurveyItemId) => (e: CheckboxChangeEvent) => {
    updateProgramRegistrationOverlayKey<Record<ProgramRegistrationSurveyItemId, boolean>>(
      'economyRegistration.basicInfo.surveyItems',
      prev => ({
        ...(prev ?? ECONOMY_SURVEY_ITEMS_DEFAULT),
        [id]: e.target.checked,
      })
    )
  }

  const { catalogReady, onSelectOpenChange } = useRegistrationCatalogReady({
    overlayBasicInfoPrefix: 'economyRegistration.basicInfo',
  })
  const sponsorCatalogQuery = useSponsorSelectOptions(catalogReady)
  const sponsorApiOptions = sponsorCatalogQuery.options
  const sponsorOptionsLoading =
    catalogReady && sponsorCatalogQuery.isLoading && sponsorApiOptions.length === 0
  const selectedSponsorId = asUnselectedSelectValue(sponsorId)
  // 등록 양식 담당자 선택지 — contactPrivacy=MASKED(후원사 선택 후에만 조회, 데이터 관리 RAW 캐시와 분리, 정책 32·37)
  const contactsQuery = useProgramSponsorContactsMaskedQuery(
    selectedSponsorId || null,
    Boolean(selectedSponsorId)
  )

  const sponsorOptions = useMemo(() => [...sponsorApiOptions], [sponsorApiOptions])

  const managerOptions = useMemo(() => {
    if (!selectedSponsorId) return []
    const contacts = (contactsQuery.data ?? []).map(c => ({
      value: c.id,
      label: formatSponsorManagerSelectLabel({
        sponsorName: '',
        contactName: c.name,
        position: c.position,
        phone: c.phone,
        multiSponsor: false,
      }),
    }))
    return withSponsorContactUnselectedOption(contacts)
  }, [contactsQuery.data, selectedSponsorId])

  const selectedManagerContactIds = useMemo(() => {
    if (!selectedSponsorId) return []
    if (Array.isArray(managerContactIds) && managerContactIds.length > 0) {
      const unique = [
        ...new Set(
          managerContactIds
            .map(String)
            .map(id => id.trim())
            .filter(id => id && id !== ALL_VALUE)
        ),
      ]
      if (unique.some(id => isSponsorContactUnselected(id))) {
        return [SPONSOR_CONTACT_UNSELECTED_VALUE]
      }
      if (unique.length > 0) return unique
    }
    if (isSponsorContactUnselected(managerContactId)) {
      return [SPONSOR_CONTACT_UNSELECTED_VALUE]
    }
    const contactId = asUnselectedSelectValue(managerContactId)
    if (contactId) return [contactId]
    return [SPONSOR_CONTACT_UNSELECTED_VALUE]
  }, [managerContactId, managerContactIds, selectedSponsorId])

  const applyManagerContactIds = (next: string[]) => {
    const unique = normalizeSponsorContactUnselectedSelection(next, selectedManagerContactIds)
    setManagerContactIds(unique)
    setManagerContactId(unique[0] ?? '')
  }

  useEffect(() => {
    if (
      selectedManagerContactIds.length === 1 &&
      isSponsorContactUnselected(selectedManagerContactIds[0]) &&
      (!Array.isArray(managerContactIds) || managerContactIds.length === 0) &&
      !isSponsorContactUnselected(managerContactId)
    ) {
      applyManagerContactIds([SPONSOR_CONTACT_UNSELECTED_VALUE])
    }
  }, [managerContactId, managerContactIds, selectedManagerContactIds])

  const { options: remoteDetailedProgramOptions, isSuccess: detailedProgramOptionsLoaded } =
    useDetailedProgramSelectOptions(catalogReady)

  // 1사1교는 항상 커리큘럼형 → 카탈로그(숫자 마스터 id)만 노출. 「해당없음」·가짜 대표 옵션은 BE가 거절한다.
  const detailedProgramOptions = remoteDetailedProgramOptions

  // 버그 수정: id만 저장하고 name을 갱신하지 않아, 선택한 세부 프로그램명이
  // generalCommonInfo에 전혀 반영되지 않던 문제 — id 변경 시 라벨도 함께 저장한다.
  const setDetailedProgramSelection = (nextId: string) => {
    setDetailedProgramId(nextId)
    const label = detailedProgramOptions.find(o => o.value === nextId)?.label?.trim() || ''
    setDetailedProgramName(label)
  }

  useEffect(() => {
    if (!detailedProgramOptionsLoaded) return
    const current = detailedProgramId.trim()
    if (!current || !isLegacyDetailedProgramValue(current)) return
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.detailedProgramId': '',
      'economyRegistration.basicInfo.detailedProgramName': '',
    })
  }, [detailedProgramId, detailedProgramOptionsLoaded])

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
          <EconomyOverlayTextField
            label="대표 프로그램명 (국문)"
            validationKey="basicInfo.repKo"
            overlayKey={ECONOMY_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY}
            placeholder={`예) ${COMPANY_SCHOOL_DEFAULT_REP_KO}`}
            defaultValue={REP_KO}
          />
          <EconomyOverlayTextField
            label="대표 프로그램명 (영문)"
            validationKey="basicInfo.repEn"
            overlayKey="economyRegistration.basicInfo.repEn"
            placeholder={`예) ${COMPANY_SCHOOL_DEFAULT_REP_EN}`}
            defaultValue={REP_EN}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <EconomyOverlayTextField
            label="공고용 프로그램명"
            validationKey="basicInfo.publicProgramTitle"
            overlayKey="economyRegistration.basicInfo.publicProgramTitle"
            placeholder="모집 시 노출될 프로그램명을 입력해 주세요"
          />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            validationKey="basicInfo.detailedProgramId"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="세부 프로그램명을 선택해 주세요"
                  width="100%"
                  options={detailedProgramOptions}
                  value={detailedProgramId}
                  onChange={v => setDetailedProgramSelection(String(v ?? ''))}
                  onOpenChange={onSelectOpenChange}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
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
            validationKey="basicInfo.audience"
            edit={
              <div
                className={[
                  'detail-info-form-inputs-wrapper cms-checkbox-group cms-checkbox-group--medium',
                  // 템플릿 관리 시안: 고정 선택(학교/기관·강사)은 활성 선택 모양으로 보인다
                  isTemplateManagementScreen
                    ? 'program-registration-paragraph__locked-checked'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <CmsCheckbox checkboxSize="medium" checked={false} disabled>
                  개인
                </CmsCheckbox>
                {/* 1사1교 — 학교/기관·강사 고정 (해제 불가) */}
                <CmsCheckbox checkboxSize="medium" checked disabled>
                  학교/기관
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="medium" checked disabled>
                  강사
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="medium" checked={false} disabled>
                  봉사자
                </CmsCheckbox>
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="사업 분야"
            validationKey="basicInfo.businessField"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="사업 분야를 선택해 주세요"
                  width={compactSelectWidth}
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
            validationKey="basicInfo.sponsorId"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="후원사를 선택해 주세요"
                  width="100%"
                  options={sponsorOptions}
                  value={selectedSponsorId}
                  loading={sponsorOptionsLoading}
                  onOpenChange={onSelectOpenChange}
                  onChange={v => {
                    const next = asUnselectedSelectValue(String(v ?? ''))
                    setSponsorId(next)
                    applyManagerContactIds([])
                  }}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            validationKey="basicInfo.managerContact"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  className={
                    isTemplateManagementScreen
                      ? 'program-registration-sponsor-manager-select program-registration-sponsor-manager-select--template-idle'
                      : undefined
                  }
                  mode="multiple"
                  withAllOption={false}
                  inputSize="small"
                  placeholder="후원사 담당자를 선택해 주세요"
                  width="100%"
                  showSearch
                  optionFilterProp="label"
                  options={managerOptions}
                  value={selectedManagerContactIds}
                  disabled={!selectedSponsorId}
                  loading={sponsorOptionsLoading}
                  onOpenChange={onSelectOpenChange}
                  onChange={v => {
                    const next = Array.isArray(v) ? v.map(String) : []
                    applyManagerContactIds(next)
                  }}
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
              <div
                className={
                  isTemplateManagementScreen
                    ? // 템플릿 관리 시안(5767:191506) 항목 간격 16
                      'detail-info-form-inputs-wrapper cms-checkbox-group cms-checkbox-group--medium'
                    : 'detail-info-form-inputs-wrapper'
                }
              >
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
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            validationKey="basicInfo.educationCourse"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  // 등록 양식에는 「전체」를 두지 않는다(QA-0389-8556) — 미선택 안내만
                  placeholder="교육 과정을 선택해 주세요"
                  width={compactSelectWidth}
                  options={educationCourseSelectOptions}
                  value={educationCourse}
                  onChange={v => setEducationCourse(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label={TEMPLATE_FORM_IPS_FIELD_LABELS.ipOwned}
            validationKey="basicInfo.ipOwned"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="선택해 주세요"
                  width={compactSelectWidth}
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
            label={TEMPLATE_FORM_IPS_FIELD_LABELS.courseDeliveredBy}
            validationKey="basicInfo.courseDeliveredBy"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="선택해 주세요"
                  width={compactSelectWidth}
                  options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
                  value={courseDeliveredBy}
                  onChange={v => setCourseDeliveredBy(String(v ?? ''))}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label={TEMPLATE_FORM_IPS_FIELD_LABELS.partnerInvolvement}
            validationKey="basicInfo.partnerInvolvement"
            edit={
              <CmsRadioGroup
                size="medium"
                value={partnerInvolvement || undefined}
                onChange={e => setPartnerInvolvement(e.target.value as 'yes' | 'no')}
              >
                <CmsRadio size="medium" value="yes">
                  Yes
                </CmsRadio>
                <CmsRadio size="medium" value="no">
                  No
                </CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="IPS 유형"
            validationKey="basicInfo.ipsCategory"
            fullRow
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                placeholder="IPS 유형을 선택해 주세요"
                width={compactSelectWidth}
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

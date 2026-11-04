/**
 * UJAT 프로그램 등록 폼 — 기본 정보
 * (1사 1교 프로그램 등록 폼 기본 정보와 동일하게 DetailInfoForm 3구역: 프로그램명 / 운영·설문 / 교육·IPS)
 */
import { useEffect, useMemo } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { useDetailedProgramSelectOptions } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import { formatSponsorManagerSelectLabel } from '@/features/program/general/model/common-info-edit-schema'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useRegistrationCatalogReady } from '@/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  isSponsorContactUnselected,
  isSponsorContactUnselectedLabel,
  normalizeSponsorContactUnselectedSelection,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
  withSponsorContactUnselectedOption,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

import {
  UJAT_DEFAULT_SPONSOR_ID,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
  UJAT_SURVEY_ITEMS_DEFAULT,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  readUjatSurveyItems,
  UJAT_REGISTRATION_SURVEY_ITEM_IDS,
  UJAT_REGISTRATION_SURVEY_ITEM_LABELS,
} from '@/features/program/ujat/lib/registration-survey-items'
import { UjatBasicInfoRHFParagraph } from './ujat-basic-info-rhf-paragraph'

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

type UjatBasicInfoForm = UseFormReturn<ProgramDetailEditFormValues>

/**
 * 상세 수정·등록 Wizard는 부모가 만든 RHF를 정본으로 사용한다. Legacy branch는
 * 독립적인 구형 템플릿/읽기 호환 화면에서만 유지한다.
 */
function useUjatBasicInfoFormValues(infoForm?: UjatBasicInfoForm) {
  const fallbackForm = useForm<ProgramDetailEditFormValues>({
    defaultValues: {} as ProgramDetailEditFormValues,
  })
  const form = infoForm ?? fallbackForm
  const values = useWatch({ control: form.control }) as ProgramDetailEditFormValues
  return { form, values }
}

function formValue<T extends keyof ProgramDetailEditFormValues>(
  values: ProgramDetailEditFormValues,
  key: T,
  fallback: ProgramDetailEditFormValues[T]
): ProgramDetailEditFormValues[T] {
  return values[key] === undefined ? fallback : values[key]
}

function useUjatBasicInfoValue<T>(
  infoForm: UjatBasicInfoForm | undefined,
  formValues: ProgramDetailEditFormValues,
  formKey: keyof ProgramDetailEditFormValues,
  overlayKey: string,
  defaultValue: T
): [T, (next: T) => void] {
  const [overlayValue, setOverlayValue] = useUjatProgramRegistrationOverlayKv<T>(
    overlayKey,
    defaultValue
  )
  if (!infoForm) return [overlayValue, setOverlayValue]

  const nextValue = formValue(
    formValues,
    formKey,
    defaultValue as ProgramDetailEditFormValues[typeof formKey]
  ) as T
  return [
    nextValue,
    next => {
      infoForm.setValue(formKey, next as never, {
        shouldDirty: true,
        shouldTouch: true,
      })
    },
  ]
}

function UjatOverlayTextField({
  label,
  validationKey,
  overlayKey,
  placeholder,
  defaultValue,
  infoForm,
  formValues,
  formKey,
}: {
  label: string
  validationKey: string
  overlayKey: string
  placeholder: string
  defaultValue: string
  infoForm?: UjatBasicInfoForm
  formValues?: ProgramDetailEditFormValues
  formKey?: keyof ProgramDetailEditFormValues
}) {
  const [value, setValue] = useUjatBasicInfoValue<string>(
    infoForm,
    formValues ?? ({} as ProgramDetailEditFormValues),
    formKey ?? 'title',
    overlayKey,
    defaultValue
  )
  return (
    <DetailInfoForm.Field
      label={label}
      validationKey={validationKey}
      edit={
        <CmsInput
          inputSize="small"
          value={value}
          onChange={event => setValue(event.target.value)}
          placeholder={placeholder}
          width="100%"
        />
      }
      view="-"
    />
  )
}

type OperationRangeSeal = { start: string; end: string } | null

export type UjatBasicInfoParagraphProps = {
  /**
   * 일정형 — 세부 프로그램명 셀렉트를「해당없음」으로 고정 (일반 프로그램 등록·상세와 동일).
   * 실적·조회에서는 일정명이 세부 프로그램명으로 반영된다.
   */
  lockDetailedProgramToNone?: boolean
  /** 상세 수정에서는 Overlay 대신 기존 공통정보 RHF를 정본으로 사용한다. */
  infoForm?: UjatBasicInfoForm
  /** 등록 Wizard에서는 공통정보 RHF 경로만 사용하고 Legacy Overlay hook을 호출하지 않는다. */
  overlayFree?: boolean
}

export function UjatBasicInfoParagraph({
  lockDetailedProgramToNone = false,
  infoForm,
}: UjatBasicInfoParagraphProps = {}) {
  if (infoForm) {
    return (
      <UjatBasicInfoRHFParagraph
        infoForm={infoForm}
        lockDetailedProgramToNone={lockDetailedProgramToNone}
      />
    )
  }
  return (
    <UjatBasicInfoLegacyParagraph
      lockDetailedProgramToNone={lockDetailedProgramToNone}
      infoForm={infoForm}
    />
  )
}

function UjatBasicInfoLegacyParagraph({
  lockDetailedProgramToNone = false,
  infoForm,
}: UjatBasicInfoParagraphProps) {
  const { values: formValues } = useUjatBasicInfoFormValues(infoForm)
  const [detailedProgramId, setDetailedProgramId] = useUjatBasicInfoValue<string>(
    infoForm,
    formValues,
    'detailedProgramId',
    'ujat.basicInfo.detailedProgramId',
    ''
  )
  const [, setDetailedProgramName] = useUjatBasicInfoValue<string>(
    infoForm,
    formValues,
    'detailedProgramName',
    'ujat.basicInfo.detailedProgramName',
    ''
  )

  const [overlayOperationAnchorIso, setOverlayOperationAnchorIso] =
    useUjatProgramRegistrationOverlayKv<string | null>('ujat.basicInfo.operationAnchorIso', null)
  const [overlayOperationRangeSeal, setOverlayOperationRangeSeal] =
    useUjatProgramRegistrationOverlayKv<OperationRangeSeal>(
      'ujat.basicInfo.operationRangeSeal',
      null
    )
  const operationAnchorIso = infoForm ? (formValues.startDate ?? null) : overlayOperationAnchorIso
  const operationEndIso = infoForm
    ? (formValues.endDate ?? null)
    : (overlayOperationRangeSeal?.end ?? null)
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const setOperationAnchorDate = (next: Dayjs | null) => {
    if (infoForm) {
      infoForm.setValue('startDate', next == null ? '' : next.format('YYYY-MM-DD'), {
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      setOverlayOperationAnchorIso(next == null ? null : next.format('YYYY-MM-DD'))
    }
  }
  const operationRange: [Dayjs, Dayjs] | null = useMemo(() => {
    const operationRangeSeal: OperationRangeSeal = infoForm
      ? { start: operationAnchorIso ?? '', end: operationEndIso ?? '' }
      : overlayOperationRangeSeal
    if (operationRangeSeal == null || !operationRangeSeal.start || !operationRangeSeal.end)
      return null
    return [dayjs(operationRangeSeal.start), dayjs(operationRangeSeal.end)]
  }, [infoForm, operationAnchorIso, operationEndIso, overlayOperationRangeSeal])
  const setOperationRange = (next: [Dayjs, Dayjs] | null) => {
    if (next == null) {
      if (infoForm) {
        infoForm.setValue('startDate', '', { shouldDirty: true, shouldTouch: true })
        infoForm.setValue('endDate', '', { shouldDirty: true, shouldTouch: true })
      } else {
        setOverlayOperationRangeSeal(null)
      }
      return
    }
    if (infoForm) {
      infoForm.setValue('startDate', next[0].format('YYYY-MM-DD'), {
        shouldDirty: true,
        shouldTouch: true,
      })
      infoForm.setValue('endDate', next[1].format('YYYY-MM-DD'), {
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      setOverlayOperationRangeSeal({
        start: next[0].format('YYYY-MM-DD'),
        end: next[1].format('YYYY-MM-DD'),
      })
    }
  }

  const operationRangeWithTime = useMemo(
    () =>
      operationRange == null ? false : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
    [operationRange]
  )

  // UJAT는 참여자 유형이 「학교/기관」·「봉사자」로 고정된 프로그램이므로
  // 4개 체크박스 모두 비활성화하고 값도 수정할 수 없게 한다.
  const [individualChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.individual',
    false
  )
  const [organizationChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.organization',
    true
  )
  const [teacherChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.teacher',
    false
  )
  const [volunteerChecked] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.volunteer',
    true
  )
  const participantTypes = infoForm
    ? new Set(formValues.generalParticipantTypes ?? ['school_institution', 'volunteer'])
    : null
  const resolvedIndividualChecked = infoForm
    ? participantTypes?.has('individual') === true
    : individualChecked
  const resolvedOrganizationChecked = infoForm
    ? participantTypes?.has('school_institution') === true ||
      participantTypes?.has('organization') === true
    : organizationChecked
  const resolvedTeacherChecked = infoForm
    ? participantTypes?.has('teacher_instructor') === true ||
      participantTypes?.has('teacher') === true
    : teacherChecked
  const resolvedVolunteerChecked = infoForm
    ? participantTypes?.has('volunteer') === true
    : volunteerChecked

  const [businessField, setBusinessField] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'businessArea',
    'ujat.basicInfo.businessField',
    ''
  )
  const [educationVenueKind, setEducationVenueKind] = useUjatProgramRegistrationOverlayKv<
    'inside' | 'outside' | 'other'
  >('ujat.basicInfo.educationVenueKind', 'inside')
  const [educationVenueDetail, setEducationVenueDetail] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.educationVenueDetail',
    ''
  )

  const [sponsorId, setSponsorId] = useUjatBasicInfoValue<string>(
    infoForm,
    formValues,
    'sponsorId',
    'ujat.basicInfo.sponsorId',
    UJAT_DEFAULT_SPONSOR_ID
  )
  const [sponsorContactId, setSponsorContactId] = useUjatBasicInfoValue<string>(
    infoForm,
    formValues,
    'sponsorManagerContactId',
    'ujat.basicInfo.sponsorContactId',
    ''
  )
  const [sponsorContactIds, setSponsorContactIds] = useUjatBasicInfoValue<string[]>(
    infoForm,
    formValues,
    'sponsorManagerContactIds',
    'ujat.basicInfo.sponsorContactIds',
    []
  )
  const [sponsorManagerName, setSponsorManagerName] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'managerName',
    'ujat.basicInfo.sponsorManagerName',
    ''
  )

  const [ipOwned, setIpOwned] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'ipOwned',
    'ujat.basicInfo.ipOwned',
    ''
  )
  const [courseDeliveredBy, setCourseDeliveredBy] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'courseDeliveredBy',
    'ujat.basicInfo.courseDeliveredBy',
    ''
  )
  const [ipsCategory, setIpsCategory] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'ipsCategory',
    'ujat.basicInfo.ipsCategory',
    ''
  )

  const [surveyItemsRaw] = useUjatBasicInfoValue<Record<string, boolean>>(
    infoForm,
    formValues,
    'surveySurvey',
    'ujat.basicInfo.surveyItems',
    UJAT_SURVEY_ITEMS_DEFAULT
  )
  const surveyItems = useMemo(
    () =>
      infoForm
        ? {
            survey: formValues.surveySurvey === true,
            volunteer_satisfaction: formValues.surveyVolunteerSatisfaction === true,
            school_satisfaction: formValues.surveySchoolSatisfaction === true,
            lecture_evaluation: formValues.surveyLectureEvaluation === true,
          }
        : readUjatSurveyItems(surveyItemsRaw),
    [
      formValues.surveyLectureEvaluation,
      formValues.surveySchoolSatisfaction,
      formValues.surveyVolunteerSatisfaction,
      formValues.surveySurvey,
      infoForm,
      surveyItemsRaw,
    ]
  )

  const [educationCourse, setEducationCourse] = useUjatBasicInfoValue(
    infoForm,
    formValues,
    'educationProcess',
    'ujat.basicInfo.educationCourse',
    ''
  )
  const [overlayPartnerInvolvement, setOverlayPartnerInvolvement] =
    useUjatProgramRegistrationOverlayKv<'yes' | 'no'>('ujat.basicInfo.partnerInvolvement', 'no')
  const partnerInvolvement = infoForm
    ? formValues.partnerInvolvement === true
      ? 'yes'
      : 'no'
    : overlayPartnerInvolvement
  const setPartnerInvolvement = (next: 'yes' | 'no') => {
    if (infoForm) {
      infoForm.setValue('partnerInvolvement', next === 'yes', {
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      setOverlayPartnerInvolvement(next)
    }
  }

  const { catalogReady, onSelectOpenChange } = useRegistrationCatalogReady({
    overlayBasicInfoPrefix: 'ujat.basicInfo',
  })
  const sponsorCatalogQuery = useSponsorSelectOptions(catalogReady)
  const sponsorApiOptions = sponsorCatalogQuery.options
  const sponsorOptionsLoading =
    catalogReady && sponsorCatalogQuery.isLoading && sponsorApiOptions.length === 0
  const contactsQuery = useSponsorContactsQuery(sponsorId, Boolean(sponsorId))

  const sponsorOptions = useMemo(() => [...sponsorApiOptions], [sponsorApiOptions])

  const managerOptions = useMemo(() => {
    if (!sponsorId) return []
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
  }, [contactsQuery.data, sponsorId])

  const selectedSponsorContactIds = useMemo(() => {
    const stored = [
      ...new Set(
        [...(Array.isArray(sponsorContactIds) ? sponsorContactIds : []), sponsorContactId]
          .map(id => String(id ?? '').trim())
          .filter(Boolean)
      ),
    ]
    if (stored.some(id => isSponsorContactUnselected(id))) {
      return [SPONSOR_CONTACT_UNSELECTED_VALUE]
    }
    if (isSponsorContactUnselectedLabel(sponsorManagerName)) {
      return [SPONSOR_CONTACT_UNSELECTED_VALUE]
    }
    if (stored.length > 0 && stored.every(id => id !== UJAT_SPONSOR_ALL_VALUE)) return stored
    if (sponsorContactId && sponsorContactId !== UJAT_SPONSOR_ALL_VALUE) return [sponsorContactId]
    if (sponsorContactId === UJAT_SPONSOR_ALL_VALUE && sponsorId === UJAT_SPONSOR_ALL_VALUE) {
      return [UJAT_SPONSOR_ALL_VALUE]
    }
    if (sponsorId && sponsorId !== UJAT_SPONSOR_ALL_VALUE) {
      return [SPONSOR_CONTACT_UNSELECTED_VALUE]
    }
    return []
  }, [sponsorContactId, sponsorContactIds, sponsorId, sponsorManagerName])

  const applySponsorContactIds = (next: string[]) => {
    const unique = normalizeSponsorContactUnselectedSelection(next, selectedSponsorContactIds)
    setSponsorContactIds(unique)
    const primary =
      unique[0] ?? (sponsorId === UJAT_SPONSOR_ALL_VALUE ? UJAT_SPONSOR_ALL_VALUE : '')
    setSponsorContactId(primary)
    if (infoForm) {
      infoForm.setValue('sponsorManagerContactIds', unique, {
        shouldDirty: true,
        shouldTouch: true,
      })
      infoForm.setValue('sponsorManagerContactId', primary, {
        shouldDirty: true,
        shouldTouch: true,
      })
    }
    const labels = unique
      .filter(id => id !== UJAT_SPONSOR_ALL_VALUE && !isSponsorContactUnselected(id))
      .map(id => managerOptions.find(o => o.value === id)?.label ?? '')
      .filter(Boolean)
    const nextManagerName =
      unique.length > 0 && unique.every(id => isSponsorContactUnselected(id))
        ? SPONSOR_CONTACT_UNSELECTED_LABEL
        : labels.join(', ')
    setSponsorManagerName(nextManagerName)
    if (infoForm) {
      infoForm.setValue('managerName', nextManagerName, { shouldDirty: true, shouldTouch: true })
    }
  }

  useEffect(() => {
    if (
      selectedSponsorContactIds.length === 1 &&
      isSponsorContactUnselected(selectedSponsorContactIds[0]) &&
      (!Array.isArray(sponsorContactIds) || sponsorContactIds.length === 0) &&
      !isSponsorContactUnselected(sponsorContactId) &&
      !isSponsorContactUnselectedLabel(sponsorManagerName)
    ) {
      applySponsorContactIds([SPONSOR_CONTACT_UNSELECTED_VALUE])
    }
  }, [selectedSponsorContactIds, sponsorContactId, sponsorContactIds, sponsorManagerName])

  const { options: remoteDetailedProgramOptions } = useDetailedProgramSelectOptions(catalogReady)

  // 일반 일정형과 동일 — 잠금 시 「해당없음」만 유효. 잠금 해제(커리큘럼형)에서는 UJAT 고정 옵션+카탈로그.
  const detailedProgramOptions = useMemo(
    () =>
      lockDetailedProgramToNone
        ? withDetailedProgramNoneOption(remoteDetailedProgramOptions)
        : [
            DETAILED_PROGRAM_UJAT_OPTION,
            ...withDetailedProgramNoneOption(remoteDetailedProgramOptions),
          ],
    [lockDetailedProgramToNone, remoteDetailedProgramOptions]
  )

  useEffect(() => {
    if (!lockDetailedProgramToNone) return
    if (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return
    setDetailedProgramId(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    setDetailedProgramName('해당없음')
  }, [detailedProgramId, lockDetailedProgramToNone, setDetailedProgramId, setDetailedProgramName])

  // id만 저장하고 name을 갱신하지 않으면 실제 반영되는 세부 프로그램명이 어긋날 수 있다 —
  // id 변경 시 라벨도 항상 함께 저장한다.
  const setDetailedProgramSelection = (nextId: string) => {
    setDetailedProgramId(nextId)
    if (nextId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
      setDetailedProgramName('해당없음')
      return
    }
    const label = detailedProgramOptions.find(o => o.value === nextId)?.label?.trim() || ''
    setDetailedProgramName(label)
  }

  const detailedProgramSelectValue = lockDetailedProgramToNone
    ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    : detailedProgramId

  const selectValue = (value: unknown): string => {
    const normalized = String(value ?? '')
    if (!infoForm) return normalized
    if (normalized === 'JA' || normalized.toLowerCase() === 'ja') return 'ja'
    if (normalized === 'Partner' || normalized.toLowerCase() === 'partner') return 'partner'
    if (
      normalized === 'Joint' ||
      normalized === 'Jointly' ||
      normalized.toLowerCase() === 'jointly'
    ) {
      return 'jointly'
    }
    return normalized
  }

  const setSelectValue = (
    setter: (next: string) => void,
    value: unknown,
    formValue?: 'ipOwned' | 'courseDeliveredBy'
  ) => {
    const normalized = String(value ?? '')
    if (!infoForm || formValue == null) {
      setter(normalized)
      return
    }
    const canonical =
      normalized === 'ja'
        ? 'JA'
        : normalized === 'partner'
          ? 'Partner'
          : normalized === 'jointly'
            ? 'Jointly'
            : normalized
    setter(canonical)
  }

  const toggleSurveyItem = (id: UjatSurveyRowId) => (e: CheckboxChangeEvent) => {
    if (infoForm) {
      const field =
        id === 'survey'
          ? 'surveySurvey'
          : id === 'volunteer_satisfaction'
            ? 'surveyVolunteerSatisfaction'
            : id === 'school_satisfaction'
              ? 'surveySchoolSatisfaction'
              : 'surveyLectureEvaluation'
      infoForm.setValue(field, e.target.checked, { shouldDirty: true, shouldTouch: true })
      return
    }
    updateUjatProgramRegistrationOverlayKey<Record<string, boolean>>(
      'ujat.basicInfo.surveyItems',
      prev => ({
        ...readUjatSurveyItems(prev ?? UJAT_SURVEY_ITEMS_DEFAULT),
        [id]: e.target.checked,
      })
    )
  }

  return (
    <>
      {/* ── 대표 프로그램명 ~ 세부 프로그램명 ── */}
      <DetailInfoForm
        title="UJAT 기본 정보"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <UjatOverlayTextField
            label="대표 프로그램명 (국문)"
            validationKey="basicInfo.repKo"
            overlayKey="ujat.basicInfo.repKo"
            placeholder="대표 프로그램명을 입력해 주세요"
            defaultValue=""
            infoForm={infoForm}
            formValues={formValues}
            formKey="mainTitle"
          />
          <UjatOverlayTextField
            label="대표 프로그램명 (영문)"
            validationKey="basicInfo.repEn"
            overlayKey="ujat.basicInfo.repEn"
            placeholder="대표 프로그램명을 입력해 주세요"
            defaultValue=""
            infoForm={infoForm}
            formValues={formValues}
            formKey="titleEn"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <UjatOverlayTextField
            label="프로그램 관리명"
            validationKey="basicInfo.programManagementName"
            overlayKey="ujat.basicInfo.programManagementName"
            placeholder="프로그램 관리명을 입력해 주세요"
            defaultValue=""
            infoForm={infoForm}
            formValues={formValues}
            formKey="title"
          />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            validationKey="basicInfo.detailedProgramId"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  withAllOption={false}
                  inputSize="small"
                  placeholder="세부 프로그램명을 선택하세요"
                  width="100%"
                  options={detailedProgramOptions}
                  value={detailedProgramSelectValue}
                  onChange={v => setDetailedProgramSelection(String(v ?? ''))}
                  onOpenChange={onSelectOpenChange}
                  disabled={lockDetailedProgramToNone}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        {/* ── 사업 운영 기간 ~ 설문 진행 항목 ── */}
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
                  placeholder="사업 운영 기간을 선택하세요"
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
              <div className="detail-info-form-inputs-wrapper">
                <CmsCheckbox checkboxSize="medium" checked={resolvedIndividualChecked} disabled>
                  {participantTypeLabel('individual')}
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="medium" checked={resolvedOrganizationChecked} disabled>
                  {participantTypeLabel('school_institution')}
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="medium" checked={resolvedTeacherChecked} disabled>
                  {participantTypeLabel('teacher_instructor')}
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="medium" checked={resolvedVolunteerChecked} disabled>
                  {participantTypeLabel('volunteer')}
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
                  placeholder="사업 분야를 선택하세요"
                  width="100%"
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
                  placeholder="선택하세요"
                  width="100%"
                  options={sponsorOptions}
                  value={sponsorId}
                  loading={sponsorOptionsLoading}
                  onOpenChange={onSelectOpenChange}
                  onChange={v => {
                    const next = String(v ?? '')
                    setSponsorId(next)
                    if (infoForm) {
                      infoForm.setValue('sponsorManagementIds', next ? [next] : [], {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                    applySponsorContactIds([])
                  }}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            validationKey="basicInfo.sponsorContact"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  mode="multiple"
                  withAllOption={false}
                  inputSize="small"
                  placeholder="후원사 담당자를 선택하세요"
                  width="100%"
                  showSearch
                  optionFilterProp="label"
                  options={managerOptions}
                  value={selectedSponsorContactIds}
                  disabled={!sponsorId}
                  loading={sponsorOptionsLoading}
                  onOpenChange={onSelectOpenChange}
                  onChange={v => {
                    const next = Array.isArray(v) ? v.map(String) : []
                    applySponsorContactIds(next)
                  }}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 장소"
            validationKey="basicInfo.educationVenueDetail"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsRadioGroup
                  size="medium"
                  value={educationVenueKind}
                  onChange={event =>
                    setEducationVenueKind(event.target.value as 'inside' | 'outside' | 'other')
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
                <CmsInput
                  inputSize="small"
                  placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                  width="100%"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  value={educationVenueDetail}
                  onChange={event => setEducationVenueDetail(event.target.value)}
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
                {UJAT_REGISTRATION_SURVEY_ITEM_IDS.map(id => (
                  <CmsCheckbox
                    key={id}
                    checkboxSize="medium"
                    checked={surveyItems[id]}
                    onChange={toggleSurveyItem(id)}
                  >
                    {UJAT_REGISTRATION_SURVEY_ITEM_LABELS[id]}
                  </CmsCheckbox>
                ))}
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        {/* ── 교육 과정 ~ IPS 유형 ── */}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            validationKey="basicInfo.educationCourse"
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                placeholder="교육 과정을 선택하세요"
                width="100%"
                options={educationCourseSelectOptions}
                value={educationCourse}
                onChange={v => setEducationCourse(String(v ?? ''))}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="IP Owned"
            validationKey="basicInfo.ipOwned"
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                width="100%"
                options={[...TEMPLATE_FORM_IP_OWNED_OPTIONS]}
                value={selectValue(ipOwned)}
                onChange={v => setSelectValue(setIpOwned, v, 'ipOwned')}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            validationKey="basicInfo.courseDeliveredBy"
            edit={
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                width="100%"
                options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
                value={selectValue(courseDeliveredBy)}
                onChange={v => setSelectValue(setCourseDeliveredBy, v, 'courseDeliveredBy')}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            validationKey="basicInfo.partnerInvolvement"
            edit={
              <CmsRadioGroup
                size="medium"
                value={partnerInvolvement}
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

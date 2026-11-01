/**
 * UJAT 등록 Wizard 공통정보 입력.
 *
 * 이 컴포넌트는 등록 Wizard에서만 사용한다. 공통정보·설문·참여자 설정의
 * UI 상태는 RHF가 소유하며, Legacy UJAT registration overlay를 읽거나 쓰지 않는다.
 */
import { useEffect, useMemo } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useWatch, type UseFormReturn } from 'react-hook-form'
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
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SURVEY_ITEMS_DEFAULT,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  UJAT_REGISTRATION_SURVEY_ITEM_IDS,
  UJAT_REGISTRATION_SURVEY_ITEM_LABELS,
} from '@/features/program/ujat/lib/registration-survey-items'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

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

type UjatBasicInfoRHFParagraphProps = {
  infoForm: UseFormReturn<ProgramDetailEditFormValues>
  lockDetailedProgramToNone?: boolean
}

function setField(
  infoForm: UseFormReturn<ProgramDetailEditFormValues>,
  key: keyof ProgramDetailEditFormValues,
  value: unknown
) {
  infoForm.setValue(key, value as never, { shouldDirty: true, shouldTouch: true })
}

export function UjatBasicInfoRHFParagraph({
  infoForm,
  lockDetailedProgramToNone = false,
}: UjatBasicInfoRHFParagraphProps) {
  const formValues = useWatch({ control: infoForm.control }) as ProgramDetailEditFormValues
  const { catalogReady, onSelectOpenChange } = useRegistrationCatalogReady()
  const sponsorCatalogQuery = useSponsorSelectOptions(catalogReady)
  const contactsQuery = useSponsorContactsQuery(
    String(formValues.sponsorId ?? ''),
    Boolean(formValues.sponsorId)
  )
  const { options: remoteDetailedProgramOptions } = useDetailedProgramSelectOptions(catalogReady)

  const sponsorId = String(formValues.sponsorId ?? '')
  const sponsorContactId = String(formValues.sponsorManagerContactId ?? '')
  const sponsorContactIds = useMemo(
    () =>
      Array.isArray(formValues.sponsorManagerContactIds)
        ? formValues.sponsorManagerContactIds.map(String)
        : [],
    [formValues.sponsorManagerContactIds]
  )
  const sponsorManagerName = String(formValues.managerName ?? '')
  const detailedProgramId = String(formValues.detailedProgramId ?? '')
  const operationAnchorIso = String(formValues.startDate ?? '').trim()
  const operationEndIso = String(formValues.endDate ?? '').trim()
  const operationAnchorDate = operationAnchorIso ? dayjs(operationAnchorIso) : null
  const operationRange: [Dayjs, Dayjs] | null = useMemo(() => {
    if (!operationAnchorIso || !operationEndIso) return null
    return [dayjs(operationAnchorIso), dayjs(operationEndIso)]
  }, [operationAnchorIso, operationEndIso])
  const operationRangeWithTime = useMemo(
    () =>
      operationRange == null
        ? false
        : dateRangeUsesClockTime(operationRange[0], operationRange[1]),
    [operationRange]
  )

  const participantTypes = new Set(formValues.generalParticipantTypes ?? [
    'school_institution',
    'volunteer',
  ])
  const individualChecked = participantTypes.has('individual')
  const organizationChecked =
    participantTypes.has('school_institution') || participantTypes.has('organization')
  const teacherChecked =
    participantTypes.has('teacher_instructor') || participantTypes.has('teacher')
  const volunteerChecked = participantTypes.has('volunteer')

  const sponsorOptions = useMemo(
    () => [...sponsorCatalogQuery.options],
    [sponsorCatalogQuery.options]
  )
  const sponsorOptionsLoading =
    catalogReady && sponsorCatalogQuery.isLoading && sponsorCatalogQuery.options.length === 0

  const managerOptions = useMemo(() => {
    if (!sponsorId) return []
    return withSponsorContactUnselectedOption(
      (contactsQuery.data ?? []).map(contact => ({
        value: contact.id,
        label: formatSponsorManagerSelectLabel({
          sponsorName: '',
          contactName: contact.name,
          position: contact.position,
          phone: contact.phone,
          multiSponsor: false,
        }),
      }))
    )
  }, [contactsQuery.data, sponsorId])

  const selectedSponsorContactIds = useMemo(() => {
    const stored = [
      ...new Set(
        [...sponsorContactIds, sponsorContactId]
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
    if (stored.length > 0) return stored
    if (sponsorContactId) return [sponsorContactId]
    if (sponsorId) {
      return [SPONSOR_CONTACT_UNSELECTED_VALUE]
    }
    return []
  }, [sponsorContactId, sponsorContactIds, sponsorId, sponsorManagerName])

  const applySponsorContactIds = (next: string[]) => {
    const unique = normalizeSponsorContactUnselectedSelection(next, selectedSponsorContactIds)
    const primary = unique[0] ?? ''
    const labels = unique
      .filter(id => !isSponsorContactUnselected(id))
      .map(id => managerOptions.find(option => option.value === id)?.label ?? '')
      .filter(Boolean)
    const nextManagerName =
      unique.length > 0 && unique.every(id => isSponsorContactUnselected(id))
        ? SPONSOR_CONTACT_UNSELECTED_LABEL
        : labels.join(', ')
    setField(infoForm, 'sponsorManagerContactIds', unique)
    setField(infoForm, 'sponsorManagerContactId', primary)
    setField(infoForm, 'managerName', nextManagerName)
  }

  useEffect(() => {
    if (
      selectedSponsorContactIds.length === 1 &&
      isSponsorContactUnselected(selectedSponsorContactIds[0]) &&
      sponsorContactIds.length === 0 &&
      !isSponsorContactUnselected(sponsorContactId) &&
      !isSponsorContactUnselectedLabel(sponsorManagerName)
    ) {
      applySponsorContactIds([SPONSOR_CONTACT_UNSELECTED_VALUE])
    }
    // The effect only normalizes an incomplete server/draft selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSponsorContactIds, sponsorContactId, sponsorContactIds, sponsorManagerName])

  const detailedProgramOptions = useMemo(
    () =>
      lockDetailedProgramToNone
        ? withDetailedProgramNoneOption(remoteDetailedProgramOptions)
        : [DETAILED_PROGRAM_UJAT_OPTION, ...withDetailedProgramNoneOption(remoteDetailedProgramOptions)],
    [lockDetailedProgramToNone, remoteDetailedProgramOptions]
  )
  const detailedProgramSelectValue = lockDetailedProgramToNone
    ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    : detailedProgramId

  const selectValue = (value: unknown): string => {
    const normalized = String(value ?? '')
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
    key: 'ipOwned' | 'courseDeliveredBy',
    value: unknown
  ) => {
    const normalized = String(value ?? '')
    const canonical =
      normalized === 'ja'
        ? 'JA'
        : normalized === 'partner'
          ? 'Partner'
          : normalized === 'jointly'
            ? 'Jointly'
            : normalized
    setField(infoForm, key, canonical)
  }

  const setDetailedProgramSelection = (nextId: string) => {
    setField(infoForm, 'detailedProgramId', nextId)
    const label =
      nextId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? '해당없음'
        : detailedProgramOptions.find(option => option.value === nextId)?.label?.trim() || ''
    setField(infoForm, 'detailedProgramName', label)
  }

  const toggleSurveyItem = (id: UjatSurveyRowId) => (event: CheckboxChangeEvent) => {
    const field =
      id === 'survey'
        ? 'surveySurvey'
        : id === 'volunteer_satisfaction'
          ? 'surveyVolunteerSatisfaction'
          : id === 'school_satisfaction'
            ? 'surveySchoolSatisfaction'
            : 'surveyLectureEvaluation'
    setField(infoForm, field, event.target.checked)
  }

  const surveyItems = {
    survey: formValues.surveySurvey ?? UJAT_SURVEY_ITEMS_DEFAULT.survey,
    volunteer_satisfaction:
      formValues.surveyVolunteerSatisfaction ?? UJAT_SURVEY_ITEMS_DEFAULT.volunteer_satisfaction,
    school_satisfaction:
      formValues.surveySchoolSatisfaction ?? UJAT_SURVEY_ITEMS_DEFAULT.school_satisfaction,
    lecture_evaluation:
      formValues.surveyLectureEvaluation ?? UJAT_SURVEY_ITEMS_DEFAULT.lecture_evaluation,
  }

  const setOperationRange = (next: [Dayjs, Dayjs] | null) => {
    setField(infoForm, 'startDate', next == null ? '' : next[0].format('YYYY-MM-DD'))
    setField(infoForm, 'endDate', next == null ? '' : next[1].format('YYYY-MM-DD'))
  }

  return (
    <DetailInfoForm
      title="UJAT 기본 정보"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표 프로그램명 (국문)"
          validationKey="basicInfo.repKo"
          edit={
            <CmsInput
              inputSize="small"
              value={String(formValues.mainTitle ?? '')}
              onChange={event => setField(infoForm, 'mainTitle', event.target.value)}
              placeholder="대표 프로그램명을 입력하세요"
              width="100%"
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="대표 프로그램명 (영문)"
          validationKey="basicInfo.repEn"
          edit={
            <CmsInput
              inputSize="small"
              value={String(formValues.titleEn ?? '')}
              onChange={event => setField(infoForm, 'titleEn', event.target.value)}
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
          validationKey="basicInfo.programManagementName"
          edit={
            <CmsInput
              inputSize="small"
              value={String(formValues.title ?? '')}
              onChange={event => setField(infoForm, 'title', event.target.value)}
              placeholder="대표 프로그램명을 입력하세요"
              width="100%"
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          validationKey="basicInfo.detailedProgramId"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                placeholder="선택하세요"
                width="100%"
                options={detailedProgramOptions}
                value={detailedProgramSelectValue}
                onChange={value => setDetailedProgramSelection(String(value ?? ''))}
                onOpenChange={onSelectOpenChange}
                disabled={lockDetailedProgramToNone}
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
                placeholder="사업 운영 기간을 선택하세요"
                preferPeriodModeInPopover
                excludeBusinessPeriodConstraint
                appliedSurfaceRange={operationRange}
                appliedSurfaceWithTime={operationRangeWithTime}
                onRangeChange={setOperationRange}
                onChange={next => {
                  if (next != null) setField(infoForm, 'startDate', next.format('YYYY-MM-DD'))
                }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          readOnlyDisplay
          view={<span className="form-editor-template-field-hint-text">{PROGRAM_PROGRESS_STATIC_VIEW}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 유형"
          validationKey="basicInfo.audience"
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <CmsCheckbox checkboxSize="medium" checked={individualChecked} disabled>
                {participantTypeLabel('individual')}
              </CmsCheckbox>
              <CmsCheckbox checkboxSize="medium" checked={organizationChecked} disabled>
                {participantTypeLabel('school_institution')}
              </CmsCheckbox>
              <CmsCheckbox checkboxSize="medium" checked={teacherChecked} disabled>
                {participantTypeLabel('teacher_instructor')}
              </CmsCheckbox>
              <CmsCheckbox checkboxSize="medium" checked={volunteerChecked} disabled>
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
                placeholder="선택하세요"
                width="100%"
                options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                value={String(formValues.businessArea ?? '')}
                onChange={value => setField(infoForm, 'businessArea', String(value ?? ''))}
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
                onChange={value => {
                  const next = String(value ?? '')
                  setField(infoForm, 'sponsorId', next)
                  setField(infoForm, 'sponsorManagementIds', next ? [next] : [])
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
                placeholder="선택하세요"
                width="100%"
                showSearch
                optionFilterProp="label"
                options={managerOptions}
                value={selectedSponsorContactIds}
                disabled={!sponsorId}
                loading={sponsorOptionsLoading}
                onOpenChange={onSelectOpenChange}
                onChange={value =>
                  applySponsorContactIds(Array.isArray(value) ? value.map(String) : [])
                }
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
                value={formValues.venueKind ?? 'inside'}
                onChange={event =>
                  setField(
                    infoForm,
                    'venueKind',
                    event.target.value as 'inside' | 'outside' | 'other'
                  )
                }
              >
                <CmsRadio size="medium" value="inside">기관 안</CmsRadio>
                <CmsRadio size="medium" value="outside">기관 밖</CmsRadio>
                <CmsRadio size="medium" value="other">기타(직접입력)</CmsRadio>
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="small"
                placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                value={String(formValues.venueDetail ?? formValues.venue ?? '')}
                onChange={event => {
                  setField(infoForm, 'venueDetail', event.target.value)
                  setField(infoForm, 'venue', event.target.value)
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
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 과정"
          validationKey="basicInfo.educationCourse"
          edit={
            <CmsSelect
              withAllOption={false}
              inputSize="small"
              placeholder="선택하세요"
              width="100%"
              options={educationCourseSelectOptions}
              value={String(formValues.educationProcess ?? '')}
              onChange={value => setField(infoForm, 'educationProcess', String(value ?? ''))}
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
              placeholder="선택하세요"
              width="100%"
              options={[...TEMPLATE_FORM_IP_OWNED_OPTIONS]}
              value={selectValue(formValues.ipOwned)}
              onChange={value => setSelectValue('ipOwned', value)}
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
              placeholder="선택하세요"
              width="100%"
              options={[...TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS]}
              value={selectValue(formValues.courseDeliveredBy)}
              onChange={value => setSelectValue('courseDeliveredBy', value)}
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
              value={
                formValues.partnerInvolvement === true
                  ? 'yes'
                  : formValues.partnerInvolvement === false
                    ? 'no'
                    : undefined
              }
              onChange={event => setField(infoForm, 'partnerInvolvement', event.target.value === 'yes')}
            >
              <CmsRadio size="medium" value="yes">Yes</CmsRadio>
              <CmsRadio size="medium" value="no">No</CmsRadio>
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
              placeholder="선택하세요"
              width={240}
              options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
              value={String(formValues.ipsCategory ?? '')}
              onChange={value => setField(infoForm, 'ipsCategory', String(value ?? ''))}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

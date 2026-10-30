import { useEffect, type ReactNode } from 'react'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { RadioChangeEvent } from 'antd'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from './program-registration-ips-type-fields'
import {
  applyEducationFormTypeSettingsModeChange,
  getProgramRegistrationEducationFormOptions,
  resolveEducationFormTypeSettingsMode,
  shouldShowEducationFormParticipantSelectionRadio,
  type EducationFormTypeSettingsMode,
} from './program-registration-education-form-options'
import {
  EDUCATION_PLACE_LABEL,
  ProgramRegistrationEducationPlaceInput,
} from './program-registration-education-place-fields'
import {
  isEducationPlaceTypeSettingsRowVisible,
  resolveEducationPlaceCommonEducationForm,
} from './program-registration-education-place-rules'
import {
  REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  getProgramRegistrationOverlayRecord,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { typeSettingsPerScheduleHint } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
import './program-registration-paragraph.css'

const PROGRAM_REGISTRATION_MULTI_COMMON_PARTICIPATION_OPTIONS = [
  { value: 'individual', label: '개인' },
  { value: 'team', label: '팀' },
] as const

type ProgramRegistrationTypeSettingsParagraphProps = {
  programType: ProgramRegistrationType
  onProgramTypeChange: (value: ProgramRegistrationType) => void
  /** 참여자 유형 학교/기관 — 교육 형태에 「참여자 선택」 포함 */
  participantOrganization: boolean
  sessionRoundType: ProgramRegistrationSessionRoundType
  onSessionRoundTypeChange: (value: ProgramRegistrationSessionRoundType) => void
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  onEducationFormScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  onParticipationScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  onIpsScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  /** 모집 시작 이후 상세 수정에서만 true. 등록 위저드는 기본 false. */
  participationMethodLocked?: boolean
  /** 일반 등록·참여자 <개인> — 「교육 진행 장소」 행(최하단) 노출 */
  educationPlaceEnabled?: boolean
}

function ScheduleDetailRadioRow({
  label,
  value,
  onChange,
  commonDetailEdit,
  perScheduleHint,
  validationKey,
  disabled = false,
  required,
}: {
  label: string
  value: ProgramRegistrationScheduleDetailKind
  onChange: (value: ProgramRegistrationScheduleDetailKind) => void
  /** `일정 공통`일 때 라디오 오른쪽에 노출 (스크린샷: 구분선 + CmsSelect 등) */
  commonDetailEdit?: ReactNode
  perScheduleHint: string
  validationKey?: string
  disabled?: boolean
  /** CMS 필수 라벨(*) — 편집 모드에서만 노출 */
  required?: boolean
}) {
  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value as ProgramRegistrationScheduleDetailKind)
  }

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        required={required}
        validationKey={validationKey}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <CmsRadioGroup size="medium" value={value} disabled={disabled} onChange={handleChange}>
              <CmsRadio size="medium" value="common">일정 공통</CmsRadio>
              <CmsRadio size="medium" value="perSchedule">일정 별 상이</CmsRadio>
            </CmsRadioGroup>
            {value === 'common' && commonDetailEdit != null ? (
              <>
                <DetailInfoForm.InputsSeparator />
                {commonDetailEdit}
              </>
            ) : null}
            {value === 'perSchedule' ? (
              <>
                <DetailInfoForm.InputsSeparator />
                <span className="program-registration-paragraph__schedule-hint">
                  {perScheduleHint}
                </span>
              </>
            ) : null}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

/** 일반(기관) 복수 회차 — 교육 형태: 일정 공통 | 일정 별 상이 | 참여자 선택 */
export function EducationFormTypeSettingsRadioRow({
  mode,
  onModeChange,
  commonDetailEdit,
  perScheduleHint,
}: {
  mode: EducationFormTypeSettingsMode
  onModeChange: (mode: EducationFormTypeSettingsMode) => void
  commonDetailEdit?: ReactNode
  perScheduleHint: string
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="교육 형태"
        validationKey="typeSettings.multiCommonEducationForm"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <CmsRadioGroup
              size="medium"
              value={mode}
              onChange={e => onModeChange(e.target.value as EducationFormTypeSettingsMode)}
            >
              <CmsRadio size="medium" value="common">일정 공통</CmsRadio>
              <CmsRadio size="medium" value="perSchedule">일정 별 상이</CmsRadio>
              <CmsRadio size="medium" value="participant_selection">참여자 선택</CmsRadio>
            </CmsRadioGroup>
            {mode === 'common' && commonDetailEdit != null ? (
              <>
                <DetailInfoForm.InputsSeparator />
                {commonDetailEdit}
              </>
            ) : null}
            {mode === 'perSchedule' ? (
              <>
                <DetailInfoForm.InputsSeparator />
                <span className="program-registration-paragraph__schedule-hint">
                  {perScheduleHint}
                </span>
              </>
            ) : null}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export function ProgramRegistrationTypeSettingsParagraph({
  programType,
  onProgramTypeChange,
  participantOrganization,
  sessionRoundType,
  onSessionRoundTypeChange,
  educationFormScheduleDetail,
  onEducationFormScheduleDetailChange,
  participationScheduleDetail,
  onParticipationScheduleDetailChange,
  ipsScheduleDetail,
  onIpsScheduleDetailChange,
  participationMethodLocked = false,
  educationPlaceEnabled = false,
}: ProgramRegistrationTypeSettingsParagraphProps) {
  const [educationPlaceScheduleDetail, setEducationPlaceScheduleDetail] =
    useProgramRegistrationOverlayKv<ProgramRegistrationScheduleDetailKind>(
      REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
      'common'
    )
  const [educationPlaceAddress, setEducationPlaceAddress] = useProgramRegistrationOverlayKv<string>(
    REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY,
    ''
  )
  const [ipsType, setIpsType] = useProgramRegistrationOverlayKv<ProgramRegistrationIpsTypeValue>(
    'generalRegistration.typeSettings.ipsType',
    {
      category: '',
      detail: '',
    }
  )
  const [multiCommonEducationForm, setMultiCommonEducationForm] = useProgramRegistrationOverlayKv(
    'generalRegistration.typeSettings.multiCommonEducationForm',
    'online'
  )
  const [multiCommonParticipation, setMultiCommonParticipation] = useProgramRegistrationOverlayKv(
    'generalRegistration.typeSettings.multiCommonParticipation',
    'individual'
  )
  /** 단일 회차 — 교육 형태·참여 방식 (교육 진행 구조는 별도 고정) */
  const [singleEducationForm, setSingleEducationForm] = useProgramRegistrationOverlayKv(
    'generalRegistration.typeSettings.singleEducationForm',
    'online'
  )
  const [singleParticipation, setSingleParticipation] = useProgramRegistrationOverlayKv(
    'generalRegistration.typeSettings.singleParticipation',
    'individual'
  )

  /** 교육 형태 「온라인」이면 교육 진행 장소 숨김·필수 제외 (일정 별 상이 교육 형태는 행 단위) */
  const showEducationPlaceRow =
    educationPlaceEnabled &&
    isEducationPlaceTypeSettingsRowVisible({
      sessionRoundType,
      educationFormScheduleDetail,
      commonEducationForm: resolveEducationPlaceCommonEducationForm({
        sessionRoundType,
        singleEducationForm,
        multiCommonEducationForm,
      }),
    })

  const handleSessionRoundChange = (e: RadioChangeEvent) => {
    onSessionRoundTypeChange(e.target.value as ProgramRegistrationSessionRoundType)
  }

  const showParticipationMethod = !participantOrganization
  const showEducationFormParticipantSelectionRadio = shouldShowEducationFormParticipantSelectionRadio({
    participantOrganization,
    educationStructure: programType,
    sessionRound: sessionRoundType,
  })
  const perScheduleHint = typeSettingsPerScheduleHint({
    educationStructure: programType,
    sessionRound: sessionRoundType,
  })
  const educationFormSelectOptions = getProgramRegistrationEducationFormOptions(
    showEducationFormParticipantSelectionRadio ? false : participantOrganization
  )

  /** 일정 공통·단일 회차 교육 형태 → 신청 폼 「희망 교육 형태」 노출 연동 */
  useEffect(() => {
    if (sessionRoundType === 'multi' && educationFormScheduleDetail === 'perSchedule') {
      return
    }
    const form = sessionRoundType === 'multi' ? multiCommonEducationForm : singleEducationForm
    if (form === 'participant_selection') {
      patchInstitutionApplicationProgramBridge({
        showPreferredEducationForm: true,
      })
      return
    }
    // overlay reset 직후 기본값 online으로 false를 덮어쓰지 않는다
    if (Object.keys(getProgramRegistrationOverlayRecord()).length === 0) return
    patchInstitutionApplicationProgramBridge({
      showPreferredEducationForm: false,
    })
  }, [sessionRoundType, educationFormScheduleDetail, singleEducationForm, multiCommonEducationForm])

  /** 복수회차·일정 공통 — overlay 미기록만 단일 회차 값으로 시드. 사용자가 비운 값은 유지. */
  useEffect(() => {
    if (sessionRoundType !== 'multi' || educationFormScheduleDetail !== 'common') return
    if (
      getProgramRegistrationOverlayRecord()[
        'generalRegistration.typeSettings.multiCommonEducationForm'
      ] !== undefined
    ) {
      return
    }
    if (multiCommonEducationForm.trim()) return
    setMultiCommonEducationForm(singleEducationForm.trim() || 'online')
  }, [
    educationFormScheduleDetail,
    multiCommonEducationForm,
    sessionRoundType,
    setMultiCommonEducationForm,
    singleEducationForm,
  ])

  useEffect(() => {
    if (participantOrganization) return
    if (sessionRoundType !== 'multi' || participationScheduleDetail !== 'common') return
    if (
      getProgramRegistrationOverlayRecord()[
        'generalRegistration.typeSettings.multiCommonParticipation'
      ] !== undefined
    ) {
      return
    }
    if (multiCommonParticipation.trim()) return
    setMultiCommonParticipation(singleParticipation.trim() || 'individual')
  }, [
    multiCommonParticipation,
    participantOrganization,
    participationScheduleDetail,
    sessionRoundType,
    setMultiCommonParticipation,
    singleParticipation,
  ])

  return (
    <>
      <DetailInfoForm
        title="프로그램 유형 설정"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 진행 구조"
            edit={
              <CmsRadioGroup
                size="medium"
                value={programType}
                onChange={e => onProgramTypeChange(e.target.value as ProgramRegistrationType)}
              >
                <CmsRadio size="medium" value="curriculum">커리큘럼형</CmsRadio>
                <CmsRadio size="medium" value="schedule">일정형</CmsRadio>
              </CmsRadioGroup>
            }
            view={programType === 'curriculum' ? '커리큘럼형' : '일정형'}
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            edit={
              <CmsRadioGroup
                size="medium"
                value={sessionRoundType}
                onChange={handleSessionRoundChange}
              >
                <CmsRadio size="medium" value="single">단일 회차</CmsRadio>
                <CmsRadio size="medium" value="multi">복수 회차</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title={
          showParticipationMethod
            ? '교육 형태, 참여 방식, IPS 유형 설정'
            : '교육 형태, IPS 유형 설정'
        }
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        {sessionRoundType === 'multi' ? (
          <>
            {showEducationFormParticipantSelectionRadio ? (
              <EducationFormTypeSettingsRadioRow
                mode={resolveEducationFormTypeSettingsMode({
                  educationFormScheduleDetail,
                  educationForm: multiCommonEducationForm,
                })}
                onModeChange={next => {
                  const applied = applyEducationFormTypeSettingsModeChange({
                    next,
                    currentForm: multiCommonEducationForm,
                  })
                  onEducationFormScheduleDetailChange(applied.educationFormScheduleDetail)
                  setMultiCommonEducationForm(applied.educationForm)
                }}
                perScheduleHint={perScheduleHint}
                commonDetailEdit={
                  <CmsSelect
                    inputSize="small"
                    withAllOption={false}
                    placeholder="교육 형태"
                    width={160}
                    options={educationFormSelectOptions}
                    value={multiCommonEducationForm || undefined}
                    onChange={v => setMultiCommonEducationForm(String(v ?? ''))}
                  />
                }
              />
            ) : (
              <ScheduleDetailRadioRow
                label="교육 형태"
                validationKey="typeSettings.multiCommonEducationForm"
                value={educationFormScheduleDetail}
                onChange={onEducationFormScheduleDetailChange}
                perScheduleHint={perScheduleHint}
                commonDetailEdit={
                  <CmsSelect
                    inputSize="small"
                    withAllOption={false}
                    placeholder="교육 형태"
                    width={160}
                    options={educationFormSelectOptions}
                    value={multiCommonEducationForm || undefined}
                    onChange={v => setMultiCommonEducationForm(String(v ?? ''))}
                  />
                }
              />
            )}
            {showParticipationMethod ? (
              <ScheduleDetailRadioRow
                label="참여 방식"
                validationKey="typeSettings.multiCommonParticipation"
                value={participationScheduleDetail}
                onChange={onParticipationScheduleDetailChange}
                perScheduleHint={perScheduleHint}
                disabled={participationMethodLocked}
                commonDetailEdit={
                  <CmsSelect
                    inputSize="small"
                    withAllOption={false}
                    placeholder="참여 방식"
                    width={160}
                    disabled={participationMethodLocked}
                    options={[...PROGRAM_REGISTRATION_MULTI_COMMON_PARTICIPATION_OPTIONS]}
                    value={multiCommonParticipation || undefined}
                    onChange={v => setMultiCommonParticipation(String(v ?? ''))}
                  />
                }
              />
            ) : null}
            <ScheduleDetailRadioRow
              label="IPS 유형"
              validationKey="typeSettings.ipsType"
              value={ipsScheduleDetail}
              onChange={onIpsScheduleDetailChange}
              perScheduleHint={perScheduleHint}
              commonDetailEdit={
                <ProgramRegistrationIpsTypeFields value={ipsType} onChange={setIpsType} />
              }
            />
          </>
        ) : (
          <>
            <DetailInfoForm.Row type={showParticipationMethod ? 'double' : 'single'}>
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow={!showParticipationMethod}
                edit={
                  <CmsRadioGroup
                    size="medium"
                    value={singleEducationForm}
                    onChange={e => setSingleEducationForm(String(e.target.value))}
                  >
                    {getProgramRegistrationEducationFormOptions(participantOrganization).map(
                      opt => (
                        <CmsRadio size="medium" key={opt.value} value={opt.value}>
                          {opt.label}
                        </CmsRadio>
                      )
                    )}
                  </CmsRadioGroup>
                }
                view="-"
              />
              {showParticipationMethod ? (
                <DetailInfoForm.Field
                  label="참여 방식"
                  edit={
                    <CmsRadioGroup
                      size="medium"
                      value={singleParticipation}
                      disabled={participationMethodLocked}
                      onChange={e => setSingleParticipation(String(e.target.value))}
                    >
                      <CmsRadio size="medium" value="individual">개인</CmsRadio>
                      <CmsRadio size="medium" value="team">팀</CmsRadio>
                    </CmsRadioGroup>
                  }
                  view="-"
                />
              ) : null}
            </DetailInfoForm.Row>
            <ScheduleDetailRadioRow
              label="IPS 유형"
              validationKey="typeSettings.ipsType"
              value={ipsScheduleDetail}
              onChange={onIpsScheduleDetailChange}
              perScheduleHint={perScheduleHint}
              commonDetailEdit={
                <ProgramRegistrationIpsTypeFields value={ipsType} onChange={setIpsType} />
              }
            />
          </>
        )}
        {showEducationPlaceRow ? (
          <ScheduleDetailRadioRow
            label={EDUCATION_PLACE_LABEL}
            validationKey="typeSettings.educationPlace"
            value={educationPlaceScheduleDetail}
            onChange={setEducationPlaceScheduleDetail}
            perScheduleHint={perScheduleHint}
            commonDetailEdit={
              <ProgramRegistrationEducationPlaceInput
                value={educationPlaceAddress}
                onChange={setEducationPlaceAddress}
              />
            }
          />
        ) : null}
      </DetailInfoForm>
    </>
  )
}

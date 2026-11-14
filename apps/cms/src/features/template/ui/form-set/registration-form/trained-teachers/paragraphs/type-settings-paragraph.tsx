import { type ReactNode, useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { RadioChangeEvent } from 'antd'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import {
  readTrainedTeachersRegistrationRecordValue,
  useTrainedTeachersRegistrationField,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/trained-teachers-registration-form-rhf'
import { TYPE_SETTINGS_PER_SCHEDULE_HINT } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const EMPTY_IPS_TYPE: ProgramRegistrationIpsTypeValue = {
  category: '',
  detail: '',
}

type TrainedTeachersRegistrationTypeSettingsParagraphProps = {
  programType: ProgramRegistrationType
  onProgramTypeChange: (value: ProgramRegistrationType) => void
  sessionRoundType: ProgramRegistrationSessionRoundType
  onSessionRoundTypeChange: (value: ProgramRegistrationSessionRoundType) => void
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  onEducationFormScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  onIpsScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
}

function ScheduleDetailRadioRow({
  label,
  value,
  onChange,
  commonDetailEdit,
  validationKey,
}: {
  label: string
  value: ProgramRegistrationScheduleDetailKind
  onChange: (value: ProgramRegistrationScheduleDetailKind) => void
  commonDetailEdit?: ReactNode
  validationKey?: string
}) {
  // 템플릿 관리 시안(5767:196354): 「일정 공통」「일정 별 상이」 모두 미선택으로 시작하고
  // 일정 공통 입력칸(IPS 셀렉트)은 그대로 보인다. 사용자가 고르면 선택값을 보인다. 등록·상세는 기존 동작.
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [touched, setTouched] = useState(false)
  const radioValue = isTemplateManagementScreen && !touched ? '' : value
  const handleChange = (e: RadioChangeEvent) => {
    setTouched(true)
    onChange(e.target.value as ProgramRegistrationScheduleDetailKind)
  }

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        validationKey={validationKey}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <CmsRadioGroup size="medium" value={radioValue} onChange={handleChange}>
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
                  {TYPE_SETTINGS_PER_SCHEDULE_HINT.byRound}
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

export function TrainedTeachersRegistrationTypeSettingsParagraph({
  programType,
  onProgramTypeChange,
  sessionRoundType,
  onSessionRoundTypeChange,
  educationFormScheduleDetail,
  onEducationFormScheduleDetailChange,
  ipsScheduleDetail,
  onIpsScheduleDetailChange,
}: TrainedTeachersRegistrationTypeSettingsParagraphProps) {
  // 템플릿 관리 시안(5767:196354): 수업 회차 유형·교육 형태 라디오는 미선택으로 시작한다.
  // 교육 진행 구조·수업 회차 유형은 편집기 상태(기본 커리큘럼형·단일 회차)로 블록을 그리므로 고르기 전까지 표시만 비운다.
  // 교육 진행 구조 「커리큘럼형」은 시안에선 선택 상태지만 템플릿 관리 라디오는 모두 미선택(사용자 결정 2026-11-13).
  // 등록 위저드·상세는 기존 동작.
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [programTypeTouched, setProgramTypeTouched] = useState(false)
  const programTypeRadioValue =
    isTemplateManagementScreen && !programTypeTouched && programType === 'curriculum'
      ? ''
      : programType
  const [sessionRoundTouched, setSessionRoundTouched] = useState(false)
  const sessionRoundRadioValue =
    isTemplateManagementScreen && !sessionRoundTouched && sessionRoundType === 'single'
      ? ''
      : sessionRoundType
  const defaultEducationForm = isTemplateManagementScreen ? '' : 'online'
  const [educationForm, setEducationForm] = useTrainedTeachersRegistrationField(
    'trainedTeachersRegistration.typeSettings.educationForm',
    defaultEducationForm
  )
  const [multiCommonEducationForm, setMultiCommonEducationForm] = useTrainedTeachersRegistrationField(
    'trainedTeachersRegistration.typeSettings.multiCommonEducationForm',
    defaultEducationForm
  )
  const [ipsType, setIpsType] = useTrainedTeachersRegistrationField<ProgramRegistrationIpsTypeValue>(
    'trainedTeachersRegistration.typeSettings.ipsType',
    EMPTY_IPS_TYPE
  )

  const educationFormOptions = getProgramRegistrationEducationFormOptions(true)

  /** 일반과 동일 — 교육 형태 「참여자 선택」일 때만 신청 폼 「희망 교육 형태」 노출 */
  useEffect(() => {
    if (sessionRoundType === 'multi' && educationFormScheduleDetail === 'perSchedule') {
      patchInstitutionApplicationProgramBridge({ showPreferredEducationForm: false })
      return
    }
    const form = sessionRoundType === 'multi' ? multiCommonEducationForm : educationForm
    patchInstitutionApplicationProgramBridge({
      showPreferredEducationForm: form === 'participant_selection',
    })
  }, [
    sessionRoundType,
    educationFormScheduleDetail,
    educationForm,
    multiCommonEducationForm,
  ])

  useEffect(() => {
    // 템플릿 관리: 미선택 초기값을 유지한다(단일 회차 값으로 시드하지 않음)
    if (isTemplateManagementScreen) return
    if (sessionRoundType !== 'multi' || educationFormScheduleDetail !== 'common') return
    if (
      readTrainedTeachersRegistrationRecordValue(
        'trainedTeachersRegistration.typeSettings.multiCommonEducationForm'
      ) !== undefined
    ) {
      return
    }
    if (multiCommonEducationForm.trim()) return
    setMultiCommonEducationForm(educationForm.trim() || 'online')
  }, [
    educationForm,
    educationFormScheduleDetail,
    isTemplateManagementScreen,
    multiCommonEducationForm,
    sessionRoundType,
    setMultiCommonEducationForm,
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
                value={programTypeRadioValue}
                onChange={e => {
                  setProgramTypeTouched(true)
                  onProgramTypeChange(e.target.value as ProgramRegistrationType)
                }}
              >
                <CmsRadio size="medium" value="curriculum">커리큘럼형</CmsRadio>
                {/* 신규 등록은 커리큘럼형 고정 — 시안 9899:221372 「일정형」 비활성 (CMS-FUNC-0591) */}
                <CmsRadio size="medium" value="schedule" disabled>
                  일정형
                </CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            edit={
              <CmsRadioGroup
                size="medium"
                value={sessionRoundRadioValue}
                onChange={e => {
                  setSessionRoundTouched(true)
                  onSessionRoundTypeChange(e.target.value as ProgramRegistrationSessionRoundType)
                }}
              >
                <CmsRadio size="medium" value="single">단일 회차</CmsRadio>
                <CmsRadio size="medium" value="multi">복수 회차</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="" hideHeader mode="edit" className="program-registration-paragraph">
        {sessionRoundType === 'multi' ? (
          <>
            <ScheduleDetailRadioRow
              label="교육 형태"
              validationKey="typeSettings.multiCommonEducationForm"
              value={educationFormScheduleDetail}
              onChange={onEducationFormScheduleDetailChange}
              commonDetailEdit={
                <CmsSelect
                  inputSize="small"
                  withAllOption={false}
                  placeholder="교육 형태"
                  width={160}
                  options={educationFormOptions}
                  value={multiCommonEducationForm || undefined}
                  onChange={v => setMultiCommonEducationForm(String(v ?? ''))}
                />
              }
            />
            <ScheduleDetailRadioRow
              label="IPS 유형"
              validationKey="typeSettings.ipsType"
              value={ipsScheduleDetail}
              onChange={onIpsScheduleDetailChange}
              commonDetailEdit={
                <ProgramRegistrationIpsTypeFields value={ipsType} onChange={setIpsType} />
              }
            />
          </>
        ) : (
          <>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow
                edit={
                  <CmsRadioGroup
                    size="medium"
                    value={educationForm || undefined}
                    onChange={e => setEducationForm(String(e.target.value))}
                  >
                    {educationFormOptions.map(option => (
                      <CmsRadio size="medium" key={option.value} value={option.value}>
                        {option.label}
                      </CmsRadio>
                    ))}
                  </CmsRadioGroup>
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <ScheduleDetailRadioRow
              label="IPS 유형"
              validationKey="typeSettings.ipsType"
              value={ipsScheduleDetail}
              onChange={onIpsScheduleDetailChange}
              commonDetailEdit={
                <ProgramRegistrationIpsTypeFields value={ipsType} onChange={setIpsType} />
              }
            />
          </>
        )}
      </DetailInfoForm>
    </>
  )
}

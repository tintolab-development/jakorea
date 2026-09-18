import { type ReactNode, useEffect } from 'react'
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
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { TYPE_SETTINGS_PER_SCHEDULE_HINT } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
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
}: {
  label: string
  value: ProgramRegistrationScheduleDetailKind
  onChange: (value: ProgramRegistrationScheduleDetailKind) => void
  commonDetailEdit?: ReactNode
}) {
  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value as ProgramRegistrationScheduleDetailKind)
  }

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <CmsRadioGroup size="large" value={value} onChange={handleChange}>
              <CmsRadio value="common">일정 공통</CmsRadio>
              <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
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
  const [educationForm, setEducationForm] = useProgramRegistrationOverlayKv(
    'trainedTeachersRegistration.typeSettings.educationForm',
    'online'
  )
  const [multiCommonEducationForm, setMultiCommonEducationForm] = useProgramRegistrationOverlayKv(
    'trainedTeachersRegistration.typeSettings.multiCommonEducationForm',
    ''
  )
  const [ipsType, setIpsType] = useProgramRegistrationOverlayKv<ProgramRegistrationIpsTypeValue>(
    'trainedTeachersRegistration.typeSettings.ipsType',
    EMPTY_IPS_TYPE
  )

  const educationFormOptions = getProgramRegistrationEducationFormOptions(true)

  /** 일반과 동일 — 교육 형태 「참여자 선택」일 때만 신청 폼 「희망 교육 형태」 노출 */
  useEffect(() => {
    if (sessionRoundType === 'multi' && educationFormScheduleDetail === 'perSchedule') {
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
                size="large"
                value={programType}
                onChange={e => onProgramTypeChange(e.target.value as ProgramRegistrationType)}
              >
                <CmsRadio value="curriculum">커리큘럼형</CmsRadio>
                <CmsRadio value="schedule">일정형</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            edit={
              <CmsRadioGroup
                size="large"
                value={sessionRoundType}
                onChange={e =>
                  onSessionRoundTypeChange(e.target.value as ProgramRegistrationSessionRoundType)
                }
              >
                <CmsRadio value="single">단일 회차</CmsRadio>
                <CmsRadio value="multi">복수 회차</CmsRadio>
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
              value={educationFormScheduleDetail}
              onChange={onEducationFormScheduleDetailChange}
              commonDetailEdit={
                <CmsSelect
                  inputSize="medium"
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
                    size="large"
                    value={educationForm}
                    onChange={e => setEducationForm(String(e.target.value))}
                  >
                    {educationFormOptions.map(option => (
                      <CmsRadio key={option.value} value={option.value}>
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

import { useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/program-registration-form/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { RadioChangeEvent } from 'antd'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from './program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from './program-registration-education-form-options'
import './program-registration-paragraph.css'

const PROGRAM_REGISTRATION_MULTI_COMMON_PARTICIPATION_OPTIONS = [
  { value: 'individual', label: '개인' },
  { value: 'team', label: '팀' },
] as const

type ProgramRegistrationTypeSettingsParagraphProps = {
  programType: ProgramRegistrationType
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
  /** `일정 공통`일 때 라디오 오른쪽에 노출 (스크린샷: 구분선 + CmsSelect 등) */
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
                  교육 일정 항목에서 차시 별로 입력해 주세요
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
  participantOrganization,
  sessionRoundType,
  onSessionRoundTypeChange,
  educationFormScheduleDetail,
  onEducationFormScheduleDetailChange,
  participationScheduleDetail,
  onParticipationScheduleDetailChange,
  ipsScheduleDetail,
  onIpsScheduleDetailChange,
}: ProgramRegistrationTypeSettingsParagraphProps) {
  const [ipsType, setIpsType] = useState<ProgramRegistrationIpsTypeValue>({
    category: '',
    detail: '',
  })
  const [multiCommonEducationForm, setMultiCommonEducationForm] = useState<string>('')
  const [multiCommonParticipation, setMultiCommonParticipation] = useState<string>('')
  /** 단일 회차 — 교육 형태·참여 방식 (교육 진행 구조는 별도 고정) */
  const [singleEducationForm, setSingleEducationForm] = useState('online')
  const [singleParticipation, setSingleParticipation] = useState('individual')

  const handleSessionRoundChange = (e: RadioChangeEvent) => {
    onSessionRoundTypeChange(e.target.value as ProgramRegistrationSessionRoundType)
  }

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
              <CmsRadioGroup size="large" value={programType}>
                <CmsRadio value="curriculum">커리큘럼형</CmsRadio>
                <CmsRadio value="schedule" disabled>
                  일정형
                </CmsRadio>
              </CmsRadioGroup>
            }
            view={programType === 'curriculum' ? '커리큘럼형' : '일정형'}
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            edit={
              <CmsRadioGroup
                size="large"
                value={sessionRoundType}
                onChange={handleSessionRoundChange}
              >
                <CmsRadio value="single">단일 회차</CmsRadio>
                <CmsRadio value="multi">복수 회차</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="교육 형태, 참여 방식, IPS 유형 설정"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
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
                  options={getProgramRegistrationEducationFormOptions(participantOrganization)}
                  value={multiCommonEducationForm || undefined}
                  onChange={v => setMultiCommonEducationForm(String(v ?? ''))}
                />
              }
            />
            <ScheduleDetailRadioRow
              label="참여 방식"
              value={participationScheduleDetail}
              onChange={onParticipationScheduleDetailChange}
              commonDetailEdit={
                <CmsSelect
                  inputSize="medium"
                  withAllOption={false}
                  placeholder="참여 방식"
                  width={160}
                  options={[...PROGRAM_REGISTRATION_MULTI_COMMON_PARTICIPATION_OPTIONS]}
                  value={multiCommonParticipation || undefined}
                  onChange={v => setMultiCommonParticipation(String(v ?? ''))}
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
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교육 형태"
                edit={
                  <CmsRadioGroup
                    size="large"
                    value={singleEducationForm}
                    onChange={e => setSingleEducationForm(String(e.target.value))}
                  >
                    {getProgramRegistrationEducationFormOptions(participantOrganization).map(opt => (
                      <CmsRadio key={opt.value} value={opt.value}>
                        {opt.label}
                      </CmsRadio>
                    ))}
                  </CmsRadioGroup>
                }
                view="-"
              />
              <DetailInfoForm.Field
                label="참여 방식"
                edit={
                  <CmsRadioGroup
                    size="large"
                    value={singleParticipation}
                    onChange={e => setSingleParticipation(String(e.target.value))}
                  >
                    <CmsRadio value="individual">개인</CmsRadio>
                    <CmsRadio value="team">팀</CmsRadio>
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

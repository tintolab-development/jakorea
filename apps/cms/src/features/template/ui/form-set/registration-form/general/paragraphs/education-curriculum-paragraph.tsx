import { Fragment, useState } from 'react'
import type { RadioChangeEvent } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from './program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from './program-registration-education-form-options'
import './program-registration-paragraph.css'

/** 복수 회차 — `n`회차 수업 > 진행 차시 (1~16차시) */
const PROGRAM_REGISTRATION_PROGRESS_SESSION_SELECT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const k = i + 1
  return { value: String(k), label: `${k}차시` }
})

type ProgramRegistrationEducationCurriculumParagraphProps = {
  sessionRoundType: ProgramRegistrationSessionRoundType
  /** 참여자 유형 학교/기관 — 교육 형태에 「참여자 선택」 포함 */
  participantOrganization: boolean
  curriculumSessionCount: number
  /** 단일 회차 + IPS 일정 별 상이 — 차시 블록 개수 (그 외에는 무시) */
  curriculumChartSessionCount: number
  /** 복수 회차 시 `type-settings`의 일정 공통·별 상이 (단일 회차 UI에서는 미사용) */
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
}

type ProgramRegistrationCurriculumMultiSessionRowPlan =
  | 'c_allCommon_piAllCommon'
  /** 교육 공통 + (참여·IPS 중 하나라도 일정 별 상이) — IPS만 별·둘 다 별 동일 플랜 */
  | 'c_allCommon_piBothPer'
  | 'c_allCommon_piPartPerOnly'
  | 'p_eduPer_piAllCommon'
  | 'p_eduPer_piAnyPer'

/** IPS 일정 별 상이 + 교육·참여 모두 일정 공통 — 커리큘럼·일정형에서 참여 방식 행 미노출 */
export function shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind,
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind,
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
): boolean {
  return (
    ipsScheduleDetail === 'perSchedule' &&
    educationFormScheduleDetail === 'common' &&
    participationScheduleDetail === 'common'
  )
}

export function getProgramRegistrationCurriculumMultiSessionRowPlan(
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind,
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind,
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
): ProgramRegistrationCurriculumMultiSessionRowPlan {
  const eduC = educationFormScheduleDetail === 'common'
  const partC = participationScheduleDetail === 'common'
  const ipsC = ipsScheduleDetail === 'common'

  if (eduC) {
    if (partC && ipsC) return 'c_allCommon_piAllCommon'
    if (!partC && ipsC) return 'c_allCommon_piPartPerOnly'
    /* 참여·IPS 일정 별: 둘 다 별이거나, 참여 공통+IPS만 별 → 커리큘럼 동일(c_allCommon_piBothPer) */
    if (!partC || !ipsC) return 'c_allCommon_piBothPer'
  }
  if (partC && ipsC) return 'p_eduPer_piAllCommon'
  return 'p_eduPer_piAnyPer'
}

export function ProgramRegistrationEducationCurriculumParagraph({
  sessionRoundType,
  participantOrganization,
  curriculumSessionCount,
  curriculumChartSessionCount,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
}: ProgramRegistrationEducationCurriculumParagraphProps) {
  const [ipsBySession, setIpsBySession] = useState<Record<number, ProgramRegistrationIpsTypeValue>>(
    {}
  )
  const [progressSessionByRound, setProgressSessionByRound] = useState<Record<number, string>>({})
  const [educationFormBySession, setEducationFormBySession] = useState<Record<number, string>>({})
  const [participationBySession, setParticipationBySession] = useState<Record<number, string>>({})

  const educationFormForSession = (sessionIndex: number) =>
    educationFormBySession[sessionIndex] ?? 'online'
  const participationForSession = (sessionIndex: number) =>
    participationBySession[sessionIndex] ?? 'individual'

  const onEducationFormRadioChange =
    (sessionIndex: number) => (e: RadioChangeEvent) => {
      setEducationFormBySession(prev => ({ ...prev, [sessionIndex]: String(e.target.value) }))
    }

  const onParticipationRadioChange = (sessionIndex: number) => (e: RadioChangeEvent) => {
    setParticipationBySession(prev => ({ ...prev, [sessionIndex]: String(e.target.value) }))
  }

  const setSessionIps = (sessionIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    setIpsBySession(prev => ({ ...prev, [sessionIndex]: next }))
  }

  if (sessionRoundType === 'single') {
    const isSingleIpsPerChart = ipsScheduleDetail === 'perSchedule'

    if (isSingleIpsPerChart) {
      return (
        <>
          {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
            const chartIndex = i + 1
            const ipsValue = ipsBySession[chartIndex] ?? { category: '', detail: '' }
            return (
              <Fragment key={chartIndex}>
                <div className="program-registration-curriculum__session-heading">
                  ■ {chartIndex}차시
                </div>
                <DetailInfoForm
                  title="교육 진행 (커리큘럼)"
                  hideHeader
                  mode="edit"
                  className="program-registration-paragraph"
                >
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label={`단원명 및 교육내용`}
                      fullRow
                      edit={
                        <div className="detail-info-form-inputs-wrapper">
                          <CmsInput
                            inputSize="medium"
                            placeholder="단원명을 입력해주세요"
                            width="100%"
                            style={{ minWidth: 0, flex: '1 1 0' }}
                          />
                          <DetailInfoForm.InputsSeparator />
                          <CmsInput
                            inputSize="medium"
                            placeholder="교육 내용을 작성하세요"
                            width="100%"
                            style={{ minWidth: 0, flex: '1 1 0' }}
                          />
                        </div>
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      fullRow
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          value={ipsValue}
                          onChange={(next: ProgramRegistrationIpsTypeValue) =>
                            setSessionIps(chartIndex, next)
                          }
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
              </Fragment>
            )
          })}
        </>
      )
    }

    return (
      <DetailInfoForm
        title="교육 진행 (커리큘럼)"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
          const chartIndex = i + 1
          return (
            <DetailInfoForm.Row key={chartIndex} type="double">
              <DetailInfoForm.Field
                label={`${chartIndex}차시 단원명`}
                edit={
                  <CmsInput inputSize="medium" placeholder="단원명을 입력해주세요" width="100%" />
                }
                view="-"
              />
              <DetailInfoForm.Field
                label={`${chartIndex}차시 교육 내용`}
                edit={
                  <CmsInput
                    inputSize="medium"
                    placeholder="교육 내용을 입력해주세요"
                    width="100%"
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
          )
        })}
      </DetailInfoForm>
    )
  }

  const multiRowPlan = getProgramRegistrationCurriculumMultiSessionRowPlan(
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail
  )

  if (multiRowPlan === 'c_allCommon_piAllCommon') {
    return (
      <DetailInfoForm title="교육 진행 (커리큘럼)*" hideHeader mode="edit">
        {Array.from({ length: curriculumSessionCount }, (_, i) => {
          const n = i + 1
          const progressSession = progressSessionByRound[n] ?? ''
          return (
            <DetailInfoForm.Row key={n} type="single">
              <DetailInfoForm.Field
                label={`${n}회차 수업`}
                fullRow
                edit={
                  <div className="detail-info-form-inputs-wrapper">
                    <CmsSelect
                      inputSize="medium"
                      withAllOption={false}
                      placeholder="진행 차시"
                      width={120}
                      options={PROGRAM_REGISTRATION_PROGRESS_SESSION_SELECT_OPTIONS}
                      value={progressSession || undefined}
                      onChange={v =>
                        setProgressSessionByRound(prev => ({
                          ...prev,
                          [n]: String(v ?? ''),
                        }))
                      }
                    />
                    <DetailInfoForm.InputsSeparator />
                    <CmsInput
                      inputSize="medium"
                      placeholder="교육 내용을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                    />
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
          )
        })}
      </DetailInfoForm>
    )
  }

  return (
    <>
      {Array.from({ length: curriculumSessionCount }, (_, i) => {
        const n = i + 1
        const ipsValue = ipsBySession[n] ?? { category: '', detail: '' }
        const progressSession = progressSessionByRound[n] ?? ''
        return (
          <Fragment key={n}>
            <div className="program-registration-curriculum__session-heading">■ {n}회차</div>
            <DetailInfoForm title="교육 진행 (커리큘럼)" hideHeader mode="edit">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={`${n}회차 수업`}
                  fullRow
                  edit={
                    <div className="detail-info-form-inputs-wrapper">
                      <CmsSelect
                        inputSize="medium"
                        withAllOption={false}
                        placeholder="진행 차시"
                        width={120}
                        options={PROGRAM_REGISTRATION_PROGRESS_SESSION_SELECT_OPTIONS}
                        value={progressSession || undefined}
                        onChange={v =>
                          setProgressSessionByRound(prev => ({
                            ...prev,
                            [n]: String(v ?? ''),
                          }))
                        }
                      />
                      <DetailInfoForm.InputsSeparator />
                      <CmsInput
                        inputSize="medium"
                        placeholder="교육 내용을 작성하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    </div>
                  }
                  view="-"
                />
              </DetailInfoForm.Row>
              {multiRowPlan === 'c_allCommon_piBothPer' ? (
                <>
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      fullRow
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          value={ipsValue}
                          onChange={(next: ProgramRegistrationIpsTypeValue) =>
                            setSessionIps(n, next)
                          }
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  {shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
                    educationFormScheduleDetail,
                    participationScheduleDetail,
                    ipsScheduleDetail
                  ) ? null : (
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="참여 방식"
                        edit={
                          <CmsRadioGroup
                            size="large"
                            value={participationForSession(n)}
                            onChange={onParticipationRadioChange(n)}
                          >
                            <CmsRadio value="individual">개인</CmsRadio>
                            <CmsRadio value="team">팀</CmsRadio>
                          </CmsRadioGroup>
                        }
                        view="-"
                      />
                    </DetailInfoForm.Row>
                  )}
                </>
              ) : multiRowPlan === 'c_allCommon_piPartPerOnly' ? (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="참여 방식"
                    edit={
                      <CmsRadioGroup
                        size="large"
                        value={participationForSession(n)}
                        onChange={onParticipationRadioChange(n)}
                      >
                        <CmsRadio value="individual">개인</CmsRadio>
                        <CmsRadio value="team">팀</CmsRadio>
                      </CmsRadioGroup>
                    }
                    view="-"
                  />
                </DetailInfoForm.Row>
              ) : multiRowPlan === 'p_eduPer_piAllCommon' ? (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="교육 형태"
                    edit={
                      <CmsRadioGroup
                        size="large"
                        value={educationFormForSession(n)}
                        onChange={onEducationFormRadioChange(n)}
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
                </DetailInfoForm.Row>
              ) : multiRowPlan === 'p_eduPer_piAnyPer' ? (
                <>
                  {ipsScheduleDetail === 'perSchedule' ? (
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="IPS 유형"
                        fullRow
                        edit={
                          <ProgramRegistrationIpsTypeFields
                            value={ipsValue}
                            onChange={(next: ProgramRegistrationIpsTypeValue) =>
                              setSessionIps(n, next)
                            }
                          />
                        }
                        view="-"
                      />
                    </DetailInfoForm.Row>
                  ) : null}
                  {participationScheduleDetail === 'perSchedule' ? (
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="교육 형태"
                        edit={
                          <CmsRadioGroup
                            size="large"
                            value={educationFormForSession(n)}
                            onChange={onEducationFormRadioChange(n)}
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
                            value={participationForSession(n)}
                            onChange={onParticipationRadioChange(n)}
                          >
                            <CmsRadio value="individual">개인</CmsRadio>
                            <CmsRadio value="team">팀</CmsRadio>
                          </CmsRadioGroup>
                        }
                        view="-"
                      />
                    </DetailInfoForm.Row>
                  ) : (
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="교육 형태"
                        edit={
                          <CmsRadioGroup
                            size="large"
                            value={educationFormForSession(n)}
                            onChange={onEducationFormRadioChange(n)}
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
                    </DetailInfoForm.Row>
                  )}
                </>
              ) : null}
            </DetailInfoForm>
          </Fragment>
        )
      })}
    </>
  )
}

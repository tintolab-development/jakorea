import { Fragment, useState } from 'react'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import {
  getProgramRegistrationCurriculumMultiSessionRowPlan,
  shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-curriculum-paragraph'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import './program-registration-paragraph.css'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function groupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

function isScheduleMultiAllPerSchedule(
  sessionRoundType: ProgramRegistrationSessionRoundType,
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind,
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind,
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
): boolean {
  return (
    sessionRoundType === 'multi' &&
    educationFormScheduleDetail === 'perSchedule' &&
    participationScheduleDetail === 'perSchedule' &&
    ipsScheduleDetail === 'perSchedule'
  )
}

function ScheduleCurriculumGroupTimeRow({
  groupLetter,
  showGroupLabel,
  value,
  onChange,
  onDelete,
}: {
  groupLetter: string
  showGroupLabel: boolean
  value: Dayjs | null
  onChange: (value: Dayjs | null) => void
  onDelete?: () => void
}) {
  return (
    <div className="program-registration-schedule-curriculum__time-group">
      {showGroupLabel ? `그룹 ${groupLetter}` : null}
      <div className="program-registration-schedule-curriculum__time-group-control">
        <ParagraphTimePicker value={value} onChange={onChange} placeholder="시간 선택" width={200} />
        {onDelete ? (
          <ItemDeleteButton
            className="item-delete-button"
            aria-label={`그룹 ${groupLetter} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onDelete()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

const IPS_PREPARE_NONE_VALUE: ProgramRegistrationIpsTypeValue = {
  category: 'prepare',
  detail: 'none',
}

export type ProgramRegistrationEducationScheduleCurriculumParagraphProps = {
  scheduleDetailCount: number
  scheduleGroupCount: number
  onDeleteScheduleCurriculumGroup: (groupIndex: number) => void
  /** 프로그램 유형 설정에서 IPS 유형이「일정 별 상이」일 때만 (단일·일부 복수 조합) 세부 일정 하단에 IPS 행 */
  ipsPerSchedule?: boolean
  sessionRoundType: ProgramRegistrationSessionRoundType
  participantOrganization: boolean
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  /** 복수 + IPS 일정 별 상이 시 카드 헤더「사전 교육」ON이면 IPS 유형을 Prepare / 해당 없음으로 고정·비활성 */
  scheduleCurriculumPreEducation?: boolean
}

export function ProgramRegistrationEducationScheduleCurriculumParagraph({
  scheduleDetailCount,
  scheduleGroupCount,
  onDeleteScheduleCurriculumGroup,
  ipsPerSchedule = false,
  sessionRoundType,
  participantOrganization,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
  scheduleCurriculumPreEducation = false,
}: ProgramRegistrationEducationScheduleCurriculumParagraphProps) {
  const detailCount = Math.max(1, scheduleDetailCount)
  const groupCount = Math.min(
    Math.max(1, scheduleGroupCount),
    PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
  )
  const multiAllPer = isScheduleMultiAllPerSchedule(
    sessionRoundType,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail
  )

  const [ipsByDetailIndex, setIpsByDetailIndex] = useState<
    Record<number, ProgramRegistrationIpsTypeValue>
  >({})
  const [scheduleDateByDetail, setScheduleDateByDetail] = useState<Record<number, Dayjs | null>>({})
  const [groupTimeByDetail, setGroupTimeByDetail] = useState<Record<number, Array<Dayjs | null>>>(
    {}
  )
  const [educationFormByDetail, setEducationFormByDetail] = useState<Record<number, string>>({})
  const [participationByDetail, setParticipationByDetail] = useState<Record<number, string>>({})

  const setIpsForDetail = (detailIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    setIpsByDetailIndex(prev => ({ ...prev, [detailIndex]: next }))
  }

  const ipsLockedForSchedulePreEducation =
    sessionRoundType === 'multi' &&
    ipsScheduleDetail === 'perSchedule' &&
    scheduleCurriculumPreEducation

  const ipsTypeValueForDetail = (detailIndex: number): ProgramRegistrationIpsTypeValue =>
    ipsLockedForSchedulePreEducation
      ? IPS_PREPARE_NONE_VALUE
      : (ipsByDetailIndex[detailIndex] ?? { category: '', detail: '' })

  const setIpsForDetailUnlessLocked = (detailIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    if (ipsLockedForSchedulePreEducation) return
    setIpsForDetail(detailIndex, next)
  }

  const educationFormForDetail = (detailIndex: number) =>
    educationFormByDetail[detailIndex] ?? 'online'
  const participationForDetail = (detailIndex: number) =>
    participationByDetail[detailIndex] ?? 'individual'

  const onEducationFormRadioChange = (detailIndex: number) => (e: RadioChangeEvent) => {
    setEducationFormByDetail(prev => ({ ...prev, [detailIndex]: String(e.target.value) }))
  }

  const onParticipationRadioChange = (detailIndex: number) => (e: RadioChangeEvent) => {
    setParticipationByDetail(prev => ({ ...prev, [detailIndex]: String(e.target.value) }))
  }

  const groupTimeValue = (detailIndex: number, groupIndex: number) =>
    groupTimeByDetail[detailIndex]?.[groupIndex] ?? null

  const setGroupTime = (detailIndex: number, groupIndex: number, value: Dayjs | null) => {
    setGroupTimeByDetail(prev => {
      const nextValues = [...(prev[detailIndex] ?? [])]
      nextValues[groupIndex] = value
      return { ...prev, [detailIndex]: nextValues }
    })
  }

  const deleteScheduleGroup = (groupIndex: number) => {
    setGroupTimeByDetail(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([detailIndex, values]) => [
          detailIndex,
          values.filter((_, index) => index !== groupIndex),
        ])
      )
    )
    onDeleteScheduleCurriculumGroup(groupIndex)
  }

  const multiRowPlan =
    sessionRoundType === 'multi'
      ? getProgramRegistrationCurriculumMultiSessionRowPlan(
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail
        )
      : null

  if (multiAllPer) {
    return (
      <>
        {Array.from({ length: detailCount }, (_, i) => {
          const n = i + 1
          const scheduleDate = scheduleDateByDetail[n] ?? null
          return (
            <div key={n} className="program-registration-schedule-curriculum__block">
              <div className="program-registration-schedule-curriculum__session-heading">
                ■ 행사 일정 {pad2(n)}
              </div>
              <div className="program-registration-schedule-curriculum__session-panel">
                <DetailInfoForm
                  title="교육 진행 (일정형)"
                  hideHeader
                  mode="edit"
                  className="program-registration-paragraph"
                >
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="일정명"
                      fullRow
                      edit={
                        <CmsInput
                          inputSize="medium"
                          placeholder="행사 일정명을 작성하세요"
                          width="100%"
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="진행 일정"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap">
                          <ParagraphDatePicker
                            mode="single"
                            presetMode="date"
                            customizable={false}
                            suppressAutoTodayWhenEmpty
                            value={scheduleDate}
                            onChange={next =>
                              setScheduleDateByDetail(prev => ({ ...prev, [n]: next }))
                            }
                            width="100%"
                            placeholder="일정을 선택하세요"
                          />
                        </div>
                      }
                      view="-"
                    />
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          value={ipsTypeValueForDetail(n)}
                          onChange={next => setIpsForDetailUnlessLocked(n, next)}
                          disabled={ipsLockedForSchedulePreEducation}
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="교육 형태"
                      edit={
                        <CmsRadioGroup
                          size="large"
                          value={educationFormForDetail(n)}
                          onChange={onEducationFormRadioChange(n)}
                        >
                          {getProgramRegistrationEducationFormOptions(participantOrganization).map(
                            opt => (
                              <CmsRadio key={opt.value} value={opt.value}>
                                {opt.label}
                              </CmsRadio>
                            )
                          )}
                        </CmsRadioGroup>
                      }
                      view="-"
                    />
                    <DetailInfoForm.Field
                      label="참여 방식"
                      edit={
                        <CmsRadioGroup
                          size="large"
                          value={participationForDetail(n)}
                          onChange={onParticipationRadioChange(n)}
                        >
                          <CmsRadio value="individual">개인</CmsRadio>
                          <CmsRadio value="team">팀</CmsRadio>
                        </CmsRadioGroup>
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
              </div>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <>
      {Array.from({ length: detailCount }, (_, i) => {
        const n = i + 1
        return (
          <div key={n} className="program-registration-schedule-curriculum__block">
            <div className="program-registration-schedule-curriculum__session-heading">
              ■ 세부 일정 {pad2(n)}
            </div>
            <div className="program-registration-schedule-curriculum__session-panel">
              <DetailInfoForm
                title="교육 진행 (일정형)"
                hideHeader
                mode="edit"
                className="program-registration-paragraph"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="일정명"
                    fullRow
                    edit={
                      <CmsInput
                        inputSize="medium"
                        placeholder="세부 일정명을 작성하세요"
                        width="100%"
                      />
                    }
                    view="-"
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="진행 시간"
                    fullRow
                    edit={
                      <div className="program-registration-schedule-curriculum__time-groups">
                        {Array.from({ length: groupCount }, (_, gi) => {
                          const letter = groupLetter(gi)
                          return (
                            <Fragment key={`${n}-${letter}`}>
                              {gi > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                              <ScheduleCurriculumGroupTimeRow
                                groupLetter={letter}
                                showGroupLabel={groupCount > 1}
                                value={groupTimeValue(n, gi)}
                                onChange={value => setGroupTime(n, gi, value)}
                                onDelete={gi > 0 ? () => deleteScheduleGroup(gi) : undefined}
                              />
                            </Fragment>
                          )
                        })}
                      </div>
                    }
                    view="-"
                  />
                </DetailInfoForm.Row>
                {ipsPerSchedule ? (
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      fullRow
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          value={ipsTypeValueForDetail(n)}
                          onChange={next => setIpsForDetailUnlessLocked(n, next)}
                          disabled={ipsLockedForSchedulePreEducation}
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                ) : null}
                {sessionRoundType === 'multi' && multiRowPlan != null ? (
                  <>
                    {multiRowPlan === 'c_allCommon_piBothPer' ? (
                      <>
                        {!ipsPerSchedule ? (
                          <DetailInfoForm.Row type="single">
                            <DetailInfoForm.Field
                              label="IPS 유형"
                              fullRow
                              edit={
                                <ProgramRegistrationIpsTypeFields
                                  value={ipsTypeValueForDetail(n)}
                                  onChange={next => setIpsForDetailUnlessLocked(n, next)}
                                  disabled={ipsLockedForSchedulePreEducation}
                                />
                              }
                              view="-"
                            />
                          </DetailInfoForm.Row>
                        ) : null}
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
                                  value={participationForDetail(n)}
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
                              value={participationForDetail(n)}
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
                              value={educationFormForDetail(n)}
                              onChange={onEducationFormRadioChange(n)}
                            >
                              {getProgramRegistrationEducationFormOptions(participantOrganization).map(
                                opt => (
                                  <CmsRadio key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </CmsRadio>
                                )
                              )}
                            </CmsRadioGroup>
                          }
                          view="-"
                        />
                      </DetailInfoForm.Row>
                    ) : multiRowPlan === 'p_eduPer_piAnyPer' ? (
                      <>
                        {ipsScheduleDetail === 'perSchedule' && !ipsPerSchedule ? (
                          <DetailInfoForm.Row type="single">
                            <DetailInfoForm.Field
                              label="IPS 유형"
                              fullRow
                              edit={
                                <ProgramRegistrationIpsTypeFields
                                  value={ipsTypeValueForDetail(n)}
                                  onChange={next => setIpsForDetailUnlessLocked(n, next)}
                                  disabled={ipsLockedForSchedulePreEducation}
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
                                  value={educationFormForDetail(n)}
                                  onChange={onEducationFormRadioChange(n)}
                                >
                                  {getProgramRegistrationEducationFormOptions(participantOrganization).map(
                                    opt => (
                                      <CmsRadio key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </CmsRadio>
                                    )
                                  )}
                                </CmsRadioGroup>
                              }
                              view="-"
                            />
                            <DetailInfoForm.Field
                              label="참여 방식"
                              edit={
                                <CmsRadioGroup
                                  size="large"
                                  value={participationForDetail(n)}
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
                                  value={educationFormForDetail(n)}
                                  onChange={onEducationFormRadioChange(n)}
                                >
                                  {getProgramRegistrationEducationFormOptions(participantOrganization).map(
                                    opt => (
                                      <CmsRadio key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </CmsRadio>
                                    )
                                  )}
                                </CmsRadioGroup>
                              }
                              view="-"
                            />
                          </DetailInfoForm.Row>
                        )}
                      </>
                    ) : null}
                  </>
                ) : null}
              </DetailInfoForm>
            </div>
          </div>
        )
      })}
    </>
  )
}

/**
 * 교육받은 교사 프로그램 상세 — 공통 정보 (조회 / 정보 수정)
 *
 * 일반 프로그램 공통 정보 뷰(general/ui/detail-modal/info/common-info-view.tsx)의
 * 렌더 패턴을 교육받은 교사 전용으로 복제·단순화한 컴포넌트.
 * (program-type-isolation — 일반 뷰는 수정하지 않음)
 *
 * 케이스별 렌더:
 * - 커리큘럼형 단일: ■ N차시(단원명 및 교육 내용), IPS 차시 별 상이 시 IPS 행 추가
 * - 커리큘럼형 복수: ■ N회차(차시 및 교육 내용/과제 설정), 교육 형태·IPS 회차 별 상이 시 1단/2단 행
 * - 일정형 단일: ■ 세부 일정 NN(일정명/진행 시간 — 진행 그룹 A/B)
 * - 일정형 복수: ■ 행사 일정 NN(일정명/진행 일정/과제 설정) — 교육 진행 일정 설정 섹션 비노출
 * - 교육 연수 ON: 첫 진행 항목 타이틀·일정명 교육 연수 치환 (IPS Prepare 고정)
 *
 * 수정 모드: 기본 정보(form) · KPI 인풋 · 교육일지 라디오 · 차시/회차/일정 추가·삭제 · 교육 연수 토글 · 진행 그룹 구분 추가
 * (진행 그룹은 전 테이블 동시 적용).
 * remote OFF 시 KPI/커리큘럼은 컴포넌트 로컬 오버레이 · 기본 정보는 `onBeforePersist`(programs PATCH).
 * remote ON 시 `onPersist` → `PATCH …/trained-teacher/detail` (+ `onBeforePersist`).
 */

import { Fragment, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsToggle } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { BasicInfoSection } from '@/features/program/shared/ui/program-detail/project-info/common-info/basic-info-section'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
} from '@/features/program/general/lib/variant'
import {
  GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS,
  formatGeneralProgramProgressSessionDisplay,
} from '@/features/program/general/lib/curriculum-progress-session-options'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import { TYPE_SETTINGS_PER_SCHEDULE_HINT } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/shared/paragraph-date-picker.css'
import '@/features/template/ui/shared/paragraph-time-picker.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './common-info-view.css'

/** 교육 연수 — IPS Prepare 고정 표기 */
const TEACHER_TRAINING_IPS_SUMMARY = 'Prepare | 해당없음'
const TEACHER_TRAINING_HEADING = '교육 연수'

type TrainedTeachersCommonInfo = NonNullable<Program['generalCommonInfo']>

/* ─────────────────────────── 수정 모드 draft ─────────────────────────── */

interface TrainedTeachersCommonInfoDraft {
  kpiFinalParticipants: number | undefined
  kpiEducatedTeachers: number | undefined
  kpiFinalSchools: number | undefined
  kpiFinalClasses: number | undefined
  educationJournalEnabled: boolean
  teacherTrainingEnabled: boolean
  curriculumSessions: GeneralProgramCurriculumSessionRow[]
  scheduleDetails: GeneralProgramScheduleDetailRow[]
  /**
   * 일정형 단일 — 세부 일정별 진행 그룹 시간 텍스트 (progressTimeSummary 분해).
   * 그룹 추가·삭제는 전 테이블 동시 적용 — 모든 배열의 길이 동일 유지.
   */
  progressGroupsByDetail: string[][]
}

function emptyScheduleDetail(
  sessionRound: 'single' | 'multi'
): GeneralProgramScheduleDetailRow {
  return {
    scheduleLabel: sessionRound === 'multi' ? '행사 일정 01' : '세부 일정 01',
    name: '',
  }
}

function emptyCurriculumSession(
  sessionRound: 'single' | 'multi'
): GeneralProgramCurriculumSessionRow {
  return {
    sessionLabel: sessionRound === 'multi' ? '1회차' : '1차시',
    title: '',
    description: '',
  }
}

function progressGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

/** `그룹 A : 09:30 ~ 09:40 | 그룹 B : …` → 그룹별 시간 텍스트 배열 */
function parseProgressGroups(summary: string | undefined): string[] {
  const trimmed = summary?.trim()
  if (!trimmed || trimmed === '-') return ['']
  return trimmed.split(/\s*\|\s*/).map(part => part.replace(/^그룹\s*\S+\s*:\s*/, '').trim())
}

/** 그룹별 시간 텍스트 배열 → progressTimeSummary (2개 이상일 때만 그룹 라벨) */
function joinProgressGroups(groups: string[]): string {
  const filled = groups.map(g => g.trim()).filter(Boolean)
  if (filled.length === 0) return ''
  if (filled.length === 1) return filled[0]
  return filled.map((g, i) => `그룹 ${progressGroupLetter(i)} : ${g}`).join(' | ')
}

/** `09:30 ~ 09:40` → dayjs 시간 범위 (진행 그룹 시간 필드 시드) */
function parseProgressTimeRange(text: string): [Dayjs, Dayjs] | null {
  const match = text.trim().match(/^(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const base = dayjs().second(0).millisecond(0)
  return [
    base.hour(Number(match[1])).minute(Number(match[2])),
    base.hour(Number(match[3])).minute(Number(match[4])),
  ]
}

const JAVA_INT_MAX = 2_147_483_647

/** BE Integer 범위 밖 KPI는 상한으로 캡 — 기입력값 유지 + 저장 Zod 통과 */
function clampKpiDraftValue(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  const n = Math.trunc(value)
  if (n < 0) return undefined
  return Math.min(n, JAVA_INT_MAX)
}

function seedDraft(
  commonInfo: TrainedTeachersCommonInfo,
  educatedTeachers: number | undefined,
  totals: { totalParticipants?: number; participatingSchoolCount?: number } | undefined,
  typeFields: {
    educationStructure: 'curriculum' | 'schedule'
    sessionRound: 'single' | 'multi'
  }
): TrainedTeachersCommonInfoDraft {
  let scheduleDetails = (commonInfo.scheduleDetails ?? []).map(detail => ({ ...detail }))
  let curriculumSessions = (commonInfo.curriculumSessions ?? []).map(session => ({
    ...session,
  }))

  // 일정/차시 테이블 최소 1개 — 저장된 값이 없어도 구조에 맞는 빈 행 노출
  if (typeFields.educationStructure === 'schedule' && scheduleDetails.length === 0) {
    scheduleDetails = [emptyScheduleDetail(typeFields.sessionRound)]
  }
  if (typeFields.educationStructure === 'curriculum' && curriculumSessions.length === 0) {
    curriculumSessions = [emptyCurriculumSession(typeFields.sessionRound)]
  }

  // 그룹 수는 전 테이블 공통 — 최대 그룹 수 기준으로 정규화
  const parsedGroups = scheduleDetails.map(detail =>
    parseProgressGroups(detail.progressTimeSummary)
  )
  const maxGroupCount = Math.max(1, ...parsedGroups.map(groups => groups.length))
  return {
    kpiFinalParticipants: clampKpiDraftValue(
      commonInfo.kpi?.finalParticipants ?? totals?.totalParticipants
    ),
    kpiEducatedTeachers: clampKpiDraftValue(educatedTeachers),
    kpiFinalSchools: clampKpiDraftValue(
      commonInfo.kpi?.finalSchools ?? totals?.participatingSchoolCount
    ),
    kpiFinalClasses: clampKpiDraftValue(commonInfo.kpi?.finalClasses),
    educationJournalEnabled: commonInfo.educationJournalEnabled === true,
    teacherTrainingEnabled: commonInfo.teacherTrainingEnabled === true,
    curriculumSessions,
    scheduleDetails,
    progressGroupsByDetail: parsedGroups.map(groups => [
      ...groups,
      ...Array<string>(maxGroupCount - groups.length).fill(''),
    ]),
  }
}

function padScheduleNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

/** 추가·삭제 후 차시/회차 라벨 재부여 */
function relabelCurriculumSessions(
  sessions: GeneralProgramCurriculumSessionRow[],
  isMulti: boolean
): GeneralProgramCurriculumSessionRow[] {
  return sessions.map((session, index) => ({
    ...session,
    sessionLabel: isMulti ? `${index + 1}회차` : `${index + 1}차시`,
  }))
}

/** 추가·삭제 후 세부/행사 일정 라벨 재부여 */
function relabelScheduleDetails(
  details: GeneralProgramScheduleDetailRow[],
  isMulti: boolean
): GeneralProgramScheduleDetailRow[] {
  return details.map((detail, index) => ({
    ...detail,
    scheduleLabel: isMulti
      ? `행사 일정 ${padScheduleNumber(index)}`
      : `세부 일정 ${padScheduleNumber(index)}`,
  }))
}

type DraftUpdater = (
  update: (draft: TrainedTeachersCommonInfoDraft) => TrainedTeachersCommonInfoDraft
) => void

/* ─────────────────────────── 공용 렌더 ─────────────────────────── */

/** 등록 양식 단락 title + 본문 (일반 뷰 ProgramRegistrationDetailSection 복제) */
function TrainedTeachersDetailSection({
  title,
  children,
  bodyClassName,
  titleTrailing,
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
  titleTrailing?: ReactNode
}) {
  return (
    <section className="trained-teachers-common-info__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
      />
      <div
        className={['trained-teachers-common-info__section-body', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </section>
  )
}

/** `A | B | C` 문자열을 세로 디바이더로 구분해 렌더 (일반 뷰 PipeSeparatedInlineView 복제) */
function PipeSeparatedInlineView({ text }: { text: string | undefined | null }) {
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return <>-</>
  const parts = trimmed.split(/\s*\|\s*/)
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}

/** 프로그램 유형 설정 — 수정 모드: 라디오·IPS 후속 셀렉트 / 조회: 라벨 */
function TrainedTeachersTypeSettingsSection({
  educationStructure,
  sessionRound,
  commonInfo,
  isEditMode = false,
  form,
}: {
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  commonInfo: TrainedTeachersCommonInfo
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const isFormEdit = isEditMode && form != null
  const watchedStructure = isFormEdit
    ? (form.watch('educationStructure') ?? educationStructure)
    : educationStructure
  const watchedRound = isFormEdit
    ? (form.watch('sessionRound') ?? sessionRound)
    : sessionRound
  const isMulti = watchedRound === 'multi'
  const educationFormPerSchedule =
    (isFormEdit
      ? form.watch('educationFormScheduleDetail')
      : commonInfo.educationFormScheduleDetail) === 'perSchedule'
  const ipsScheduleDetail =
    (isFormEdit ? form.watch('ipsScheduleDetail') : commonInfo.ipsScheduleDetail) ?? 'common'
  const perScheduleHint = TYPE_SETTINGS_PER_SCHEDULE_HINT.byRound
  const educationFormOptions = getProgramRegistrationEducationFormOptions(true)

  const educationFormView = educationFormPerSchedule ? (
    <div className="detail-info-form-inputs-wrapper">
      일정 별 상이
      <DetailInfoForm.InputsSeparator />
      <span className="program-registration-paragraph__schedule-hint">{perScheduleHint}</span>
    </div>
  ) : isMulti ? (
    <>
      일정 공통
      <DetailInfoForm.InputsSeparator />
      {commonInfo.educationFormLabel ?? '-'}
    </>
  ) : (
    (commonInfo.educationFormLabel ?? '-')
  )

  const ipsCategory = (isFormEdit ? form.watch('ipsCategory') : undefined) as
    | ProgramRegistrationIpsCategory
    | ''
    | undefined
  const ipsDetail = isFormEdit ? (form.watch('ipsDetail') ?? '') : ''
  const ipsValue: ProgramRegistrationIpsTypeValue = {
    category: (ipsCategory as ProgramRegistrationIpsCategory | '') || '',
    detail: ipsDetail,
  }

  return (
    <TrainedTeachersDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.title}
      bodyClassName="trained-teachers-common-info__section-body--type-settings"
    >
      <DetailInfoForm
        title="프로그램 유형 설정"
        hideHeader
        mode={isFormEdit ? 'edit' : 'view'}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 진행 구조"
            view={GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[educationStructure]}
            edit={
              isFormEdit ? (
                <Controller
                  name="educationStructure"
                  control={form.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="large"
                      value={field.value ?? watchedStructure}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio value="curriculum">커리큘럼형</CmsRadio>
                      <CmsRadio value="schedule">일정형</CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            view={GENERAL_PROGRAM_SESSION_ROUND_LABELS[sessionRound]}
            edit={
              isFormEdit ? (
                <Controller
                  name="sessionRound"
                  control={form.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="large"
                      value={field.value ?? watchedRound}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio value="single">단일 회차</CmsRadio>
                      <CmsRadio value="multi">복수 회차</CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="교육 형태, IPS 유형 설정"
        hideHeader
        mode={isFormEdit ? 'edit' : 'view'}
        className="program-registration-paragraph"
      >
        {isFormEdit && isMulti ? (
          <>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow
                edit={
                  <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
                    <Controller
                      name="educationFormScheduleDetail"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadioGroup
                          size="large"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio value="common">일정 공통</CmsRadio>
                          <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
                        </CmsRadioGroup>
                      )}
                    />
                    {(form.watch('educationFormScheduleDetail') ?? 'common') === 'common' ? (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <Controller
                          name="educationForm"
                          control={form.control}
                          render={({ field }) => (
                            <CmsSelect
                              inputSize="medium"
                              withAllOption={false}
                              placeholder="교육 형태"
                              width={160}
                              options={educationFormOptions}
                              value={field.value || undefined}
                              onChange={v => field.onChange(String(v ?? ''))}
                            />
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <span className="program-registration-paragraph__schedule-hint">
                          {perScheduleHint}
                        </span>
                      </>
                    )}
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
                  <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
                    <Controller
                      name="ipsScheduleDetail"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadioGroup
                          size="large"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio value="common">일정 공통</CmsRadio>
                          <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
                        </CmsRadioGroup>
                      )}
                    />
                    {ipsScheduleDetail === 'common' ? (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <ProgramRegistrationIpsTypeFields
                          value={ipsValue}
                          onChange={next => {
                            form.setValue('ipsCategory', next.category || undefined, {
                              shouldDirty: true,
                            })
                            form.setValue('ipsDetail', next.detail || undefined, {
                              shouldDirty: true,
                            })
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <span className="program-registration-paragraph__schedule-hint">
                          {perScheduleHint}
                        </span>
                      </>
                    )}
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
          </>
        ) : isFormEdit ? (
          <>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow
                edit={
                  <Controller
                    name="educationForm"
                    control={form.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        size="large"
                        value={field.value || 'online'}
                        onChange={e => field.onChange(String(e.target.value))}
                      >
                        {educationFormOptions.map(option => (
                          <CmsRadio key={option.value} value={option.value}>
                            {option.label}
                          </CmsRadio>
                        ))}
                      </CmsRadioGroup>
                    )}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                edit={
                  <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
                    <Controller
                      name="ipsScheduleDetail"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadioGroup
                          size="large"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio value="common">일정 공통</CmsRadio>
                          <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
                        </CmsRadioGroup>
                      )}
                    />
                    {ipsScheduleDetail === 'common' ? (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <ProgramRegistrationIpsTypeFields
                          value={ipsValue}
                          onChange={next => {
                            form.setValue('ipsCategory', next.category || undefined, {
                              shouldDirty: true,
                            })
                            form.setValue('ipsDetail', next.detail || undefined, {
                              shouldDirty: true,
                            })
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <DetailInfoForm.InputsSeparator />
                        <span className="program-registration-paragraph__schedule-hint">
                          {perScheduleHint}
                        </span>
                      </>
                    )}
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
          </>
        ) : (
          <>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="교육 형태" fullRow view={educationFormView} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                view={<PipeSeparatedInlineView text={commonInfo.ipsTypeSummary} />}
              />
            </DetailInfoForm.Row>
          </>
        )}
      </DetailInfoForm>
    </TrainedTeachersDetailSection>
  )
}

/** 교육일지 설정 행 — 교육 진행 섹션 첫 블록. 수정 모드: 있음/없음 라디오 */
function EducationJournalBlock({
  enabled,
  isFormEdit,
  onChange,
}: {
  enabled: boolean | undefined
  isFormEdit: boolean
  onChange?: (next: boolean) => void
}) {
  return (
    <DetailInfoForm
      title="교육일지 설정"
      hideHeader
      mode={isFormEdit ? 'edit' : 'view'}
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육일지 설정"
          fullRow
          view={enabled ? '있음' : '없음'}
          edit={
            isFormEdit ? (
              <CmsRadioGroup
                size="large"
                value={enabled ? 'yes' : 'no'}
                onChange={e => onChange?.(e.target.value === 'yes')}
              >
                <CmsRadio value="yes">있음</CmsRadio>
                <CmsRadio value="no">없음</CmsRadio>
              </CmsRadioGroup>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

/** 수정 모드 — 블록 우측 X 삭제 래퍼 (2개 이상일 때 노출) */
function DeletableBlockRow({
  children,
  showDelete,
  deleteAriaLabel,
  onRemove,
}: {
  children: ReactNode
  showDelete: boolean
  deleteAriaLabel: string
  onRemove: () => void
}) {
  if (!showDelete) return <>{children}</>
  return (
    <div className="program-registration-curriculum__session-row">
      {children}
      <ItemDeleteButton
        className="item-delete-button program-registration-curriculum__session-delete"
        aria-label={deleteAriaLabel}
        onClick={event => {
          event.stopPropagation()
          onRemove()
        }}
      />
    </div>
  )
}

/** 커리큘럼형 단일 — ■ N차시 블록 (교육 연수 치환 시 heading·IPS Prepare 고정) */
function SingleRoundSessionBlock({
  session,
  heading,
  ipsSummaryOverride,
  showIpsPerSession,
  isFormEdit,
  showDelete,
  onChange,
  onRemove,
}: {
  session: GeneralProgramCurriculumSessionRow
  heading?: string
  ipsSummaryOverride?: string
  showIpsPerSession: boolean
  isFormEdit: boolean
  showDelete: boolean
  onChange?: (patch: Partial<GeneralProgramCurriculumSessionRow>) => void
  onRemove?: () => void
}) {
  const showIpsRow = showIpsPerSession || ipsSummaryOverride != null
  const ipsSummary = ipsSummaryOverride ?? session.ipsTypeSummary
  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">
        ■ {heading ?? session.sessionLabel}
      </div>
      <DeletableBlockRow
        showDelete={isFormEdit && showDelete}
        deleteAriaLabel={`${session.sessionLabel} 삭제`}
        onRemove={() => onRemove?.()}
      >
        <DetailInfoForm
          title={`${session.sessionLabel} 커리큘럼`}
          hideHeader
          mode={isFormEdit ? 'edit' : 'view'}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="단원명 및 교육 내용"
              fullRow
              view={
                <>
                  {session.title}
                  <DetailInfoForm.InputsSeparator />
                  {session.description}
                </>
              }
              edit={
                isFormEdit ? (
                  <div className="detail-info-form-inputs-wrapper">
                    <CmsInput
                      inputSize="medium"
                      placeholder="단원명을 입력하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={session.title}
                      onChange={e => onChange?.({ title: e.target.value })}
                    />
                    <DetailInfoForm.InputsSeparator />
                    <CmsInput
                      inputSize="medium"
                      placeholder="교육 내용을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={session.description}
                      onChange={e => onChange?.({ description: e.target.value })}
                    />
                  </div>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
          {showIpsRow ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                readOnlyDisplay={isFormEdit}
                view={<PipeSeparatedInlineView text={ipsSummary} />}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </DeletableBlockRow>
    </div>
  )
}

/** 과제 설정 행 — 있음/없음 라디오 + 기간 선택 (수정 모드) */
function AssignmentSettingEdit({
  assignmentEnabled,
  assignmentPeriod,
  onChange,
}: {
  assignmentEnabled: boolean
  assignmentPeriod: string
  onChange: (patch: { assignmentEnabled?: boolean; assignmentPeriod?: string }) => void
}) {
  const appliedRange = parseEducationScheduleLineToRange(assignmentPeriod)
  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
      <CmsRadioGroup
        size="large"
        value={assignmentEnabled ? 'yes' : 'no'}
        onChange={e => {
          const enabled = e.target.value === 'yes'
          onChange(
            enabled
              ? { assignmentEnabled: true }
              : { assignmentEnabled: false, assignmentPeriod: '' }
          )
        }}
      >
        <CmsRadio value="yes">있음</CmsRadio>
        <CmsRadio value="no">없음</CmsRadio>
      </CmsRadioGroup>
      <DetailInfoForm.InputsSeparator />
      <ParagraphDatePicker
        mode="single"
        presetMode="period"
        customizable={false}
        suppressAutoTodayWhenEmpty
        disabled={!assignmentEnabled}
        value={appliedRange?.[0] ?? null}
        onChange={() => {}}
        appliedSurfaceRange={appliedRange}
        onRangeChange={([start, end]) => {
          onChange({
            assignmentEnabled: true,
            assignmentPeriod: formatEducationScheduleLineFromRange([start, end]),
          })
        }}
        width={360}
        placeholder="제출 기한을 설정해 주세요"
      />
    </div>
  )
}

/** 커리큘럼형 복수 — ■ N회차 블록 (차시 및 교육 내용/과제 설정 + 상이 시 교육 형태·IPS 행, 교육 연수 치환 지원) */
function MultiRoundSessionBlock({
  session,
  heading,
  ipsSummaryOverride,
  showEducationPerRound,
  showIpsPerRound,
  isFormEdit,
  showDelete,
  onChange,
  onRemove,
}: {
  session: GeneralProgramCurriculumSessionRow
  heading?: string
  ipsSummaryOverride?: string
  showEducationPerRound: boolean
  showIpsPerRound: boolean
  isFormEdit: boolean
  showDelete: boolean
  onChange?: (patch: Partial<GeneralProgramCurriculumSessionRow>) => void
  onRemove?: () => void
}) {
  const showIpsRow = showIpsPerRound || ipsSummaryOverride != null
  const ipsSummary = ipsSummaryOverride ?? session.ipsTypeSummary
  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">
        ■ {heading ?? session.sessionLabel}
      </div>
      <DeletableBlockRow
        showDelete={isFormEdit && showDelete}
        deleteAriaLabel={`${session.sessionLabel} 삭제`}
        onRemove={() => onRemove?.()}
      >
        <DetailInfoForm
          title={`${session.sessionLabel} 커리큘럼`}
          hideHeader
          mode={isFormEdit ? 'edit' : 'view'}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={
                isFormEdit
                  ? `${session.sessionLabel.replace(/회차$/, '')}회차 수업`
                  : '차시 및 교육 내용'
              }
              fullRow
              view={
                <>
                  {formatGeneralProgramProgressSessionDisplay(session.title)}
                  <DetailInfoForm.InputsSeparator />
                  {session.description}
                </>
              }
              edit={
                isFormEdit ? (
                  <div className="detail-info-form-inputs-wrapper">
                    <CmsSelect
                      inputSize="medium"
                      withAllOption={false}
                      placeholder="진행 차시"
                      width={120}
                      options={GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS}
                      value={session.title || undefined}
                      onChange={v => onChange?.({ title: String(v ?? '') })}
                    />
                    <DetailInfoForm.InputsSeparator />
                    <CmsInput
                      inputSize="medium"
                      placeholder="교육 내용을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={session.description}
                      onChange={e => onChange?.({ description: e.target.value })}
                    />
                  </div>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="과제 설정"
              fullRow
              view={
                <CurriculumAssignmentSettingView
                  assignmentEnabled={session.assignmentEnabled}
                  assignmentPeriod={session.assignmentPeriod}
                />
              }
              edit={
                isFormEdit ? (
                  <AssignmentSettingEdit
                    assignmentEnabled={session.assignmentEnabled ?? false}
                    assignmentPeriod={session.assignmentPeriod ?? ''}
                    onChange={patch => onChange?.(patch)}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
          {showEducationPerRound && showIpsRow ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교육 형태"
                readOnlyDisplay={isFormEdit}
                view={session.educationFormLabel ?? '-'}
              />
              <DetailInfoForm.Field
                label="IPS 유형"
                readOnlyDisplay={isFormEdit}
                view={<PipeSeparatedInlineView text={ipsSummary} />}
              />
            </DetailInfoForm.Row>
          ) : showEducationPerRound ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow
                readOnlyDisplay={isFormEdit}
                view={session.educationFormLabel ?? '-'}
              />
            </DetailInfoForm.Row>
          ) : showIpsRow ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                readOnlyDisplay={isFormEdit}
                view={<PipeSeparatedInlineView text={ipsSummary} />}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </DeletableBlockRow>
    </div>
  )
}

/** 교육 진행 (커리큘럼) 섹션 */
function TrainedTeachersCurriculumSection({
  sessionRound,
  commonInfo,
  isEditMode,
  draft,
  updateDraft,
}: {
  sessionRound: 'single' | 'multi'
  commonInfo: TrainedTeachersCommonInfo
  isEditMode: boolean
  draft: TrainedTeachersCommonInfoDraft | null
  updateDraft: DraftUpdater
}) {
  const isFormEdit = isEditMode && draft != null
  const isMulti = sessionRound === 'multi'
  const sessions = isFormEdit ? draft.curriculumSessions : (commonInfo.curriculumSessions ?? [])
  const showEducationPerRound = isMulti && commonInfo.educationFormScheduleDetail === 'perSchedule'
  const showIpsPerRound = isMulti && commonInfo.ipsScheduleDetail === 'perSchedule'
  const showIpsPerSession = !isMulti && commonInfo.ipsScheduleDetail === 'perSchedule'
  const teacherTrainingEnabled = isFormEdit
    ? draft.teacherTrainingEnabled
    : commonInfo.teacherTrainingEnabled === true

  const patchSession = (index: number, patch: Partial<GeneralProgramCurriculumSessionRow>) =>
    updateDraft(d => ({
      ...d,
      curriculumSessions: d.curriculumSessions.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      ),
    }))

  const addSession = () =>
    updateDraft(d => ({
      ...d,
      curriculumSessions: relabelCurriculumSessions(
        [
          ...d.curriculumSessions,
          isMulti
            ? {
                sessionLabel: '',
                title: '1',
                description: '',
                assignmentEnabled: false,
                assignmentPeriod: '',
              }
            : { sessionLabel: '', title: '', description: '' },
        ],
        isMulti
      ),
    }))

  const removeSession = (index: number) =>
    updateDraft(d => ({
      ...d,
      curriculumSessions: relabelCurriculumSessions(
        d.curriculumSessions.filter((_, i) => i !== index),
        isMulti
      ),
    }))

  return (
    <TrainedTeachersDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.title}
      bodyClassName="trained-teachers-common-info__section-body--curriculum"
      titleTrailing={
        isFormEdit ? (
          <div className="trained-teachers-common-info__section-title-actions">
            <CmsToggle
              label={TEACHER_TRAINING_HEADING}
              checked={draft.teacherTrainingEnabled}
              onChange={next => updateDraft(d => ({ ...d, teacherTrainingEnabled: next }))}
            />
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={180}
              icon={<PlusOutlined aria-hidden />}
              onClick={addSession}
            >
              {isMulti ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
            </CmsButton>
          </div>
        ) : undefined
      }
    >
      <EducationJournalBlock
        enabled={isFormEdit ? draft.educationJournalEnabled : commonInfo.educationJournalEnabled}
        isFormEdit={isFormEdit}
        onChange={next => updateDraft(d => ({ ...d, educationJournalEnabled: next }))}
      />
      {sessions.map((session, index) => {
        // 교육 연수 ON — 첫 차시/회차 타이틀 교육 연수 치환, IPS Prepare 고정
        const isTeacherTrainingBlock = teacherTrainingEnabled && index === 0
        return isMulti ? (
          <MultiRoundSessionBlock
            key={session.sessionLabel || index}
            session={session}
            heading={isTeacherTrainingBlock ? TEACHER_TRAINING_HEADING : undefined}
            ipsSummaryOverride={isTeacherTrainingBlock ? TEACHER_TRAINING_IPS_SUMMARY : undefined}
            showEducationPerRound={showEducationPerRound}
            showIpsPerRound={showIpsPerRound}
            isFormEdit={isFormEdit}
            showDelete={sessions.length >= 2}
            onChange={patch => patchSession(index, patch)}
            onRemove={() => removeSession(index)}
          />
        ) : (
          <SingleRoundSessionBlock
            key={session.sessionLabel || index}
            session={session}
            heading={isTeacherTrainingBlock ? TEACHER_TRAINING_HEADING : undefined}
            ipsSummaryOverride={isTeacherTrainingBlock ? TEACHER_TRAINING_IPS_SUMMARY : undefined}
            showIpsPerSession={showIpsPerSession}
            isFormEdit={isFormEdit}
            showDelete={sessions.length >= 2}
            onChange={patch => patchSession(index, patch)}
            onRemove={() => removeSession(index)}
          />
        )
      })}
    </TrainedTeachersDetailSection>
  )
}

/** 진행 그룹 시간 필드 — "HH:mm ~ HH:mm" 텍스트 ↔ ParagraphTimePicker */
function ProgressGroupTimeField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const range = useMemo(() => parseProgressTimeRange(value), [value])
  return (
    <ParagraphTimePicker
      endTimeAlwaysOn
      placeholder="시간 선택"
      width={200}
      value={range?.[0] ?? null}
      initialTimeRange={range}
      onTimeRangeChange={([start, end]) =>
        onChange(`${start.format('HH:mm')} ~ ${end.format('HH:mm')}`)
      }
    />
  )
}

/** 일정형 — ■ 세부 일정 NN 블록 (일정명/진행 시간 — 진행 그룹, 그룹 추가·삭제는 전 테이블 공통) */
function ScheduleDetailBlock({
  detail,
  showIpsPerSchedule,
  isFormEdit,
  showDelete,
  progressGroups,
  onChange,
  onGroupTimeChange,
  onAddGroup,
  onRemoveGroup,
  onRemove,
}: {
  detail: GeneralProgramScheduleDetailRow
  showIpsPerSchedule: boolean
  isFormEdit: boolean
  showDelete: boolean
  progressGroups?: string[]
  onChange?: (patch: Partial<GeneralProgramScheduleDetailRow>) => void
  onGroupTimeChange?: (groupIndex: number, next: string) => void
  /** 진행 그룹 구분 추가 — 모든 세부 일정 테이블에 동시 적용 */
  onAddGroup?: () => void
  /** 그룹 삭제 — 모든 세부 일정 테이블에서 해당 그룹 제거 */
  onRemoveGroup?: (groupIndex: number) => void
  onRemove?: () => void
}) {
  const groups = progressGroups ?? ['']
  return (
    <div className="program-registration-schedule-curriculum__block">
      <div className="program-registration-schedule-curriculum__session-heading">
        ■ {detail.scheduleLabel}
      </div>
      <DeletableBlockRow
        showDelete={isFormEdit && showDelete}
        deleteAriaLabel={`${detail.scheduleLabel} 삭제`}
        onRemove={() => onRemove?.()}
      >
        <div className="program-registration-schedule-curriculum__session-panel">
          <DetailInfoForm
            title="교육 진행 (일정형)"
            hideHeader
            mode={isFormEdit ? 'edit' : 'view'}
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="일정명"
                fullRow
                view={detail.name || '-'}
                edit={
                  isFormEdit ? (
                    <CmsInput
                      inputSize="medium"
                      placeholder="일정명을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={detail.name}
                      onChange={e => onChange?.({ name: e.target.value })}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="진행 시간"
                fullRow
                view={<PipeSeparatedInlineView text={detail.progressTimeSummary ?? '-'} />}
                edit={
                  isFormEdit ? (
                    <div className="trained-teachers-common-info__progress-groups">
                      {groups.map((group, groupIndex) => (
                        <div
                          key={groupIndex}
                          className="trained-teachers-common-info__progress-group-row"
                        >
                          {groups.length > 1 ? (
                            <span className="trained-teachers-common-info__progress-group-label">
                              그룹 {progressGroupLetter(groupIndex)}
                            </span>
                          ) : null}
                          <ProgressGroupTimeField
                            value={group}
                            onChange={next => onGroupTimeChange?.(groupIndex, next)}
                          />
                          {groups.length > 1 ? (
                            <ItemDeleteButton
                              className="item-delete-button"
                              aria-label={`그룹 ${progressGroupLetter(groupIndex)} 삭제`}
                              onClick={() => onRemoveGroup?.(groupIndex)}
                            />
                          ) : null}
                        </div>
                      ))}
                      <CmsButton
                        type="button"
                        variant="secondary"
                        size="medium"
                        width={180}
                        icon={<PlusOutlined aria-hidden />}
                        onClick={() => onAddGroup?.()}
                      >
                        진행 그룹 구분 추가
                      </CmsButton>
                    </div>
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            {showIpsPerSchedule ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="IPS 유형"
                  fullRow
                  readOnlyDisplay={isFormEdit}
                  view={<PipeSeparatedInlineView text={detail.ipsTypeSummary} />}
                />
              </DetailInfoForm.Row>
            ) : null}
          </DetailInfoForm>
        </div>
      </DeletableBlockRow>
    </div>
  )
}

/** 일정형 복수 — ■ 행사 일정 NN 블록 (일정명/진행 일정/과제 설정 + 상이 시 교육 형태·IPS 행) */
function ScheduleEventBlock({
  detail,
  heading,
  nameOverride,
  ipsSummaryOverride,
  showEducationPerSchedule,
  showIpsPerSchedule,
  isFormEdit,
  showDelete,
  onChange,
  onRemove,
}: {
  detail: GeneralProgramScheduleDetailRow
  /** 교육 연수 치환 시 heading·일정명·IPS 고정 */
  heading?: string
  nameOverride?: string
  ipsSummaryOverride?: string
  showEducationPerSchedule: boolean
  showIpsPerSchedule: boolean
  isFormEdit: boolean
  showDelete: boolean
  onChange?: (patch: Partial<GeneralProgramScheduleDetailRow>) => void
  onRemove?: () => void
}) {
  const ipsSummary = ipsSummaryOverride ?? detail.ipsTypeSummary
  const isTeacherTrainingBlock = heading != null
  const scheduleRange = parseEducationScheduleLineToRange(detail.scheduleDateLabel)
  const scheduleWithTime = Boolean(
    scheduleRange?.[0] && (scheduleRange[0].hour() !== 0 || scheduleRange[0].minute() !== 0)
  )
  return (
    <div className="program-registration-schedule-curriculum__block">
      <div className="program-registration-schedule-curriculum__session-heading">
        ■ {heading ?? detail.scheduleLabel}
      </div>
      <DeletableBlockRow
        showDelete={isFormEdit && showDelete}
        deleteAriaLabel={`${detail.scheduleLabel} 삭제`}
        onRemove={() => onRemove?.()}
      >
        <div className="program-registration-schedule-curriculum__session-panel">
          <DetailInfoForm
            title="교육 진행 (일정형)"
            hideHeader
            mode={isFormEdit ? 'edit' : 'view'}
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="일정명"
                fullRow
                view={nameOverride ?? (detail.name || '-')}
                edit={
                  isFormEdit ? (
                    <CmsInput
                      inputSize="medium"
                      placeholder="행사 일정명을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={nameOverride ?? detail.name}
                      disabled={isTeacherTrainingBlock}
                      readOnly={isTeacherTrainingBlock}
                      onChange={e => onChange?.({ name: e.target.value })}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="진행 일정"
                fullRow
                view={detail.scheduleDateLabel?.trim() || '-'}
                edit={
                  isFormEdit ? (
                    // 일정형 복수 행사 일정 — 기간 토글 비노출(presetMode date) + 시간 토글 고정
                    <ParagraphDatePicker
                      mode="single"
                      presetMode="date"
                      customizable={false}
                      suppressAutoTodayWhenEmpty
                      value={scheduleRange?.[0] ?? null}
                      onChange={next =>
                        onChange?.({
                          scheduleDateLabel: next
                            ? formatEducationScheduleLineFromRange([next, next])
                            : '',
                        })
                      }
                      appliedSurfaceRange={scheduleRange}
                      appliedSurfaceWithTime={scheduleWithTime}
                      width={360}
                      placeholder="일정을 선택하세요"
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="과제 설정"
                fullRow
                view={
                  <CurriculumAssignmentSettingView
                    assignmentEnabled={detail.assignmentEnabled}
                    assignmentPeriod={detail.assignmentPeriod}
                  />
                }
                edit={
                  isFormEdit ? (
                    <AssignmentSettingEdit
                      assignmentEnabled={detail.assignmentEnabled ?? false}
                      assignmentPeriod={detail.assignmentPeriod ?? ''}
                      onChange={patch => onChange?.(patch)}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            {showEducationPerSchedule && showIpsPerSchedule ? (
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="교육 형태"
                  readOnlyDisplay={isFormEdit}
                  view={detail.educationFormLabel ?? '-'}
                />
                <DetailInfoForm.Field
                  label="IPS 유형"
                  readOnlyDisplay={isFormEdit}
                  view={<PipeSeparatedInlineView text={ipsSummary} />}
                />
              </DetailInfoForm.Row>
            ) : showEducationPerSchedule ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="교육 형태"
                  fullRow
                  readOnlyDisplay={isFormEdit}
                  view={detail.educationFormLabel ?? '-'}
                />
              </DetailInfoForm.Row>
            ) : showIpsPerSchedule ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="IPS 유형"
                  fullRow
                  readOnlyDisplay={isFormEdit}
                  view={<PipeSeparatedInlineView text={ipsSummary} />}
                />
              </DetailInfoForm.Row>
            ) : null}
          </DetailInfoForm>
        </div>
      </DeletableBlockRow>
    </div>
  )
}

/** 교육 진행 (일정형) 섹션 */
function TrainedTeachersScheduleSection({
  sessionRound,
  commonInfo,
  isEditMode,
  draft,
  updateDraft,
}: {
  sessionRound: 'single' | 'multi'
  commonInfo: TrainedTeachersCommonInfo
  isEditMode: boolean
  draft: TrainedTeachersCommonInfoDraft | null
  updateDraft: DraftUpdater
}) {
  const isFormEdit = isEditMode && draft != null
  const isMulti = sessionRound === 'multi'
  const details = isFormEdit ? draft.scheduleDetails : (commonInfo.scheduleDetails ?? [])
  const showEducationPerSchedule = commonInfo.educationFormScheduleDetail === 'perSchedule'
  const showIpsPerSchedule = commonInfo.ipsScheduleDetail === 'perSchedule'
  const teacherTrainingEnabled = isFormEdit
    ? draft.teacherTrainingEnabled
    : commonInfo.teacherTrainingEnabled === true

  const patchDetail = (index: number, patch: Partial<GeneralProgramScheduleDetailRow>) =>
    updateDraft(d => ({
      ...d,
      scheduleDetails: d.scheduleDetails.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }))

  const setGroupTime = (detailIndex: number, groupIndex: number, next: string) =>
    updateDraft(d => ({
      ...d,
      progressGroupsByDetail: d.progressGroupsByDetail.map((groups, i) =>
        i === detailIndex ? groups.map((g, gi) => (gi === groupIndex ? next : g)) : groups
      ),
    }))

  // 진행 그룹 구분 추가 — 모든 세부 일정 테이블의 진행 시간 칼럼에 시간 필드 추가
  const addGroupToAll = () =>
    updateDraft(d => ({
      ...d,
      progressGroupsByDetail: d.progressGroupsByDetail.map(groups => [...groups, '']),
    }))

  // 그룹 삭제 — 모든 테이블에서 동일 인덱스 그룹 제거
  const removeGroupFromAll = (groupIndex: number) =>
    updateDraft(d => ({
      ...d,
      progressGroupsByDetail: d.progressGroupsByDetail.map(groups =>
        groups.filter((_, gi) => gi !== groupIndex)
      ),
    }))

  const addDetail = () =>
    updateDraft(d => {
      // 새 테이블도 현재 그룹 수만큼 시간 필드 유지
      const groupCount = d.progressGroupsByDetail[0]?.length ?? 1
      return {
        ...d,
        scheduleDetails: relabelScheduleDetails(
          [...d.scheduleDetails, { scheduleLabel: '', name: '' }],
          isMulti
        ),
        progressGroupsByDetail: [...d.progressGroupsByDetail, Array<string>(groupCount).fill('')],
      }
    })

  const removeDetail = (index: number) =>
    updateDraft(d => ({
      ...d,
      scheduleDetails: relabelScheduleDetails(
        d.scheduleDetails.filter((_, i) => i !== index),
        isMulti
      ),
      progressGroupsByDetail: d.progressGroupsByDetail.filter((_, i) => i !== index),
    }))

  return (
    <TrainedTeachersDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleCurriculum.title}
      bodyClassName="trained-teachers-common-info__section-body--schedule-curriculum"
      titleTrailing={
        isFormEdit ? (
          <div className="trained-teachers-common-info__section-title-actions">
            <CmsToggle
              label={TEACHER_TRAINING_HEADING}
              checked={draft.teacherTrainingEnabled}
              onChange={next => updateDraft(d => ({ ...d, teacherTrainingEnabled: next }))}
            />
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={180}
              icon={<PlusOutlined aria-hidden />}
              onClick={addDetail}
            >
              강의 진행 일정 추가
            </CmsButton>
          </div>
        ) : undefined
      }
    >
      <EducationJournalBlock
        enabled={isFormEdit ? draft.educationJournalEnabled : commonInfo.educationJournalEnabled}
        isFormEdit={isFormEdit}
        onChange={next => updateDraft(d => ({ ...d, educationJournalEnabled: next }))}
      />
      {details.map((detail, index) => {
        const isEventSchedule = isMulti || detail.scheduleLabel.includes('행사 일정')
        // 교육 연수 ON — 첫 일정 항목 타이틀·일정명 교육 연수 치환, IPS Prepare 고정
        const isTeacherTrainingBlock = teacherTrainingEnabled && index === 0

        if (isEventSchedule) {
          return (
            <ScheduleEventBlock
              key={detail.scheduleLabel || index}
              detail={detail}
              heading={isTeacherTrainingBlock ? TEACHER_TRAINING_HEADING : undefined}
              nameOverride={isTeacherTrainingBlock ? TEACHER_TRAINING_HEADING : undefined}
              ipsSummaryOverride={isTeacherTrainingBlock ? TEACHER_TRAINING_IPS_SUMMARY : undefined}
              showEducationPerSchedule={showEducationPerSchedule}
              showIpsPerSchedule={showIpsPerSchedule}
              isFormEdit={isFormEdit}
              showDelete={details.length >= 2}
              onChange={patch => patchDetail(index, patch)}
              onRemove={() => removeDetail(index)}
            />
          )
        }
        return (
          <ScheduleDetailBlock
            key={detail.scheduleLabel || index}
            detail={detail}
            showIpsPerSchedule={showIpsPerSchedule}
            isFormEdit={isFormEdit}
            showDelete={details.length >= 2}
            progressGroups={isFormEdit ? draft.progressGroupsByDetail[index] : undefined}
            onChange={patch => patchDetail(index, patch)}
            onGroupTimeChange={(groupIndex, next) => setGroupTime(index, groupIndex, next)}
            onAddGroup={addGroupToAll}
            onRemoveGroup={removeGroupFromAll}
            onRemove={() => removeDetail(index)}
          />
        )
      })}
    </TrainedTeachersDetailSection>
  )
}

/** 교육 진행 일정 설정 섹션 — 일정형 복수는 비노출. 수정 모드: date/period + 예정일 목록 */
function TrainedTeachersScheduleSettingsSection({
  educationStructure,
  sessionRound,
  commonInfo,
  isEditMode = false,
  form,
}: {
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  commonInfo: TrainedTeachersCommonInfo
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [periodDate, setPeriodDate] = useState<Dayjs | null>(null)

  const isFormEdit = isEditMode && form != null
  const hideForScheduleMulti = educationStructure === 'schedule' && sessionRound === 'multi'
  const watchedLines = isFormEdit ? (form.watch('educationScheduleLines') ?? []) : undefined
  const watchedMode = isFormEdit ? (form.watch('educationScheduleMode') ?? 'date') : undefined
  const lines = watchedLines ?? commonInfo.educationScheduleLines ?? []
  const scheduleMode = watchedMode ?? commonInfo.educationScheduleMode ?? 'date'

  const appendLineIfNew = (line: string) => {
    if (!form) return
    const trimmed = line.trim()
    if (!trimmed) return
    const current = form.getValues('educationScheduleLines') ?? []
    if (current.includes(trimmed)) return
    form.setValue('educationScheduleLines', [...current, trimmed], { shouldDirty: true })
  }

  const removeLine = (index: number) => {
    if (!form) return
    const current = form.getValues('educationScheduleLines') ?? []
    form.setValue(
      'educationScheduleLines',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    )
  }

  const handleScheduleRangeApply = (range: [Dayjs, Dayjs]) => {
    appendLineIfNew(formatEducationScheduleLineFromRange(range))
    setSingleDate(null)
    setPeriodDate(null)
  }

  if (hideForScheduleMulti) return null
  if (!isFormEdit && lines.length === 0) return null

  return (
    <TrainedTeachersDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.title}
    >
      {isFormEdit && form ? (
        <DetailInfoForm
          title="교육 진행 일정 설정"
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육 진행 일정 유형"
              edit={
                <Controller
                  name="educationScheduleMode"
                  control={form.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="large"
                      value={field.value ?? 'date'}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio value="date">날짜 지정</CmsRadio>
                      <CmsRadio value="period">기간 지정</CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="교육 진행 일정 선택"
              edit={
                scheduleMode === 'date' ? (
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="schedule"
                    customizable={false}
                    showPeriodToggle={false}
                    showTimeToggle
                    lockTimeToggleOn
                    suppressAutoTodayWhenEmpty
                    value={singleDate}
                    onChange={next => {
                      if (!next) {
                        setSingleDate(null)
                        return
                      }
                      setSingleDate(next)
                    }}
                    onRangeChange={handleScheduleRangeApply}
                    width={240}
                  />
                ) : (
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="period"
                    customizable={false}
                    showTimeToggle={false}
                    showPeriodToggle={false}
                    suppressAutoTodayWhenEmpty
                    value={periodDate}
                    onChange={setPeriodDate}
                    onRangeChange={handleScheduleRangeApply}
                    width={360}
                  />
                )
              }
              view="-"
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 진행 예정일"
              fullRow
              readOnlyDisplay
              view={
                <EducationSchedulePreviewLines lines={lines} onRemove={removeLine} />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : (
        <DetailInfoForm
          title="교육 진행 일정 설정"
          hideHeader
          mode="view"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 진행 예정일"
              fullRow
              view={<EducationSchedulePreviewLines lines={lines} />}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      )}
    </TrainedTeachersDetailSection>
  )
}

/* ─────────────────────────── 루트 ─────────────────────────── */

export interface TrainedTeachersCommonInfoViewProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  /** 기본 정보 섹션 RHF — 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  onEdit?: () => void
  onCancel?: () => void
  onSave?: () => void
  /** programs PATCH 등 — onPersist / local overlay 전에 호출 */
  onBeforePersist?: () => Promise<void>
  /** remote 저장 — 제공 시 local overlay 대신 호출 */
  onPersist?: (payload: {
    educatedTeachers?: number
    commonInfo: Partial<TrainedTeachersCommonInfo>
  }) => Promise<void>
  persistPending?: boolean
  /** 프로그램 진행 중/완료 등 — 「정보 수정」 비활성 */
  editDisabled?: boolean
}

export function TrainedTeachersCommonInfoView({
  program,
  sponsorName,
  isEditMode = false,
  form,
  onEdit,
  onCancel,
  onSave,
  onBeforePersist,
  onPersist,
  persistPending = false,
  editDisabled = false,
}: TrainedTeachersCommonInfoViewProps) {
  const baseCommonInfo = resolveGeneralProgramCommonInfo(program)

  // mock 저장 오버레이 — onPersist 없을 때만 세션 범위로 반영
  const [savedOverride, setSavedOverride] = useState<{
    commonInfo: Partial<TrainedTeachersCommonInfo>
    educatedTeachers: number | undefined
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const commonInfo = useMemo<TrainedTeachersCommonInfo>(
    () => ({ ...baseCommonInfo, ...savedOverride?.commonInfo }),
    [baseCommonInfo, savedOverride]
  )
  const displayProgram = useMemo<Program>(
    () =>
      savedOverride
        ? {
            ...program,
            educatedTeachers: savedOverride.educatedTeachers ?? program.educatedTeachers,
            generalCommonInfo: commonInfo,
          }
        : program,
    [program, savedOverride, commonInfo]
  )

  const { educationStructure: baseEducationStructure, sessionRound: baseSessionRound } =
    resolveEffectiveGeneralProgramTypeFields({
      generalProgramAudience: program.generalProgramAudience,
      generalProgramEducationStructure: program.generalProgramEducationStructure,
      generalProgramSessionRound: program.generalProgramSessionRound,
      curriculumSessions: commonInfo.curriculumSessions,
    })

  // 수정 모드 — 유형 설정 라디오 변경 시 교육 진행 UI를 즉시 전환
  const educationStructure =
    isEditMode && form
      ? (form.watch('educationStructure') ?? baseEducationStructure)
      : baseEducationStructure
  const sessionRound =
    isEditMode && form
      ? (form.watch('sessionRound') ?? baseSessionRound)
      : baseSessionRound

  const [draft, setDraft] = useState<TrainedTeachersCommonInfoDraft | null>(null)

  const updateDraft: DraftUpdater = update =>
    setDraft(current => (current ? update(current) : current))

  // 수정 모드 진입 시 현재 표시값으로 draft 시드 (페인트 전 — KPI 등 draft 의존 UI가 바로 편집 가능)
  useLayoutEffect(() => {
    if (isEditMode) {
      setDraft(
        seedDraft(
          { ...resolveGeneralProgramCommonInfo(program), ...savedOverride?.commonInfo },
          savedOverride?.educatedTeachers ?? program.educatedTeachers,
          {
            totalParticipants: program.totalParticipants,
            participatingSchoolCount: program.participatingSchoolCount,
          },
          {
            educationStructure: baseEducationStructure,
            sessionRound: baseSessionRound,
          }
        )
      )
      return
    }
    setDraft(null)
    // savedOverride는 시드 시점 값만 필요 — isEditMode 전환 시에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, program])

  // 유형 설정(교육 구조/회차) 변경 시 — 빈 테이블이면 최소 1행 보장 (기존 값 유지)
  useLayoutEffect(() => {
    if (!isEditMode) return
    setDraft(current => {
      if (!current) return current
      if (educationStructure === 'schedule' && current.scheduleDetails.length === 0) {
        return {
          ...current,
          scheduleDetails: [emptyScheduleDetail(sessionRound)],
          progressGroupsByDetail: [['']],
        }
      }
      if (educationStructure === 'curriculum' && current.curriculumSessions.length === 0) {
        return {
          ...current,
          curriculumSessions: [emptyCurriculumSession(sessionRound)],
        }
      }
      return current
    })
  }, [isEditMode, educationStructure, sessionRound])

  const handleSave = () => {
    const run = async () => {
      setSaving(true)
      try {
        // KPI SSOT = programs PATCH — draft → RHF 동기화 후 onBeforePersist(infoTriggerSave)
        // int32 초과 시드는 이미 clamp — 저장 직전 한 번 더 방어
        if (form && draft) {
          form.setValue(
            'kpiFinalParticipants',
            clampKpiDraftValue(draft.kpiFinalParticipants),
            { shouldDirty: true }
          )
          form.setValue(
            'kpiEducatedTeachers',
            clampKpiDraftValue(draft.kpiEducatedTeachers),
            { shouldDirty: true }
          )
          form.setValue('kpiFinalSchools', clampKpiDraftValue(draft.kpiFinalSchools), {
            shouldDirty: true,
          })
          form.setValue('kpiFinalClasses', clampKpiDraftValue(draft.kpiFinalClasses), {
            shouldDirty: true,
          })
        }

        if (onBeforePersist) {
          await onBeforePersist()
        }

        if (draft) {
          const commonInfoPayload: Partial<TrainedTeachersCommonInfo> = {
            kpi: {
              finalParticipants: clampKpiDraftValue(draft.kpiFinalParticipants) ?? 0,
              instructorCount: 0,
              volunteerCount: 0,
              finalSchools: clampKpiDraftValue(draft.kpiFinalSchools) ?? 0,
              finalClasses: clampKpiDraftValue(draft.kpiFinalClasses) ?? 0,
            },
            educationJournalEnabled: draft.educationJournalEnabled,
            teacherTrainingEnabled: draft.teacherTrainingEnabled,
            curriculumSessions:
              educationStructure === 'curriculum'
                ? draft.curriculumSessions
                : commonInfo.curriculumSessions,
            scheduleDetails:
              educationStructure === 'schedule'
                ? draft.scheduleDetails.map((detail, index) => ({
                    ...detail,
                    progressTimeSummary:
                      sessionRound === 'single'
                        ? joinProgressGroups(draft.progressGroupsByDetail[index] ?? [''])
                        : detail.progressTimeSummary,
                  }))
                : commonInfo.scheduleDetails,
          }

          const needsInfoDetailPatch =
            draft.educationJournalEnabled !== commonInfo.educationJournalEnabled ||
            draft.teacherTrainingEnabled !== commonInfo.teacherTrainingEnabled ||
            (educationStructure === 'curriculum' &&
              JSON.stringify(draft.curriculumSessions) !==
                JSON.stringify(commonInfo.curriculumSessions ?? [])) ||
            (educationStructure === 'schedule' &&
              JSON.stringify(commonInfoPayload.scheduleDetails) !==
                JSON.stringify(commonInfo.scheduleDetails ?? []))

          if (needsInfoDetailPatch) {
            if (onPersist) {
              // KPI는 programs PATCH만 — detail PATCH에 educatedTeachers 미포함
              await onPersist({
                commonInfo: commonInfoPayload as NonNullable<Program['generalCommonInfo']>,
              })
            } else {
              setSavedOverride({
                educatedTeachers: draft.kpiEducatedTeachers,
                commonInfo: commonInfoPayload,
              })
            }
          } else {
            // programs PATCH 만으로 KPI 저장 — 재조회 전 화면 즉시 반영
            setSavedOverride({
              educatedTeachers: draft.kpiEducatedTeachers,
              commonInfo: {
                ...commonInfo,
                kpi: commonInfoPayload.kpi,
              },
            })
          }
        }

        onSave?.()
      } catch {
        return
      } finally {
        setSaving(false)
      }
    }
    void run()
  }

  return (
    <div className="trained-teachers-common-info program-detail-fullpage-modal__info-tab">
      <div className="trained-teachers-common-info__header">
        <ProgramEditInfoActions
          isEditing={isEditMode}
          onEdit={onEdit ?? (() => {})}
          onCancel={onCancel ?? (() => {})}
          onSave={handleSave}
          saving={saving || persistPending}
          disabled={editDisabled}
        />
      </div>

      <BasicInfoSection
        program={displayProgram}
        sponsorName={sponsorName}
        createdByName={program.createdByName}
        updatedByName={program.updatedByName}
        lifecycleStatus={program.lifecycleStatus ?? undefined}
        forceCompanySchoolLayout
        hideIpsTypeField
        fixedParticipantTypeLabel="학교/기관"
        enableTitleEnEdit
        useDetailedProgramSelect
        isEditMode={isEditMode}
        form={form}
      />

      {/* 교육받은 교사 공통정보 기획 — 사업 KPI 목표 비노출 (다른 유형 KPI는 유지) */}

      <TrainedTeachersTypeSettingsSection
        educationStructure={baseEducationStructure}
        sessionRound={baseSessionRound}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />

      {educationStructure === 'curriculum' ? (
        <TrainedTeachersCurriculumSection
          sessionRound={sessionRound}
          commonInfo={{
            ...((commonInfo.curriculumSessions?.length ?? 0) > 0
              ? commonInfo
              : {
                  ...commonInfo,
                  curriculumSessions: [emptyCurriculumSession(sessionRound)],
                }),
            ipsScheduleDetail:
              (isEditMode && form
                ? form.watch('ipsScheduleDetail')
                : commonInfo.ipsScheduleDetail) ?? 'common',
            educationFormScheduleDetail:
              (isEditMode && form
                ? form.watch('educationFormScheduleDetail')
                : commonInfo.educationFormScheduleDetail) ?? 'common',
          }}
          isEditMode={isEditMode}
          draft={draft}
          updateDraft={updateDraft}
        />
      ) : (
        <TrainedTeachersScheduleSection
          sessionRound={sessionRound}
          commonInfo={{
            ...((commonInfo.scheduleDetails?.length ?? 0) > 0
              ? commonInfo
              : {
                  ...commonInfo,
                  scheduleDetails: [emptyScheduleDetail(sessionRound)],
                }),
            ipsScheduleDetail:
              (isEditMode && form
                ? form.watch('ipsScheduleDetail')
                : commonInfo.ipsScheduleDetail) ?? 'common',
            educationFormScheduleDetail:
              (isEditMode && form
                ? form.watch('educationFormScheduleDetail')
                : commonInfo.educationFormScheduleDetail) ?? 'common',
          }}
          isEditMode={isEditMode}
          draft={draft}
          updateDraft={updateDraft}
        />
      )}

      <TrainedTeachersScheduleSettingsSection
        educationStructure={educationStructure}
        sessionRound={sessionRound}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />
    </div>
  )
}

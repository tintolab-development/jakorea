/**
 * 교육받은 교사 프로그램 상세 — 공통 정보 (조회 / 정보 수정)
 *
 * 일반 프로그램 공통 정보 뷰(general/ui/detail-modal/info/common-info-view.tsx)의
 * 렌더 패턴을 교육받은 교사 전용으로 복제·단순화한 컴포넌트.
 * (program-type-isolation — 일반 뷰는 수정하지 않음)
 *
 * 케이스별 렌더:
 * - 커리큘럼형 단일: ■ N차시(단원명 및 교육 내용), IPS 차시 별 상이 시 IPS 행 추가
 * - 커리큘럼형 복수: ■ N회차(차시 및 교육 내용), 교육 형태·IPS 회차 별 상이 시 1단/2단 행
 * - 일정형 단일: ■ 세부 일정 NN(일정명/진행 시간 — 진행 그룹 A/B)
 * - 일정형 복수: ■ 행사 일정 NN(일정명/진행 일정) — 교육 진행 일정 설정 섹션 비노출
 * - 교육 연수 ON: 첫 진행 항목 타이틀·일정명 교육 연수 치환 (IPS Prepare 고정)
 *
 * 수정 모드: 기본 정보(form) · 유형 설정(구조·회차) · 교육일지 라디오 · 차시/회차/일정 추가·삭제 · 교육 연수 토글 · 진행 그룹 구분 추가
 * (진행 그룹은 전 테이블 동시 적용).
 * remote OFF 시 KPI/커리큘럼은 컴포넌트 로컬 오버레이 · 기본 정보는 `onBeforePersist`(programs PATCH).
 * remote ON 시 `onPersist` → `PATCH …/trained-teacher/detail` (+ `onBeforePersist`).
 */

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useCmsAlert } from '@/shared/ui'
import { isProgramTypeSettingsSaveBlocked } from '@/features/program/shared/lib/program-edit-window'
import {
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
} from '@/shared/lib/program-edit-window-error-message'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { BusinessPeriodExtendToolbar } from '@/features/program/shared/ui/business-period-extend-toolbar'
import { BasicInfoSection } from '@/features/program/shared/ui/program-detail/project-info/common-info/basic-info-section'
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { useEducationScheduleModeLineStash } from '@/features/program/shared/lib/education-schedule-mode-lines'
import {
  detailEditValuesToProgramPatch,
  resolveStoredEducationFormLabel,
  resolveStoredIpsTypeSummary,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { resolveStoredBusinessArea } from '@/features/program/shared/lib/program-detail-info-constants'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
} from '@/features/program/general/lib/variant'
import {
  GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS,
  formatGeneralProgramProgressSessionDisplay,
} from '@/features/program/general/lib/curriculum-progress-session-options'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  canRemoveEducationSchedulePreviewLine,
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import {
  resolveProgramRegistrationCurriculumEditDescription,
  resolveProgramRegistrationScheduleCurriculumEditDescription,
} from '@/features/template/lib/program-registration-curriculum-description'
import { ProgramRegistrationCurriculumTitleActions } from '@/features/program/shared/ui/program-registration-curriculum-title-actions'
import { TYPE_SETTINGS_PER_SCHEDULE_HINT } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  ProgramRegistrationIpsTypeFields,
  PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
  type ProgramRegistrationIpsCategory,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { buildSessionIpsTypeSummary } from '@/features/program/general/model/common-info-edit-schema'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/shared/paragraph-date-picker.css'
import '@/features/template/ui/shared/paragraph-time-picker.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import { stampTrainedTeachersSessionFields } from '@/features/program/trained-teachers/lib/stamp-session-fields'
import { validateTrainedTeachersCommonInfoDraft } from '@/features/program/trained-teachers/lib/validate-trained-teachers-common-info-draft'
import {
  applyTrainedTeachersProgressGroupsToScheduleDetails,
  buildTrainedTeachersCommonInfoSaveSlices,
  buildTrainedTeachersNestedCommonInfo,
  resolveTrainedTeachersCanonicalCommonInfo,
} from '@/features/program/trained-teachers/lib/common-info-persist'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
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

function progressGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

/** `그룹 A : 09:30 ~ 09:40 | 그룹 B : …` → 그룹별 시간 텍스트 배열 */
function parseProgressGroups(summary: string | undefined): string[] {
  const trimmed = summary?.trim()
  if (!trimmed || trimmed === '-') return ['']
  return trimmed.split(/\s*\|\s*/).map(part => part.replace(/^그룹\s*\S+\s*:\s*/, '').trim())
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

export function seedDraft(
  commonInfo: TrainedTeachersCommonInfo,
  educatedTeachers: number | undefined,
  totals: { totalParticipants?: number; participatingSchoolCount?: number } | undefined,
  _typeFields: {
    educationStructure: 'curriculum' | 'schedule'
    sessionRound: 'single' | 'multi'
  }
): TrainedTeachersCommonInfoDraft {
  const scheduleDetails = (commonInfo.scheduleDetails ?? []).map(detail => ({ ...detail }))
  const curriculumSessions = (commonInfo.curriculumSessions ?? []).map(session => ({
    ...session,
  }))

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
  description,
  titleTrailing,
  isFormEdit = false,
  required = false,
  highlightParagraphId,
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
  description?: string
  titleTrailing?: ReactNode
  isFormEdit?: boolean
  /** 수정 모드 + 등록 위저드에서 필수인 단락일 때 타이틀 `*` */
  required?: boolean
  highlightParagraphId?: string
}) {
  return (
    <section className="trained-teachers-common-info__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        description={description}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
        required={isFormEdit && required}
        highlightParagraphId={highlightParagraphId}
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

/** `A | B | C` 문자열을 세로 디바이더로 구분해 렌더 (일반 공통정보 뷰와 동일) */
function PipeSeparatedInlineView({ text }: { text: string | undefined | null }) {
  return renderDetailInfoPipeSeparated(text)
}

function ipsValueFromRowSummary(summary: string | undefined): ProgramRegistrationIpsTypeValue {
  const text = summary?.trim() ?? ''
  if (!text || text === '-') return PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT
  const parts = text
    .split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(part => part && part !== '일정 공통' && part !== '일정 별 상이')
  const categoryPart =
    parts.find(part => /inspire|prepare|succeed/i.test(part)) ?? parts[0] ?? ''
  const category = PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS.find(option =>
    categoryPart.toLowerCase().includes(option.value)
  )?.value
  if (!category) return PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT
  const detailPart = parts[parts.length - 1] ?? ''
  if (category === 'prepare' || /해당/.test(detailPart)) {
    return { category, detail: 'none' }
  }
  const options =
    category === 'inspire'
      ? PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS
      : PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS
  const matched = options.find(
    option =>
      option.value !== 'none' &&
      (detailPart === option.label || detailPart.includes(option.label))
  )
  return { category, detail: matched?.value ?? 'none' }
}

function PerScheduleIpsTypeField({
  summary,
  isFormEdit,
  fullRow,
  disabled,
  onChange,
}: {
  summary?: string
  isFormEdit: boolean
  fullRow?: boolean
  disabled?: boolean
  onChange?: (nextSummary: string) => void
}) {
  const value = disabled
    ? PROGRAM_REGISTRATION_IPS_PREPARE_NONE_DEFAULT
    : ipsValueFromRowSummary(summary)
  const viewText = disabled ? TEACHER_TRAINING_IPS_SUMMARY : summary?.trim() || '-'
  return (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow={fullRow}
      view={<PipeSeparatedInlineView text={viewText} />}
      edit={
        isFormEdit ? (
          <ProgramRegistrationIpsTypeFields
            layout="inline"
            disabled={disabled}
            value={value}
            onChange={next => {
              if (disabled) return
              onChange?.(buildSessionIpsTypeSummary(next.category, next.detail))
            }}
          />
        ) : undefined
      }
    />
  )
}

function PerScheduleEducationFormField({
  valueLabel,
  isFormEdit,
  fullRow,
  onChange,
}: {
  valueLabel?: string
  isFormEdit: boolean
  fullRow?: boolean
  onChange?: (nextLabel: string) => void
}) {
  const options = getProgramRegistrationEducationFormOptions(true, { context: 'perScheduleBlock' })
  const value = options.find(option => option.label === valueLabel)?.value ?? 'online'
  return (
    <DetailInfoForm.Field
      label="교육 형태"
      fullRow={fullRow}
      view={valueLabel?.trim() || '-'}
      edit={
        isFormEdit ? (
          <CmsRadioGroup
            size="medium"
            value={value}
            onChange={e => {
              const next = options.find(option => option.value === String(e.target.value))
              onChange?.(next?.label ?? '')
            }}
          >
            {options.map(option => (
              <CmsRadio size="medium" key={option.value} value={option.value}>
                {option.label}
              </CmsRadio>
            ))}
          </CmsRadioGroup>
        ) : undefined
      }
    />
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
  const isMulti = sessionRound === 'multi'
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
      {resolveStoredEducationFormLabel(commonInfo) || '-'}
    </>
  ) : (
    (resolveStoredEducationFormLabel(commonInfo) || '-')
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
      description={
        isFormEdit ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.editDescription : undefined
      }
      bodyClassName="trained-teachers-common-info__section-body--type-settings"
      isFormEdit={isFormEdit}
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.typeSettings}
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
            readOnlyDisplay={isFormEdit}
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            view={GENERAL_PROGRAM_SESSION_ROUND_LABELS[sessionRound]}
            readOnlyDisplay={isFormEdit}
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
                          size="medium"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio size="medium" value="common">일정 공통</CmsRadio>
                          <CmsRadio size="medium" value="perSchedule">일정 별 상이</CmsRadio>
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
                              inputSize="small"
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
                          size="medium"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio size="medium" value="common">일정 공통</CmsRadio>
                          <CmsRadio size="medium" value="perSchedule">일정 별 상이</CmsRadio>
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
                        size="medium"
                        value={field.value || undefined}
                        onChange={e => field.onChange(String(e.target.value))}
                      >
                        {educationFormOptions.map(option => (
                          <CmsRadio size="medium" key={option.value} value={option.value}>
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
                          size="medium"
                          value={field.value ?? 'common'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          <CmsRadio size="medium" value="common">일정 공통</CmsRadio>
                          <CmsRadio size="medium" value="perSchedule">일정 별 상이</CmsRadio>
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
                view={
                  <PipeSeparatedInlineView text={resolveStoredIpsTypeSummary(commonInfo)} />
                }
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
                size="medium"
                value={enabled ? 'yes' : 'no'}
                onChange={e => onChange?.(e.target.value === 'yes')}
              >
                <CmsRadio size="medium" value="yes">있음</CmsRadio>
                <CmsRadio size="medium" value="no">없음</CmsRadio>
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
                      inputSize="small"
                      placeholder="단원명을 입력하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      value={session.title}
                      onChange={e => onChange?.({ title: e.target.value })}
                    />
                    <DetailInfoForm.InputsSeparator />
                    <CmsInput
                      inputSize="small"
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
              <PerScheduleIpsTypeField
                summary={ipsSummary}
                isFormEdit={isFormEdit}
                fullRow
                disabled={ipsSummaryOverride != null}
                onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </DeletableBlockRow>
    </div>
  )
}

/** 커리큘럼형 복수 — ■ N회차 블록 (차시 및 교육 내용 + 상이 시 교육 형태·IPS 행, 교육 연수 치환 지원) */
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
                      inputSize="small"
                      withAllOption={false}
                      placeholder="진행 차시"
                      width={144}
                      options={GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS}
                      value={session.title || undefined}
                      onChange={v => onChange?.({ title: String(v ?? '') })}
                    />
                    <DetailInfoForm.InputsSeparator />
                    <CmsInput
                      inputSize="small"
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
          {showEducationPerRound && showIpsRow ? (
            <DetailInfoForm.Row type="double">
              <PerScheduleEducationFormField
                valueLabel={session.educationFormLabel}
                isFormEdit={isFormEdit}
                onChange={nextLabel => onChange?.({ educationFormLabel: nextLabel })}
              />
              <PerScheduleIpsTypeField
                summary={ipsSummary}
                isFormEdit={isFormEdit}
                disabled={ipsSummaryOverride != null}
                onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
              />
            </DetailInfoForm.Row>
          ) : showEducationPerRound ? (
            <DetailInfoForm.Row type="single">
              <PerScheduleEducationFormField
                valueLabel={session.educationFormLabel}
                isFormEdit={isFormEdit}
                fullRow
                onChange={nextLabel => onChange?.({ educationFormLabel: nextLabel })}
              />
            </DetailInfoForm.Row>
          ) : showIpsRow ? (
            <DetailInfoForm.Row type="single">
              <PerScheduleIpsTypeField
                summary={ipsSummary}
                isFormEdit={isFormEdit}
                fullRow
                disabled={ipsSummaryOverride != null}
                onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
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
            ? { sessionLabel: '', title: '1', description: '' }
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
      description={
        isFormEdit ? resolveProgramRegistrationCurriculumEditDescription(sessionRound) : undefined
      }
      bodyClassName="trained-teachers-common-info__section-body--curriculum"
      isFormEdit={isFormEdit}
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      titleTrailing={
        isFormEdit ? (
          <ProgramRegistrationCurriculumTitleActions
            variant="trainedTeachers"
            programType="curriculum"
            sessionRoundType={sessionRound}
            participantOrganization
            educationFormScheduleDetail={commonInfo.educationFormScheduleDetail ?? 'common'}
            participationScheduleDetail={commonInfo.participationScheduleDetail ?? 'common'}
            ipsScheduleDetail={commonInfo.ipsScheduleDetail ?? 'common'}
            scheduleCurriculumPreEducation={draft.teacherTrainingEnabled}
            onScheduleCurriculumPreEducationChange={() => {}}
            curriculumChartSessionCount={sessions.length}
            onAddCurriculumSession={addSession}
            onAddCurriculumChartSession={addSession}
            onAddScheduleCurriculumDetail={() => {}}
            onAddScheduleCurriculumGroup={() => {}}
            trainedTeachersTeacherTrainingEnabled={draft.teacherTrainingEnabled}
            onTrainedTeachersTeacherTrainingEnabledChange={next =>
              updateDraft(d => ({ ...d, teacherTrainingEnabled: next }))
            }
          />
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
            showEducationPerRound={showEducationPerRound && !isTeacherTrainingBlock}
            showIpsPerRound={showIpsPerRound}
            isFormEdit={isFormEdit}
            showDelete={sessions.length >= 2 && !isTeacherTrainingBlock}
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
            showDelete={sessions.length >= 2 && !isTeacherTrainingBlock}
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
    <ParagraphTimePicker inputSize="small"
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
                      inputSize="small"
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
                    </div>
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
            {showIpsPerSchedule ? (
              <DetailInfoForm.Row type="single">
                <PerScheduleIpsTypeField
                  summary={detail.ipsTypeSummary}
                  isFormEdit={isFormEdit}
                  fullRow
                  onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
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
  const showEducationForm = showEducationPerSchedule && !isTeacherTrainingBlock
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
                      inputSize="small"
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
                    <ParagraphDatePicker inputSize="small"
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
            {showEducationForm && showIpsPerSchedule ? (
              <DetailInfoForm.Row type="double">
                <PerScheduleEducationFormField
                  valueLabel={detail.educationFormLabel}
                  isFormEdit={isFormEdit}
                  onChange={nextLabel => onChange?.({ educationFormLabel: nextLabel })}
                />
                <PerScheduleIpsTypeField
                  summary={ipsSummary}
                  isFormEdit={isFormEdit}
                  disabled={isTeacherTrainingBlock}
                  onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
                />
              </DetailInfoForm.Row>
            ) : showEducationForm ? (
              <DetailInfoForm.Row type="single">
                <PerScheduleEducationFormField
                  valueLabel={detail.educationFormLabel}
                  isFormEdit={isFormEdit}
                  fullRow
                  onChange={nextLabel => onChange?.({ educationFormLabel: nextLabel })}
                />
              </DetailInfoForm.Row>
            ) : showIpsPerSchedule ? (
              <DetailInfoForm.Row type="single">
                <PerScheduleIpsTypeField
                  summary={ipsSummary}
                  isFormEdit={isFormEdit}
                  fullRow
                  disabled={isTeacherTrainingBlock}
                  onChange={nextSummary => onChange?.({ ipsTypeSummary: nextSummary })}
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
      description={
        isFormEdit
          ? resolveProgramRegistrationScheduleCurriculumEditDescription({
              sessionRoundType: sessionRound,
              participantOrganization: true,
              educationFormScheduleDetail: commonInfo.educationFormScheduleDetail ?? 'common',
              participationScheduleDetail: commonInfo.participationScheduleDetail ?? 'common',
              ipsScheduleDetail: commonInfo.ipsScheduleDetail ?? 'common',
            })
          : undefined
      }
      bodyClassName="trained-teachers-common-info__section-body--schedule-curriculum"
      isFormEdit={isFormEdit}
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      titleTrailing={
        isFormEdit ? (
          <ProgramRegistrationCurriculumTitleActions
            variant="trainedTeachers"
            programType="schedule"
            sessionRoundType={sessionRound}
            participantOrganization
            educationFormScheduleDetail={commonInfo.educationFormScheduleDetail ?? 'common'}
            participationScheduleDetail={commonInfo.participationScheduleDetail ?? 'common'}
            ipsScheduleDetail={commonInfo.ipsScheduleDetail ?? 'common'}
            educationScheduleMode={
              (commonInfo.educationScheduleMode as ProgramRegistrationEducationScheduleMode | undefined) ??
              'date'
            }
            scheduleCurriculumPreEducation={draft.teacherTrainingEnabled}
            onScheduleCurriculumPreEducationChange={() => {}}
            curriculumChartSessionCount={1}
            onAddCurriculumSession={() => {}}
            onAddCurriculumChartSession={() => {}}
            onAddScheduleCurriculumDetail={addDetail}
            onAddScheduleCurriculumGroup={addGroupToAll}
            scheduleCurriculumGroupCount={draft.progressGroupsByDetail[0]?.length ?? 1}
            trainedTeachersTeacherTrainingEnabled={draft.teacherTrainingEnabled}
            onTrainedTeachersTeacherTrainingEnabledChange={next =>
              updateDraft(d => ({ ...d, teacherTrainingEnabled: next }))
            }
          />
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
              showDelete={details.length >= 2 && !isTeacherTrainingBlock}
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
            showDelete={details.length >= 2 && !isTeacherTrainingBlock}
            progressGroups={isFormEdit ? draft.progressGroupsByDetail[index] : undefined}
            onChange={patch => patchDetail(index, patch)}
            onGroupTimeChange={(groupIndex, next) => setGroupTime(index, groupIndex, next)}
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
  programId,
  operationStart,
  operationEnd,
  educationStructure,
  sessionRound,
  commonInfo,
  isEditMode = false,
  form,
}: {
  programId: string
  operationStart?: Program['startDate']
  operationEnd?: Program['endDate']
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  commonInfo: TrainedTeachersCommonInfo
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [periodDate, setPeriodDate] = useState<Dayjs | null>(null)
  const swapScheduleLinesForMode = useEducationScheduleModeLineStash()

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
    const target = current[index]
    if (target != null && !canRemoveEducationSchedulePreviewLine(target)) return
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

  const scheduleMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings

  return (
    <TrainedTeachersDetailSection
      title={scheduleMeta.title}
      description={isFormEdit ? scheduleMeta.editDescription : undefined}
      isFormEdit={isFormEdit}
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationScheduleSettings}
      titleTrailing={
        isFormEdit && form ? (
          <EducationScheduleChangeTitleAction
            programId={programId}
            scheduleLines={lines}
            educationScheduleMode={scheduleMode}
            operationStart={isFormEdit ? form.watch('startDate') : operationStart}
            operationEnd={isFormEdit ? form.watch('endDate') : operationEnd}
            persistedOperationStart={operationStart}
            persistedOperationEnd={operationEnd}
            onApply={nextLines => {
              form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
            }}
          />
        ) : undefined
      }
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
                      size="medium"
                      value={field.value ?? 'date'}
                      onChange={e => {
                        const next = e.target.value as 'date' | 'period'
                        const currentMode = (field.value ?? 'date') as 'date' | 'period'
                        if (next !== currentMode) {
                          const nextLines = swapScheduleLinesForMode(
                            currentMode,
                            next,
                            form.getValues('educationScheduleLines') ?? []
                          )
                          form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
                        }
                        field.onChange(next)
                      }}
                    >
                      <CmsRadio size="medium" value="date">날짜 지정</CmsRadio>
                      <CmsRadio size="medium" value="period">기간 지정</CmsRadio>
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
                  <ParagraphDatePicker inputSize="small"
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
                  <ParagraphDatePicker inputSize="small"
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
  /** programs PATCH 등 — onPersist / local overlay 전에 호출. nested·연수·일지를 A extra 에 실음 */
  onBeforePersist?: (progressTables?: Partial<TrainedTeachersCommonInfo>) => Promise<void>
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
  const { showAlert } = useCmsAlert()
  const baseCommonInfo = resolveTrainedTeachersCanonicalCommonInfo(program)

  // mock 저장 오버레이 — onPersist 없을 때만 세션 범위로 반영
  const [savedOverride, setSavedOverride] = useState<{
    commonInfo: Partial<TrainedTeachersCommonInfo>
    educatedTeachers: number | undefined
    /** programs PATCH 직후 GET echo 가 늦을 때 사업 분야 즉시 표시 */
    businessArea?: string
    generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
    registrationOverlay?: Program['registrationOverlay']
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
            ...(savedOverride.businessArea
              ? { businessArea: savedOverride.businessArea }
              : {}),
            educatedTeachers: savedOverride.educatedTeachers ?? program.educatedTeachers,
            generalCommonInfo: commonInfo,
            ...(savedOverride.generalSurveyMenuKeys !== undefined
              ? { generalSurveyMenuKeys: savedOverride.generalSurveyMenuKeys }
              : {}),
            ...(savedOverride.registrationOverlay !== undefined
              ? { registrationOverlay: savedOverride.registrationOverlay }
              : {}),
          }
        : program,
    [program, savedOverride, commonInfo]
  )

  useEffect(() => {
    setSavedOverride(null)
  }, [program.id])

  const resolvedTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const hasScheduleRows = (commonInfo.scheduleDetails?.length ?? 0) > 0
  const hasCurriculumRows = (commonInfo.curriculumSessions?.length ?? 0) > 0
  const baseEducationStructure =
    program.generalProgramEducationStructure === 'curriculum' ||
    program.generalProgramEducationStructure === 'schedule'
      ? resolvedTypeFields.educationStructure
      : hasScheduleRows && !hasCurriculumRows
        ? 'schedule'
        : resolvedTypeFields.educationStructure
  const baseSessionRound = resolvedTypeFields.sessionRound

  const educationStructure = baseEducationStructure
  const sessionRound = baseSessionRound

  const [draft, setDraft] = useState<TrainedTeachersCommonInfoDraft | null>(null)

  const updateDraft: DraftUpdater = update =>
    setDraft(current => (current ? update(current) : current))

  // 수정 모드 진입 시 현재 표시값으로 draft 시드 (페인트 전 — KPI 등 draft 의존 UI가 바로 편집 가능)
  useLayoutEffect(() => {
    if (isEditMode) {
      setDraft(
        seedDraft(
          { ...resolveTrainedTeachersCanonicalCommonInfo(program), ...savedOverride?.commonInfo },
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

  // 폼 reset은 부모 layout effect가 나중에 돌 수 있다. 구조 값이 비어 있으면 화면에 보인 유형을 폼에 넣는다.
  useEffect(() => {
    if (!isEditMode || !form) return
    if (!form.getValues('educationStructure')) {
      form.setValue('educationStructure', baseEducationStructure, { shouldDirty: false })
    }
    if (!form.getValues('sessionRound')) {
      form.setValue('sessionRound', baseSessionRound, { shouldDirty: false })
    }
  }, [isEditMode, form, baseEducationStructure, baseSessionRound])

  useEffect(() => {
    if (!isEditMode || !form || !draft) return
    form.setValue('trainedTeachersCurriculumSessions', draft.curriculumSessions, {
      shouldDirty: false,
    })
    form.setValue('trainedTeachersScheduleDetails', draft.scheduleDetails, {
      shouldDirty: false,
    })
    form.setValue('trainedTeachersProgressGroupsByDetail', draft.progressGroupsByDetail, {
      shouldDirty: false,
    })
    form.setValue('teacherTrainingEnabled', draft.teacherTrainingEnabled, { shouldDirty: false })
    form.setValue('educationJournalEnabled', draft.educationJournalEnabled, {
      shouldDirty: false,
    })
  }, [isEditMode, form, draft])

  const runSave = async () => {
      const typeSettingsValues = form?.getValues()
      if (
        isProgramTypeSettingsSaveBlocked(program, {
          educationStructure: typeSettingsValues?.educationStructure,
          sessionRound: typeSettingsValues?.sessionRound,
        })
      ) {
        void showAlert({
          title: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
          content: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
        })
        return
      }
      setSaving(true)
      const endOverlay = beginBlockingOverlay()
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
          form.setValue('teacherTrainingEnabled', draft.teacherTrainingEnabled, {
            shouldDirty: true,
          })
          form.setValue('educationJournalEnabled', draft.educationJournalEnabled, {
            shouldDirty: true,
          })
        }

        const persistStructure = baseEducationStructure
        const persistRound = baseSessionRound
        if (form) {
          form.setValue('educationStructure', persistStructure, { shouldDirty: true })
          form.setValue('sessionRound', persistRound, { shouldDirty: true })
        }
        const formPatchForRows = form
          ? detailEditValuesToProgramPatch(form.getValues(), program)
          : undefined
        const rowFields = {
          educationFormScheduleDetail: form?.getValues('educationFormScheduleDetail'),
          ipsScheduleDetail: form?.getValues('ipsScheduleDetail'),
          educationFormLabel: formPatchForRows?.generalCommonInfo?.educationFormLabel,
          ipsTypeSummary: formPatchForRows?.generalCommonInfo?.ipsTypeSummary,
        }
        const formValues = form?.getValues()
        const sourceSessions = (formValues?.trainedTeachersCurriculumSessions ??
          draft?.curriculumSessions) as GeneralProgramCurriculumSessionRow[] | undefined
        const sourceDetails = (formValues?.trainedTeachersScheduleDetails ??
          draft?.scheduleDetails) as GeneralProgramScheduleDetailRow[] | undefined
        const sourceGroups =
          formValues?.trainedTeachersProgressGroupsByDetail ??
          draft?.progressGroupsByDetail ??
          []
        const nested = buildTrainedTeachersNestedCommonInfo({
          educationStructure: persistStructure,
          curriculumSessions: stampTrainedTeachersSessionFields(sourceSessions, rowFields),
          scheduleDetails: stampTrainedTeachersSessionFields(
            sourceDetails
              ? applyTrainedTeachersProgressGroupsToScheduleDetails(
                  sourceDetails,
                  sourceGroups,
                  persistRound
                )
              : undefined,
            rowFields
          ),
        })
        const slices = buildTrainedTeachersCommonInfoSaveSlices({
          educationStructure: persistStructure,
          teacherTrainingEnabled: draft?.teacherTrainingEnabled === true,
          educationJournalEnabled: draft?.educationJournalEnabled === true,
          curriculumSessions: nested.curriculumSessions,
          scheduleDetails: nested.scheduleDetails,
          educationScheduleLines: form?.getValues('educationScheduleLines'),
          educationScheduleMode: form?.getValues('educationScheduleMode'),
        })
        const scheduleDetails = slices.extraCommonInfo.scheduleDetails
        const curriculumSessions = slices.extraCommonInfo.curriculumSessions

        if (draft) {
          const draftValidationMessage = validateTrainedTeachersCommonInfoDraft({
            educationStructure: persistStructure,
            sessionRound: persistRound,
            scheduleDetails: draft.scheduleDetails,
            progressGroupsByDetail: draft.progressGroupsByDetail,
            educationScheduleLines: form?.getValues('educationScheduleLines'),
          })
          if (draftValidationMessage) {
            void showAlert({
              title: '입력 확인',
              content: draftValidationMessage,
            })
            return
          }
        }

        if (onBeforePersist) {
          // A programs PATCH 는 RHF 기본정보만. 연수·일지·커리큘럼·일정은 B 전용.
          await onBeforePersist()
        }

        if (draft) {
          // onBeforePersist 가 상세 캐시를 갱신하면 폼이 구 program으로 reset될 수 있다.
          // 저장 직전 스냅샷(formPatchForRows)을 화면 반영에 쓴다.
          const formPatch = formPatchForRows
          const formCommonInfo = formPatch?.generalCommonInfo
          const savedBusinessArea =
            resolveStoredBusinessArea(formPatch?.businessArea) ||
            resolveStoredBusinessArea(program.businessArea) ||
            undefined
          const commonInfoPayload: Partial<TrainedTeachersCommonInfo> = {
            ...commonInfo,
            ...formCommonInfo,
            ...slices.infoDetailCommonInfo,
          }

          const kpiOverride = {
            finalParticipants: clampKpiDraftValue(draft.kpiFinalParticipants) ?? 0,
            instructorCount: 0,
            volunteerCount: 0,
            finalSchools: clampKpiDraftValue(draft.kpiFinalSchools) ?? 0,
            finalClasses: clampKpiDraftValue(draft.kpiFinalClasses) ?? 0,
          }

          const surveyOverride = {
            ...(formPatch?.generalSurveyMenuKeys !== undefined
              ? { generalSurveyMenuKeys: formPatch.generalSurveyMenuKeys }
              : {}),
          }

          if (onPersist) {
            // KPI는 programs PATCH만 — detail PATCH에 educatedTeachers·kpi 미포함
            await onPersist({
              commonInfo: commonInfoPayload as NonNullable<Program['generalCommonInfo']>,
            })
          }
          if (onBeforePersist || onPersist) {
            // remote: 부모 detail 쿼리(저장 직후 GET)가 SSOT.
            // savedOverride로 FE 값을 얹으면 서버 미반영인데 저장된 것처럼 보이다가 재진입 시 롤백된다.
            setSavedOverride(null)
          } else {
            setSavedOverride({
              educatedTeachers: draft.kpiEducatedTeachers,
              ...(savedBusinessArea ? { businessArea: savedBusinessArea } : {}),
              ...surveyOverride,
              commonInfo: {
                ...commonInfoPayload,
                kpi: kpiOverride,
                curriculumSessions,
                scheduleDetails,
              },
            })
          }
        }

        onSave?.()
      } catch {
        return
      } finally {
        endOverlay()
        setSaving(false)
      }
  }

  const handleSave = () => {
    void runSave()
  }

  return (
    <>
    <div className="trained-teachers-common-info program-detail-fullpage-modal__info-tab">
      <div className="trained-teachers-common-info__header">
        <BusinessPeriodExtendToolbar program={displayProgram} editDisabled={editDisabled}>
          <ProgramEditInfoActions
            isEditing={isEditMode}
            idleVariant="secondary"
            onEdit={onEdit ?? (() => {})}
            onCancel={onCancel ?? (() => {})}
            onSave={handleSave}
            saving={saving || persistPending}
            disabled={editDisabled}
          />
        </BusinessPeriodExtendToolbar>
      </div>

      {isEditMode ? (
        <TrainedTeachersDetailSection
          title="기본 정보"
          isFormEdit
          required
          highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
        >
          <BasicInfoSection
            program={displayProgram}
            sponsorName={sponsorName}
            createdByName={program.createdByName}
            updatedByName={program.updatedByName}
            lifecycleStatus={program.lifecycleStatus ?? undefined}
            forceCompanySchoolLayout
            hideIpsTypeField
            hideEducationPlace
            auditDateOnly
            hideFormTitles
            fixedParticipantTypeLabel="교사/강사"
            enableTitleEnEdit
            useDetailedProgramSelect
            announcementTitlePlaceholder="모집 시 노출될 프로그램명을 입력하세요"
            isEditMode={isEditMode}
            form={form}
          />
        </TrainedTeachersDetailSection>
      ) : (
        <TrainedTeachersDetailSection
          title="기본 정보"
          highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
        >
          <BasicInfoSection
            program={displayProgram}
            sponsorName={sponsorName}
            createdByName={program.createdByName}
            updatedByName={program.updatedByName}
            lifecycleStatus={program.lifecycleStatus ?? undefined}
            forceCompanySchoolLayout
            hideIpsTypeField
            hideEducationPlace
            auditDateOnly
            hideFormTitles
            fixedParticipantTypeLabel="교사/강사"
            enableTitleEnEdit
            useDetailedProgramSelect
            announcementTitlePlaceholder="모집 시 노출될 프로그램명을 입력하세요"
            isEditMode={isEditMode}
            form={form}
          />
        </TrainedTeachersDetailSection>
      )}

      {/* 교육받은 교사 공통정보 기획 — 사업 KPI 목표 비노출 (다른 유형 KPI는 유지) */}

      <TrainedTeachersTypeSettingsSection
        educationStructure={educationStructure}
        sessionRound={sessionRound}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />

      {educationStructure === 'curriculum' ? (
        <TrainedTeachersCurriculumSection
          sessionRound={sessionRound}
          commonInfo={{
            ...commonInfo,
            ipsScheduleDetail:
              isEditMode && form
                ? (form.watch('ipsScheduleDetail') ?? 'common')
                : commonInfo.ipsScheduleDetail,
            educationFormScheduleDetail:
              isEditMode && form
                ? (form.watch('educationFormScheduleDetail') ?? 'common')
                : commonInfo.educationFormScheduleDetail,
          }}
          isEditMode={isEditMode}
          draft={draft}
          updateDraft={updateDraft}
        />
      ) : (
        <TrainedTeachersScheduleSection
          sessionRound={sessionRound}
          commonInfo={{
            ...commonInfo,
            ipsScheduleDetail:
              isEditMode && form
                ? (form.watch('ipsScheduleDetail') ?? 'common')
                : commonInfo.ipsScheduleDetail,
            educationFormScheduleDetail:
              isEditMode && form
                ? (form.watch('educationFormScheduleDetail') ?? 'common')
                : commonInfo.educationFormScheduleDetail,
            educationScheduleMode:
              isEditMode && form
                ? (form.watch('educationScheduleMode') ?? 'date')
                : commonInfo.educationScheduleMode,
          }}
          isEditMode={isEditMode}
          draft={draft}
          updateDraft={updateDraft}
        />
      )}

      <TrainedTeachersScheduleSettingsSection
        programId={program.id}
        operationStart={program.startDate}
        operationEnd={program.endDate}
        educationStructure={educationStructure}
        sessionRound={sessionRound}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />
    </div>
    </>
  )
}

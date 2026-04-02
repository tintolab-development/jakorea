/**
 * 참여자·강사·봉사자 모집 섹션 + 풀페이지 모달 서브탭 레이아웃 통합
 */

import { Fragment, type ReactNode } from 'react'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { Controller } from 'react-hook-form'
import { AppInput } from '@/shared/ui/app-input'
import { AppRadio } from '@/shared/ui/app-radio'
import { AppSelect } from '@/shared/ui/app-select'
import { AppDatePicker } from '@/shared/ui/app-datepicker'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import type { ProgramDetailEditFormValues } from '../../../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getInstructorRecruitmentStatus,
  getRecruitmentStatus,
  getVolunteerRecruitmentStatus,
  INSTRUCTOR_TARGET_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
  RECRUITMENT_RADIO_OPTIONS,
  TARGET_LEVEL_LABEL,
  VOLUNTEER_TARGET_OPTIONS,
} from './program-detail-info-constants'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { ProjectInfoDetailInfoSection } from './project-info-detail-info-section'
import './project-info-recruitment-section.css'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : undefined)

const TARGET_LEVEL_OPTIONS = Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const STUDENT_LIST_OPTIONS = [
  { value: 'required' as const, label: '필요' },
  { value: 'not_required' as const, label: '불필요' },
]

function ProgramDetailContactReadRow({
  contactName,
  contactPhone,
  contactEmail,
  padEmptySegments,
}: {
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  /** true면 문의처·Tel·E-mail 세 칸을 항상 노출하고 빈 값은 '-' */
  padEmptySegments?: boolean
}) {
  if (padEmptySegments) {
    const segments = [
      `문의처 : ${contactName?.trim() || '-'}`,
      `Tel : ${contactPhone?.trim() || '-'}`,
      `E-mail : ${contactEmail?.trim() || '-'}`,
    ]
    return (
      <div className="program-detail-info-tab__contact-inline">
        {segments.map((text, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <DividerVertical
                height={13}
                className="program-detail-info-tab__contact-inline-divider"
              />
            ) : null}
            <span>{text}</span>
          </Fragment>
        ))}
      </div>
    )
  }

  const segments: string[] = []
  if (contactName?.trim()) segments.push(`문의처 : ${contactName.trim()}`)
  if (contactPhone?.trim()) segments.push(`Tel : ${contactPhone.trim()}`)
  if (contactEmail?.trim()) segments.push(`E-mail : ${contactEmail.trim()}`)

  if (segments.length === 0) return '-'

  return (
    <div className="program-detail-info-tab__contact-inline">
      {segments.map((text, i) => (
        <Fragment key={`${i}-${text}`}>
          {i > 0 ? (
            <DividerVertical
              height={13}
              className="program-detail-info-tab__contact-inline-divider"
            />
          ) : null}
          <span>{text}</span>
        </Fragment>
      ))}
    </div>
  )
}

function ProgramDetailDateMethodReadRow({
  dateIso,
  method,
}: {
  dateIso?: string | Date | null
  method?: string | null
}) {
  if (!dateIso) return '-'
  const dateLabel = formatDateOnly(dateIso)
  const methodLabel = method?.trim() ? method.trim() : '-'
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{dateLabel}</span>
      <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
      <span>{methodLabel}</span>
    </div>
  )
}

function ProgramDetailInterviewReadRow({
  start,
  end,
  method,
}: {
  start?: string | Date | null
  end?: string | Date | null
  method?: string | null
}) {
  if (!start || !end) return '-'
  const range = formatDateRange(start, end)
  const raw = method?.trim()
  const methodLabel = raw
    ? (INTERVIEW_METHOD_OPTIONS.find(o => o.value === raw)?.label ?? raw)
    : '-'
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{range}</span>
      <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
      <span>{methodLabel}</span>
    </div>
  )
}

/** 신청 기간 기준 모집 현황 → 프로그램 진행 상태 라벨·스타일(기본 정보 탭과 동일) */
const PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'planned',
  recruiting: 'recruiting_students',
  closed: 'matching_completed',
}

/** lifecycleStatus 기반 강사 모집 현황 → 프로그램 진행 상태 라벨·스타일(기본 정보 탭과 동일) */
const INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'instructor_recruitment_planned',
  recruiting: 'recruiting_instructors',
  closed: 'education_completed',
}

/** 봉사자 모집 현황(예정/중/마감) → 프로그램 진행 상태 클래스(참여자·강사 탭과 동일 색상 토큰) */
const VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'volunteer_recruitment_planned',
  recruiting: 'recruiting_volunteers',
  closed: 'document_processing_completed',
}

/** 봉사자 모집 현황 라벨 (모집 예정 / 모집 중 / 모집 마감) */
const VOLUNTEER_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '봉사자 모집 예정',
  recruiting: '봉사자 모집 중',
  closed: '봉사자 모집 마감',
}

export interface ParticipantRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function ParticipantRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: ParticipantRecruitmentSectionProps) {
  const isFormEdit = isEditMode && form
  const recruitmentStatus = isFormEdit
    ? getRecruitmentStatus({
        ...program,
        applicationStartDate: form.watch('applicationStartDate'),
        applicationEndDate: form.watch('applicationEndDate'),
      })
    : getRecruitmentStatus(program)
  const participantRecruitmentLifecycle =
    recruitmentStatus != null
      ? PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus]
      : null
  const targetLabel = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '-'
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod = program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate ? `${formatDateOnly(resultDate)} | ${resultMethod}` : '-'
  const maxClassCount = program.rounds?.[0]?.classCount
  const maxClassLabel = maxClassCount != null ? `${maxClassCount}개` : '-'
  const notes = program.oneLineIntroduction ?? '-'
  const studentListValue = isFormEdit
    ? form.watch('studentListRequired')
    : program.studentListRequired
  const studentListLabel =
    studentListValue != null
      ? (STUDENT_LIST_OPTIONS.find(o => o.value === studentListValue)?.label ?? '-')
      : '-'

  return (
    <>
      <div className="program-detail-info-tab__section-title">참여자 모집</div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                프로그램 운영 기간
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.startDate, program.endDate)
                )}
              </td>
              <th>참여자 모집 현황</th>
              <td>
                {participantRecruitmentLifecycle ? (
                  <span
                    className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${participantRecruitmentLifecycle.replace(/_/g, '-')}`}
                  >
                    {getProgramLifecycleLabel(participantRecruitmentLifecycle)}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                교육 대상
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="targetLevel"
                    control={form.control}
                    render={({ field }) => (
                      <AppSelect
                        value={field.value ?? undefined}
                        options={TARGET_LEVEL_OPTIONS}
                        onChange={v =>
                          field.onChange((v as 'elementary' | 'middle' | 'high') || undefined)
                        }
                        placeholder="대상"
                        allowClear
                        className="program-detail-info-tab__target-select"
                      />
                    )}
                  />
                ) : (
                  targetLabel
                )}
              </td>
              <th>
                교육 대상 상세
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="district"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역"
                        className="program-detail-info-tab__district-input"
                      />
                    )}
                  />
                ) : (
                  (program.district ?? '-')
                )}
              </td>
            </tr>
            <tr>
              <th>참여자 모집 기간</th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="applicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="applicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.applicationStartDate, program.applicationEndDate)
                )}
              </td>
              <th>결과 발표일 및 방법</th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="resultAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="resultAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="홈페이지 공지 및 담당교사 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  resultLine
                )}
              </td>
            </tr>
            <tr>
              <th>
                신청 가능 최대 학급 수
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form.watch('rounds.0') != null ? (
                  <Controller
                    name="rounds.0.classCount"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e => {
                          const n = parseInt(e.target.value, 10)
                          field.onChange(isNaN(n) ? undefined : n)
                        }}
                        className="program-detail-info-tab__max-class-count-input"
                      />
                    )}
                  />
                ) : (
                  maxClassLabel
                )}
              </td>
              <th>
                학생 명단 제출 여부
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="studentListRequired"
                    control={form.control}
                    render={({ field }) => (
                      <AppRadio.Group
                        {...field}
                        value={field.value ?? undefined}
                        onChange={e => field.onChange(e.target.value)}
                        options={STUDENT_LIST_OPTIONS}
                        className="program-detail-info-tab__recruitment-radio"
                      />
                    )}
                  />
                ) : (
                  studentListLabel
                )}
              </td>
            </tr>
            <tr>
              <th>
                문의처
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-inputs program-detail-info-tab__contact-inputs--even">
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">문의처</span>
                      <AppInput
                        placeholder="문의처"
                        value={sponsorName ?? ''}
                        readOnly
                        className="program-detail-info-tab__contact-name-input"
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">Tel</span>
                      <Controller
                        name="contactPhone"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="02-6085-6028"
                            className="program-detail-info-tab__contact-phone-input"
                          />
                        )}
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">E-mail</span>
                      <Controller
                        name="contactEmail"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="ujat@jakorea.org"
                            className="program-detail-info-tab__contact-email-input"
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <ProgramDetailContactReadRow
                    contactName={sponsorName}
                    contactPhone={program.contactPhone}
                    contactEmail={program.contactEmail}
                    padEmptySegments
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <Controller
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="비고"
                        className="program-detail-info-tab__notes-input"
                      />
                    )}
                  />
                ) : (
                  notes
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export interface InstructorRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function InstructorRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: InstructorRecruitmentSectionProps) {
  const recruitmentStatus = getInstructorRecruitmentStatus(program)
  const instructorRecruitmentLifecycle =
    recruitmentStatus != null ? INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus] : null

  const instructorTarget = program.instructorTarget ?? '성인'
  const instructorTargetDetail = program.instructorTargetDetail ?? '-'

  const notes =
    program.otherNotes ??
    program.oneLineIntroduction ??
    '상기 일정은 기관 사정에 따라 변동될 수 있습니다.'

  const isFormEdit = isEditMode && form

  return (
    <>
      <div className="program-detail-info-tab__section-title">강사 모집</div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                프로그램 운영 기간
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.startDate, program.endDate)
                )}
              </td>
              <th>강사 모집 현황</th>
              <td>
                {instructorRecruitmentLifecycle ? (
                  <span
                    className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${instructorRecruitmentLifecycle.replace(/_/g, '-')}`}
                  >
                    {getProgramLifecycleLabel(instructorRecruitmentLifecycle)}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                모집 대상
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="instructorTarget"
                    control={form.control}
                    render={({ field }) => (
                      <AppSelect
                        {...field}
                        value={field.value ?? '성인'}
                        options={INSTRUCTOR_TARGET_OPTIONS}
                        className="program-detail-info-tab__select program-detail-info-tab__select--instructor-target"
                      />
                    )}
                  />
                ) : (
                  instructorTarget
                )}
              </td>
              <th>
                모집 대상 상세
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="instructorTargetDetail"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="모집 대상 상세"
                        className="program-detail-info-tab__input"
                      />
                    )}
                  />
                ) : (
                  instructorTargetDetail
                )}
              </td>
            </tr>
            <tr>
              <th>
                강사 모집 기간
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="instructorApplicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="instructorApplicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(
                    program.instructorApplicationStartDate,
                    program.instructorApplicationEndDate
                  )
                )}
              </td>
              <th>
                1차 서류 합격자 발표
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="documentPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="documentPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailDateMethodReadRow
                    dateIso={program.documentPassAnnouncementDate}
                    method={program.documentPassAnnouncementMethod}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>
                2차 면접 심사
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <>
                    <div className="program-detail-info-tab__date-range program-detail-info-tab__date-range--interview">
                      <Controller
                        name="interviewStartDate"
                        control={form.control}
                        render={({ field }) => (
                          <AppDatePicker
                            value={toDayjs(field.value) as Dayjs | null}
                            onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                            format="YYYY. MM. DD"
                            className="program-detail-info-tab__date-picker"
                          />
                        )}
                      />
                      <span className="program-detail-info-tab__date-separator">~</span>
                      <Controller
                        name="interviewEndDate"
                        control={form.control}
                        render={({ field }) => (
                          <AppDatePicker
                            value={toDayjs(field.value) as Dayjs | null}
                            onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                            format="YYYY. MM. DD"
                            className="program-detail-info-tab__date-picker"
                          />
                        )}
                      />
                      <DividerVertical
                        height={13}
                        className="program-detail-info-tab__result-row-divider"
                      />
                      <Controller
                        name="interviewMethod"
                        control={form.control}
                        render={({ field }) => (
                          <AppSelect
                            value={field.value ?? undefined}
                            options={INTERVIEW_METHOD_OPTIONS}
                            onChange={v => field.onChange(v ?? undefined)}
                            placeholder="방법 선택"
                            className="program-detail-info-tab__select program-detail-info-tab__select--interview-method"
                          />
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <ProgramDetailInterviewReadRow
                    start={program.interviewStartDate}
                    end={program.interviewEndDate}
                    method={program.interviewMethod}
                  />
                )}
              </td>
              <th>
                최종 합격자 발표
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="finalPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="finalPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailDateMethodReadRow
                    dateIso={program.finalPassAnnouncementDate}
                    method={program.finalPassAnnouncementMethod}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>
                문의처
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-fields">
                    <span className="program-detail-info-tab__contact-label">문의처</span>
                    <Controller
                      name="managerName"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="문의처 담당자명"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--name"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <span className="program-detail-info-tab__contact-label">Tel</span>
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Tel"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--phone"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <span className="program-detail-info-tab__contact-label">E-mail</span>
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="E-mail"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--email"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailContactReadRow
                    contactName={sponsorName ?? program.managerName}
                    contactPhone={program.contactPhone}
                    contactEmail={program.contactEmail}
                    padEmptySegments
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <Controller
                    name="otherNotes"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="상기 일정은 기관 사정에 따라 변동될 수 있습니다."
                      />
                    )}
                  />
                ) : (
                  notes
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export interface VolunteerRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function VolunteerRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: VolunteerRecruitmentSectionProps) {
  const recruitmentStatus = getVolunteerRecruitmentStatus(program)
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? (VOLUNTEER_RECRUITMENT_LABELS[recruitmentStatus] ??
        RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ??
        '-')
      : '-'
  const volunteerRecruitmentLifecycle =
    recruitmentStatus != null ? VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus] : null

  const volunteerTarget = program.volunteerTarget ?? '대학(원)생'
  const volunteerTargetDetail = program.volunteerTargetDetail ?? '-'

  const volunteerStart =
    program.volunteerApplicationStartDate ??
    program.instructorApplicationStartDate ??
    program.applicationStartDate
  const volunteerEnd =
    program.volunteerApplicationEndDate ??
    program.instructorApplicationEndDate ??
    program.applicationEndDate

  const notes = (program.oneLineIntroduction ?? '').trim() || '-'

  const isFormEdit = isEditMode && form

  return (
    <>
      <div className="program-detail-info-tab__section-title">봉사자 모집</div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                프로그램 운영 기간
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.startDate, program.endDate)
                )}
              </td>
              <th>봉사자 모집 현황</th>
              <td>
                {volunteerRecruitmentLifecycle ? (
                  <span
                    className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${volunteerRecruitmentLifecycle.replace(/_/g, '-')}`}
                  >
                    {recruitmentStatusLabel}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                모집 대상
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="volunteerTarget"
                    control={form.control}
                    render={({ field }) => (
                      <AppSelect
                        value={field.value ?? undefined}
                        options={VOLUNTEER_TARGET_OPTIONS}
                        onChange={v => field.onChange(v ?? undefined)}
                        allowClear
                        placeholder="모집 대상 선택"
                      />
                    )}
                  />
                ) : (
                  volunteerTarget
                )}
              </td>
              <th>
                모집 대상 상세
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="volunteerTargetDetail"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="모집 대상 상세"
                        className="program-detail-info-tab__cell-input"
                      />
                    )}
                  />
                ) : (
                  volunteerTargetDetail
                )}
              </td>
            </tr>
            <tr>
              <th>
                봉사자 모집 기간
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="volunteerApplicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="volunteerApplicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(volunteerStart, volunteerEnd)
                )}
              </td>
              <th>
                1차 서류 합격자 발표
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="documentPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="documentPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="홈페이지 공지 및 합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailDateMethodReadRow
                    dateIso={program.documentPassAnnouncementDate}
                    method={program.documentPassAnnouncementMethod}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>
                2차 면접 심사
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range program-detail-info-tab__date-range--interview">
                    <Controller
                      name="interviewStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="interviewEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="interviewMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppSelect
                          value={field.value ?? undefined}
                          options={INTERVIEW_METHOD_OPTIONS}
                          onChange={v => field.onChange(v ?? undefined)}
                          placeholder="방법 선택"
                          className="program-detail-info-tab__select program-detail-info-tab__select--interview-method"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailInterviewReadRow
                    start={program.interviewStartDate}
                    end={program.interviewEndDate}
                    method={program.interviewMethod}
                  />
                )}
              </td>
              <th>
                최종 합격자 발표
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="finalPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <AppDatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__result-row-divider"
                    />
                    <Controller
                      name="finalPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="홈페이지 공지 및 합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  <ProgramDetailDateMethodReadRow
                    dateIso={program.finalPassAnnouncementDate}
                    method={program.finalPassAnnouncementMethod}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>
                문의처
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-inputs program-detail-info-tab__contact-inputs--even">
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">문의처</span>
                      <AppInput
                        placeholder="문의처"
                        value={sponsorName ?? ''}
                        readOnly
                        className="program-detail-info-tab__contact-name-input"
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">Tel</span>
                      <Controller
                        name="contactPhone"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="02-6347-6113"
                            className="program-detail-info-tab__contact-phone-input"
                          />
                        )}
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">E-mail</span>
                      <Controller
                        name="contactEmail"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="ujat@jakorea.org"
                            className="program-detail-info-tab__contact-email-input"
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <ProgramDetailContactReadRow
                    contactName={sponsorName ?? program.managerName}
                    contactPhone={program.contactPhone}
                    contactEmail={program.contactEmail}
                    padEmptySegments
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <Controller
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="비고"
                        className="program-detail-info-tab__notes-input"
                      />
                    )}
                  />
                ) : (
                  notes
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export function ProjectInfoRecruitmentSection({
  recruitment,
  detail,
}: {
  recruitment: ReactNode
  detail: ReactNode
}) {
  return (
    <div className="program-detail-fullpage-modal__info-tab">
      {recruitment}
      <ProjectInfoDetailInfoSection>{detail}</ProjectInfoDetailInfoSection>
    </div>
  )
}

/**
 * 강사 모집 섹션 (강사 정보 탭 전용)
 * - 읽기 전용 2×2 테이블: 프로그램 운영 기간, 강사 모집 현황, 모집 대상, 모집 대상 상세,
 *   강사 모집 기간, 1차 서류 합격자 발표, 2차 면접 심사, 최종 합격자 발표, 문의처, 비고
 * - 수정 모드: react-hook-form Controller, 강사 모집 현황만 읽기 전용 유지
 */

import { DatePicker, Input, Select } from 'antd'
import { Controller } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getInstructorRecruitmentStatus,
  INSTRUCTOR_TARGET_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
  RECRUITMENT_RADIO_OPTIONS,
} from './program-detail-info-constants'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import './program-detail-info-tab.css'

const { TextArea } = Input

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

/** 강사 모집 현황 라벨 (모집 예정 / 모집 중 / 모집 마감) */
const INSTRUCTOR_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '강사 모집 예정',
  recruiting: '강사 모집 중',
  closed: '강사 모집 마감',
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
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? INSTRUCTOR_RECRUITMENT_LABELS[recruitmentStatus] ??
        RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ??
        '-'
      : '-'

  const instructorTarget = program.instructorTarget ?? '성인'
  const instructorTargetDetail = program.instructorTargetDetail ?? '-'

  const contactParts = [
    (sponsorName ?? program.managerName) && `문의처 : ${sponsorName ?? program.managerName ?? ''}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine = contactParts.length > 0 ? contactParts.join(' | ') : '-'

  const documentPassLine = program.documentPassAnnouncementDate
    ? `${formatDateOnly(program.documentPassAnnouncementDate)}${program.documentPassAnnouncementMethod ? ` | ${program.documentPassAnnouncementMethod}` : ''}`
    : '-'

  const interviewLine =
    program.interviewStartDate && program.interviewEndDate
      ? `${formatDateRange(program.interviewStartDate, program.interviewEndDate)}${program.interviewMethod ? ` | ${program.interviewMethod}` : ''}`
      : '-'

  const finalPassLine = program.finalPassAnnouncementDate
    ? `${formatDateOnly(program.finalPassAnnouncementDate)}${program.finalPassAnnouncementMethod ? ` | ${program.finalPassAnnouncementMethod}` : ''}`
    : '-'

  const notes =
    program.otherNotes ??
    program.oneLineIntroduction ??
    '상기 일정은 기관 사정에 따라 변동될 수 있습니다.'

  const isFormEdit = isEditMode && form

  return (
    <>
      <h3 className="program-detail-info-tab__section-title">강사 모집</h3>
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
                        <DatePicker
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
                        <DatePicker
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
                {recruitmentStatus != null ? (
                  <span
                    className={`program-detail-info-tab__recruitment-status-text program-detail-info-tab__recruitment-status-text--${recruitmentStatus}`}
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
                      name="instructorTarget"
                      control={form.control}
                      render={({ field }) => (
                        <Select
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
                      <Input
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
                        <DatePicker
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
                        <DatePicker
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
                        <DatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="documentPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  documentPassLine
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
                    <div className="program-detail-info-tab__date-range">
                      <Controller
                        name="interviewStartDate"
                        control={form.control}
                        render={({ field }) => (
                          <DatePicker
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
                          <DatePicker
                            value={toDayjs(field.value) as Dayjs | null}
                            onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                            format="YYYY. MM. DD"
                            className="program-detail-info-tab__date-picker"
                          />
                        )}
                      />
                    </div>
                    <Controller
                      name="interviewMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ?? undefined}
                          options={INTERVIEW_METHOD_OPTIONS}
                          placeholder="방법 선택"
                          className="program-detail-info-tab__select program-detail-info-tab__select--interview-method"
                        />
                      )}
                    />
                  </>
                ) : (
                  interviewLine
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
                        <DatePicker
                          value={toDayjs(field.value) as Dayjs | null}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="finalPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  finalPassLine
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
                    <Controller
                      name="managerName"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="문의처 담당자명"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--name"
                        />
                      )}
                    />
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Tel"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--phone"
                        />
                      )}
                    />
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="E-mail"
                          className="program-detail-info-tab__input program-detail-info-tab__contact-input--email"
                        />
                      )}
                    />
                  </div>
                ) : (
                  contactLine
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
                      <TextArea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="상기 일정은 기관 사정에 따라 변동될 수 있습니다."
                        rows={3}
                        className="program-detail-info-tab__content-textarea"
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

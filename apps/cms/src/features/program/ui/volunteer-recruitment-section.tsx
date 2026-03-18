/**
 * 봉사자 모집 섹션 (봉사자 정보 탭 전용)
 * - 읽기 전용 2×2 테이블: 프로그램 운영 기간, 봉사자 모집 현황, 모집 대상, 모집 대상 상세,
 *   봉사자 모집 기간, 1차 서류 합격자 발표, 2차 면접 심사, 최종 합격자 발표, 문의처, 비고
 * - 수정 모드: 봉사자 모집 현황만 읽기 전용, 나머지 필드 입력 가능
 * - program-detail-info-tab 스타일 재사용 (강사/참여자 모집 섹션과 동일 레이아웃)
 */

import { Input, Select, DatePicker } from 'antd'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getVolunteerRecruitmentStatus,
  RECRUITMENT_RADIO_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
  VOLUNTEER_TARGET_OPTIONS,
} from './program-detail-info-constants'
import './program-detail-info-tab.css'

const { TextArea } = Input

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : undefined)

/** 봉사자 모집 현황 라벨 (모집 예정 / 모집 중 / 모집 마감) */
const VOLUNTEER_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '봉사자 모집 예정',
  recruiting: '봉사자 모집 중',
  closed: '봉사자 모집 마감',
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
      ? VOLUNTEER_RECRUITMENT_LABELS[recruitmentStatus] ??
        RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ??
        '-'
      : '-'

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

  const contactParts = [
    sponsorName && `문의처 : ${sponsorName}`,
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

  const notes = program.oneLineIntroduction ?? '-'

  const isFormEdit = isEditMode && form

  return (
    <>
      <h3 className="program-detail-info-tab__section-title">봉사자 모집</h3>
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
                        <DatePicker
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
                    name="volunteerTarget"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        options={VOLUNTEER_TARGET_OPTIONS}
                        onChange={v => field.onChange(v ?? undefined)}
                        style={{ width: '100%' }}
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
                      <Input
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
                        <DatePicker
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
                        <DatePicker
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
                        <DatePicker
                          value={toDayjs(field.value)}
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
                          placeholder="홈페이지 공지 및 합격자 개별 안내"
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
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="interviewStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
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
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="interviewMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          options={INTERVIEW_METHOD_OPTIONS}
                          onChange={v => field.onChange(v ?? undefined)}
                          className="program-detail-info-tab__interview-method-select"
                          allowClear
                          placeholder="방식"
                        />
                      )}
                    />
                  </div>
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
                          value={toDayjs(field.value)}
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
                          placeholder="홈페이지 공지 및 합격자 개별 안내"
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
                  <div className="program-detail-info-tab__contact-inputs">
                    <Input
                      placeholder="문의처명"
                      value={sponsorName ?? ''}
                      readOnly
                      className="program-detail-info-tab__contact-name-readonly"
                    />
                    <span className="program-detail-info-tab__contact-divider" aria-hidden>
                      |
                    </span>
                    <span className="program-detail-info-tab__contact-label">Tel</span>
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="02-6347-6113"
                          className="program-detail-info-tab__contact-phone-input"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__contact-divider" aria-hidden>
                      |
                    </span>
                    <span className="program-detail-info-tab__contact-label">E-mail</span>
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="ujat@jakorea.org"
                          className="program-detail-info-tab__contact-email-input"
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
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        value={field.value ?? ''}
                        rows={3}
                        placeholder="비고"
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

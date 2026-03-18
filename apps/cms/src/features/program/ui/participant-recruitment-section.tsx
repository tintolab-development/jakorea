/**
 * 참여자 모집 섹션 (참여자 정보 탭 전용)
 * - 읽기 전용: 참여자 모집 현황
 * - 수정 모드: 프로그램 운영 기간, 교육 대상, 참여자 모집 기간, 결과 발표일 및 방법,
 *   신청 가능 최대 학급 수, 문의처, 비고 등 Controller + DatePicker/Select/Input
 * - program-detail-info-tab 스타일 재사용
 */

import { Controller } from 'react-hook-form'
import { Input, Select, DatePicker, Radio } from 'antd'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getRecruitmentStatus,
  RECRUITMENT_RADIO_OPTIONS,
  TARGET_LEVEL_LABEL,
} from './program-detail-info-constants'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import './program-detail-info-tab.css'

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
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ?? '-'
      : '-'
  const targetLabel = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '-'
  const contactParts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine = contactParts.length > 0 ? contactParts.join(' | ') : '-'
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod =
    program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate
    ? `${formatDateOnly(resultDate)} | ${resultMethod}`
    : '-'
  const maxClassCount = program.rounds?.[0]?.classCount
  const maxClassLabel = maxClassCount != null ? `${maxClassCount}개` : '-'
  const notes = program.oneLineIntroduction ?? '-'
  const studentListValue = isFormEdit
    ? form.watch('studentListRequired')
    : program.studentListRequired
  const studentListLabel =
    studentListValue != null
      ? STUDENT_LIST_OPTIONS.find(o => o.value === studentListValue)?.label ?? '-'
      : '-'

  return (
    <>
      <h3 className="program-detail-info-tab__section-title">참여자 모집</h3>
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
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
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
              <th>참여자 모집 현황</th>
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
                교육 대상
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="targetLevel"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        options={TARGET_LEVEL_OPTIONS}
                        onChange={v =>
                          field.onChange(
                            (v as 'elementary' | 'middle' | 'high') || undefined
                          )
                        }
                        placeholder="대상"
                        style={{ width: '100%' }}
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
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="district"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역"
                        className="program-detail-info-tab__district-input"
                      />
                    )}
                  />
                ) : (
                  program.district ?? '-'
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
                      name="applicationEndDate"
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
                  formatDateRange(
                    program.applicationStartDate,
                    program.applicationEndDate
                  )
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
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d =>
                            field.onChange(d ? d.toISOString() : undefined)
                          }
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="resultAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
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
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
              </th>
              <td>
                {isFormEdit && form.watch('rounds.0') != null ? (
                  <Controller
                    name="rounds.0.classCount"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e => {
                          const n = parseInt(e.target.value, 10)
                          field.onChange(isNaN(n) ? undefined : n)
                        }}
                        className="program-detail-info-tab__capacity-input"
                      />
                    )}
                  />
                ) : (
                  maxClassLabel
                )}
              </td>
              <th>
                학생 명단 제출 여부
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="studentListRequired"
                    control={form.control}
                    render={({ field }) => (
                      <Radio.Group
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
                {isFormEdit ? (
                  <span className="program-detail-info-tab__required">*</span>
                ) : null}
              </th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-inputs program-detail-info-tab__contact-inputs--even">
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">문의처</span>
                      <Input
                        placeholder="문의처"
                        value={sponsorName ?? ''}
                        readOnly
                        className="program-detail-info-tab__contact-name-input"
                      />
                    </div>
                    <span className="program-detail-info-tab__contact-divider">|</span>
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">Tel</span>
                      <Controller
                        name="contactPhone"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            placeholder="02-6085-6028"
                            className="program-detail-info-tab__contact-phone-input"
                          />
                        )}
                      />
                    </div>
                    <span className="program-detail-info-tab__contact-divider">|</span>
                    <div className="program-detail-info-tab__contact-group">
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
                      <Input
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

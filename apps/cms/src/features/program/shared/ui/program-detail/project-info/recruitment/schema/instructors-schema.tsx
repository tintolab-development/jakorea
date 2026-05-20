import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  INSTRUCTOR_TARGET_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { SectionSchema } from '@/features/program/shared/model/recruitment-schema'
import {
  DateRangeEdit,
  ProgramDetailContactReadRow,
  ProgramDetailDateMethodReadRow,
  ProgramDetailInterviewReadRow,
} from '../components/recruitment-form-parts'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsDatePicker, CmsInput } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

export type InstructorsSchemaParams = {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  isEdit: boolean
  sponsorName?: string
  instructorRecruitmentLifecycle: ProgramLifecycleStatus | null
  instructorTarget: string
  instructorTargetDetail: string
  notes: string
}

export function createInstructorsSchema({
  program,
  form,
  isEdit,
  sponsorName,
  instructorRecruitmentLifecycle,
  instructorTarget,
  instructorTargetDetail,
  notes,
}: InstructorsSchemaParams): SectionSchema {
  return {
    rows: [
      {
        columns: 2,
        fields: [
          {
            label: '프로그램 운영 기간',
            required: true,
            view: formatDateRange(program.startDate, program.endDate),
            edit:
              isEdit && form ? (
                <DateRangeEdit
                  form={form}
                  startName="startDate"
                  endName="endDate"
                  clearToUndefined
                />
              ) : undefined,
          },
          {
            label: '강사 모집 현황',
            view: instructorRecruitmentLifecycle ? (
              <span
                className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${instructorRecruitmentLifecycle.replace(/_/g, '-')}`}
              >
                {getProgramLifecycleLabel(instructorRecruitmentLifecycle)}
              </span>
            ) : (
              '-'
            ),
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            label: '모집 대상',
            required: true,
            view: instructorTarget,
            edit:
              isEdit && form ? (
                <Controller
                  name="instructorTarget"
                  control={form.control}
                  render={({ field }) => (
                    <CmsSelect
                      {...field}
                      value={field.value ?? '성인'}
                      options={INSTRUCTOR_TARGET_OPTIONS}
                    />
                  )}
                />
              ) : undefined,
          },
          {
            label: '모집 대상 상세',
            required: true,
            view: instructorTargetDetail,
            edit:
              isEdit && form ? (
                <Controller
                  name="instructorTargetDetail"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput {...field} value={field.value ?? ''} placeholder="모집 대상 상세" />
                  )}
                />
              ) : undefined,
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            label: '강사 모집 기간',
            required: true,
            view: formatDateRange(
              program.instructorApplicationStartDate,
              program.instructorApplicationEndDate
            ),
            edit:
              isEdit && form ? (
                <DateRangeEdit
                  form={form}
                  startName="instructorApplicationStartDate"
                  endName="instructorApplicationEndDate"
                  clearToUndefined
                />
              ) : undefined,
          },
          {
            label: '1차 서류 합격자 발표',
            required: true,
            view: (
              <ProgramDetailDateMethodReadRow
                dateIso={program.documentPassAnnouncementDate}
                method={program.documentPassAnnouncementMethod}
              />
            ),
            edit:
              isEdit && form ? (
                <div className="program-detail-info-tab__result-row">
                  <Controller
                    name="documentPassAnnouncementDate"
                    control={form.control}
                    render={({ field }) => (
                      <CmsDatePicker
                        value={toDayjs(field.value as string | Date | undefined) as Dayjs | null}
                        onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                        format="YYYY. MM. DD"
                        className="program-detail-info-tab__date-picker"
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name="documentPassAnnouncementMethod"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="합격자 개별 안내"
                      />
                    )}
                  />
                </div>
              ) : undefined,
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            label: '2차 면접 심사',
            required: true,
            view: (
              <ProgramDetailInterviewReadRow
                start={program.interviewStartDate}
                end={program.interviewEndDate}
                method={program.interviewMethod}
              />
            ),
            edit:
              isEdit && form ? (
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name="interviewStartDate"
                    control={form.control}
                    render={({ field }) => (
                      <CmsDatePicker
                        width={'30%'}
                        value={toDayjs(field.value as string | Date | undefined) as Dayjs | null}
                        onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                        format="YYYY. MM. DD"
                      />
                    )}
                  />
                  <span>~</span>
                  <Controller
                    name="interviewEndDate"
                    control={form.control}
                    render={({ field }) => (
                      <CmsDatePicker
                        width={'30%'}
                        value={toDayjs(field.value as string | Date | undefined) as Dayjs | null}
                        onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                        format="YYYY. MM. DD"
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name="interviewMethod"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        width={'25%'}
                        value={field.value ?? undefined}
                        options={INTERVIEW_METHOD_OPTIONS}
                        onChange={v => field.onChange(v ?? undefined)}
                        placeholder="방법 선택"
                      />
                    )}
                  />
                </div>
              ) : undefined,
          },
          {
            label: '최종 합격자 발표',
            required: true,
            view: (
              <ProgramDetailDateMethodReadRow
                dateIso={program.finalPassAnnouncementDate}
                method={program.finalPassAnnouncementMethod}
              />
            ),
            edit:
              isEdit && form ? (
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name="finalPassAnnouncementDate"
                    control={form.control}
                    render={({ field }) => (
                      <CmsDatePicker
                        value={toDayjs(field.value as string | Date | undefined) as Dayjs | null}
                        onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                        format="YYYY. MM. DD"
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name="finalPassAnnouncementMethod"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="합격자 개별 안내"
                      />
                    )}
                  />
                </div>
              ) : undefined,
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            label: '문의처',
            required: true,
            fullRow: true,
            view: (
              <ProgramDetailContactReadRow
                contactName={sponsorName ?? program.managerName}
                contactPhone={program.contactPhone}
                contactEmail={program.contactEmail}
                padEmptySegments
              />
            ),
            edit:
              isEdit && form ? (
                <div className="detail-info-form-inputs-wrapper">
                  <span>문의처</span>
                  <Controller
                    name="managerName"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="문의처 담당자명"
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <span>Tel</span>
                  <Controller
                    name="contactPhone"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput {...field} value={field.value ?? ''} placeholder="Tel" />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <span>E-mail</span>
                  <Controller
                    name="contactEmail"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput {...field} value={field.value ?? ''} placeholder="E-mail" />
                    )}
                  />
                </div>
              ) : undefined,
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            label: '비고',
            fullRow: true,
            view: notes,
            edit:
              isEdit && form ? (
                <Controller
                  name="otherNotes"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      width={'100%'}
                      {...field}
                      value={field.value ?? ''}
                      placeholder="상기 일정은 기관 사정에 따라 변동될 수 있습니다."
                    />
                  )}
                />
              ) : undefined,
          },
        ],
      },
    ],
  }
}

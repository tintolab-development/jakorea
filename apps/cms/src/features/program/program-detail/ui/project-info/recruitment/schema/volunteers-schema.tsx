import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '../../../../../model/program-detail-edit-schema'
import {
  formatDateRange,
  INTERVIEW_METHOD_OPTIONS,
  VOLUNTEER_TARGET_OPTIONS,
} from '../../../../lib/program-detail-info-constants'
import type { SectionSchema } from '../../../../model/recruitment-schema'
import {
  DateRangeEdit,
  ProgramDetailContactReadRow,
  ProgramDetailDateMethodReadRow,
  ProgramDetailInterviewReadRow,
} from '../components/recruitment-form-parts'
import dayjs from 'dayjs'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsDatePicker, CmsInput } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

export type VolunteersSchemaParams = {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  isEdit: boolean
  sponsorName?: string
  recruitmentStatusLabel: string
  volunteerRecruitmentLifecycle: ProgramLifecycleStatus | null
  volunteerTarget: string
  volunteerTargetDetail: string
  volunteerPeriodLabel: string
  notes: string
}

export function createVolunteersSchema({
  program,
  form,
  isEdit,
  sponsorName,
  recruitmentStatusLabel,
  volunteerRecruitmentLifecycle,
  volunteerTarget,
  volunteerTargetDetail,
  volunteerPeriodLabel,
  notes,
}: VolunteersSchemaParams): SectionSchema {
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
                <DateRangeEdit form={form} startName="startDate" endName="endDate" />
              ) : undefined,
          },
          {
            label: '봉사자 모집 현황',
            view: volunteerRecruitmentLifecycle ? (
              <span
                className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${volunteerRecruitmentLifecycle.replace(/_/g, '-')}`}
              >
                {recruitmentStatusLabel}
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
            view: volunteerTarget,
            edit:
              isEdit && form ? (
                <Controller
                  name="volunteerTarget"
                  control={form.control}
                  render={({ field }) => (
                    <CmsSelect
                      value={field.value ?? undefined}
                      options={VOLUNTEER_TARGET_OPTIONS}
                      onChange={v => field.onChange(v ?? undefined)}
                      allowClear
                      placeholder="모집 대상 선택"
                    />
                  )}
                />
              ) : undefined,
          },
          {
            label: '모집 대상 상세',
            required: true,
            view: volunteerTargetDetail,
            edit:
              isEdit && form ? (
                <Controller
                  name="volunteerTargetDetail"
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
            label: '봉사자 모집 기간',
            required: true,
            view: volunteerPeriodLabel,
            edit:
              isEdit && form ? (
                <DateRangeEdit
                  form={form}
                  startName="volunteerApplicationStartDate"
                  endName="volunteerApplicationEndDate"
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
                        value={toDayjs(field.value as string | Date | undefined)}
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
                        placeholder="홈페이지 공지 및 합격자 개별 안내"
                        className="program-detail-info-tab__result-method-input"
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
                        value={toDayjs(field.value as string | Date | undefined)}
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
                        value={toDayjs(field.value as string | Date | undefined)}
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
                        value={toDayjs(field.value as string | Date | undefined)}
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
                        placeholder="홈페이지 공지 및 합격자 개별 안내"
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
                  <div className="detail-info-form-inputs-wrapper">
                    <span>문의처</span>
                    <CmsInput
                      placeholder="문의처"
                      value={sponsorName ?? ''}
                      readOnly
                      className="program-detail-info-tab__contact-name-input"
                    />
                  </div>
                  <DetailInfoForm.InputsSeparator />
                  <div className="detail-info-form-inputs-wrapper">
                    <span>Tel</span>
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput {...field} value={field.value ?? ''} placeholder="02-6347-6113" />
                      )}
                    />
                  </div>
                  <DetailInfoForm.InputsSeparator />
                  <div className="detail-info-form-inputs-wrapper">
                    <span>E-mail</span>
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="ujat@jakorea.org"
                        />
                      )}
                    />
                  </div>
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
                  name="oneLineIntroduction"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      width={'100%'}
                      {...field}
                      value={field.value ?? ''}
                      placeholder="비고"
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

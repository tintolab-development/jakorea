import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus, TargetLevel } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { AppInput } from '@/shared/ui/app-input'
import { AppSelect } from '@/shared/ui/app-select'
import { AppDatePicker } from '@/shared/ui/app-datepicker'
import { CmsRadio } from '@/shared/ui/cms-radio'
import type { ProgramDetailEditFormValues } from '../../../../../model/program-detail-edit-schema'
import { formatDateRange, TARGET_LEVEL_LABEL } from '../../../../lib/program-detail-info-constants'
import type { SectionSchema } from '../../../../model/recruitment-schema'
import { DateRangeEdit, ProgramDetailContactReadRow } from '../components/recruitment-form-parts'
import dayjs from 'dayjs'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

const TARGET_LEVEL_OPTIONS = Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const STUDENT_LIST_OPTIONS = [
  { value: 'required' as const, label: '필요' },
  { value: 'not_required' as const, label: '불필요' },
]

export type InstitutionsSchemaParams = {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  isEdit: boolean
  sponsorName?: string
  participantRecruitmentLifecycle: ProgramLifecycleStatus | null
  targetLabel: string
  resultLine: string
  maxClassLabel: string
  studentListLabel: string
  notes: string
}

export function createInstitutionsSchema({
  program,
  form,
  isEdit,
  sponsorName,
  participantRecruitmentLifecycle,
  targetLabel,
  resultLine,
  maxClassLabel,
  studentListLabel,
  notes,
}: InstitutionsSchemaParams): SectionSchema {
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
            label: '참여자 모집 현황',
            view: participantRecruitmentLifecycle ? (
              <span
                className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${participantRecruitmentLifecycle.replace(/_/g, '-')}`}
              >
                {getProgramLifecycleLabel(participantRecruitmentLifecycle)}
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
            label: '교육 대상',
            required: true,
            view: targetLabel,
            edit:
              isEdit && form ? (
                <Controller
                  name="targetLevel"
                  control={form.control}
                  render={({ field }) => (
                    <AppSelect
                      value={field.value ?? undefined}
                      options={TARGET_LEVEL_OPTIONS}
                      onChange={v => field.onChange((v as TargetLevel) || undefined)}
                      placeholder="대상"
                      className="program-detail-info-tab__target-select"
                    />
                  )}
                />
              ) : undefined,
          },
          {
            label: '교육 대상 상세',
            required: true,
            view: program.district ?? '-',
            edit:
              isEdit && form ? (
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
              ) : undefined,
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            label: '참여자 모집 기간',
            view: formatDateRange(program.applicationStartDate, program.applicationEndDate),
            edit:
              isEdit && form ? (
                <DateRangeEdit
                  form={form}
                  startName="applicationStartDate"
                  endName="applicationEndDate"
                />
              ) : undefined,
          },
          {
            label: '결과 발표일 및 방법',
            view: resultLine,
            edit:
              isEdit && form ? (
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
              ) : undefined,
          },
        ],
      },
      {
        columns: 2,
        fields: [
          {
            label: '신청 가능 최대 학급 수',
            required: true,
            view: maxClassLabel,
            edit:
              isEdit && form && form.watch('rounds.0') != null ? (
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
              ) : undefined,
          },
          {
            label: '학생 명단 제출 여부',
            required: true,
            view: studentListLabel,
            edit:
              isEdit && form ? (
                <Controller
                  name="studentListRequired"
                  control={form.control}
                  render={({ field }) => (
                    <CmsRadio.Group
                      {...field}
                      value={field.value ?? undefined}
                      onChange={e => field.onChange(e.target.value)}
                      options={STUDENT_LIST_OPTIONS}
                      className="program-detail-info-tab__recruitment-radio"
                    />
                  )}
                />
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
                contactName={sponsorName}
                contactPhone={program.contactPhone}
                contactEmail={program.contactEmail}
                padEmptySegments
              />
            ),
            edit:
              isEdit && form ? (
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
                    <AppInput
                      {...field}
                      value={field.value ?? ''}
                      placeholder="비고"
                      className="program-detail-info-tab__notes-input"
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

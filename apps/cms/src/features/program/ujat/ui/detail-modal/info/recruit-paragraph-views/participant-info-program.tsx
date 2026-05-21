import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  getParticipantRecruitmentLifecycle,
  TARGET_LEVEL_LABEL,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { DateRangeEdit } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { detailInfoFormSectionTitleHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppDatePicker } from '@/shared/ui/app-datepicker'
import { AppInput } from '@/shared/ui/app-input'
import { DividerVertical } from '@/shared/components/divider-vertical'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

function LifecycleStatusView({ lifecycle }: { lifecycle: ProgramLifecycleStatus | null }) {
  if (!lifecycle) return <>-</>
  return (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {getProgramLifecycleLabel(lifecycle)}
    </span>
  )
}

export function UjatRecruitParticipantInfoProgramView({
  program,
  sponsorName,
  form,
  isEdit,
  sectionTitle = '참여자 모집 정보',
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  sectionTitle?: string
}) {
  const lifecycle = getParticipantRecruitmentLifecycle(
    program,
    isEdit && form
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )
  const targetLabel = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '초등학교'
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod = program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate
    ? `${dayjs(resultDate).format('YYYY. MM. DD (ddd)')} | ${resultMethod}`
    : '-'
  const publicTitle = program.mainTitle?.trim() || program.title
  const notes = (program.oneLineIntroduction ?? '').trim() || '-'

  const formMode = isEdit && form ? 'edit' : 'view'

  const headerProps = detailInfoFormSectionTitleHeaderProps(sectionTitle)

  return (
    <DetailInfoForm {...headerProps} mode={formMode}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          fullRow
          view={publicTitle}
          edit={
            isEdit && form ? (
              <Controller
                name="mainTitle"
                control={form.control}
                render={({ field }) => (
                  <AppInput {...field} value={field.value ?? ''} placeholder="공고용 프로그램명" />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 운영 기간"
          view={formatDateRange(program.startDate, program.endDate)}
          edit={
            isEdit && form ? (
              <DateRangeEdit form={form} startName="startDate" endName="endDate" />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="참여자 모집 현황"
          readOnlyDisplay
          view={<LifecycleStatusView lifecycle={lifecycle} />}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="교육 대상" view={targetLabel} />
        <DetailInfoForm.Field
          label="교육 대상 상세"
          view={program.district ?? '-'}
          edit={
            isEdit && form ? (
              <Controller
                name="district"
                control={form.control}
                render={({ field }) => (
                  <AppInput {...field} value={field.value ?? ''} placeholder="교육 대상 상세" />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 모집 기간"
          view={formatDateRange(program.applicationStartDate, program.applicationEndDate)}
          edit={
            isEdit && form ? (
              <DateRangeEdit
                form={form}
                startName="applicationStartDate"
                endName="applicationEndDate"
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="최종 합격자 발표"
          view={resultLine}
          edit={
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
                <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
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
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="문의처"
          fullRow
          view={
            <ProgramDetailContactReadRow
              contactName={sponsorName ? `문의처 : ${sponsorName}` : '문의처'}
              contactPhone={program.contactPhone}
              contactEmail={program.contactEmail}
              padEmptySegments
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="비고"
          view={notes}
          edit={
            isEdit && form ? (
              <Controller
                name="oneLineIntroduction"
                control={form.control}
                render={({ field }) => (
                  <AppInput {...field} value={field.value ?? ''} placeholder="비고" />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

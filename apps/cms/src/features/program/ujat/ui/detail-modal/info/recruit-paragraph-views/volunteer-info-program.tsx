import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getVolunteerRecruitmentStatus,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { DateRangeEdit } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppDatePicker } from '@/shared/ui/app-datepicker'
import { AppInput } from '@/shared/ui/app-input'
import { DividerVertical } from '@/shared/components/divider-vertical'
import type { UjatVolunteerRecruitHalf } from '../ujat-recruit-paragraph-props'
import { getUjatVolunteerRecruitPeriod } from '../ujat-recruit-program-round'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

const VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'volunteer_recruitment_planned',
  recruiting: 'recruiting_volunteers',
  closed: 'document_processing_completed',
}

const VOLUNTEER_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '봉사자 모집 예정',
  recruiting: '봉사자 모집 중',
  closed: '봉사자 모집 마감',
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

function VolunteerLifecycleView({ program }: { program: Program }) {
  const status = getVolunteerRecruitmentStatus(program)
  const lifecycle =
    status != null ? VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[status] : null
  const label =
    status != null
      ? (VOLUNTEER_RECRUITMENT_LABELS[status] ?? '-')
      : '-'
  if (!lifecycle) return <>{label}</>
  return (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {label}
    </span>
  )
}

function dateMethodLine(
  date: string | Date | undefined,
  method: string | undefined,
  fallbackMethod: string
) {
  if (!date) return '-'
  const methodLabel = method?.trim() || fallbackMethod
  return <UjatInlineDividedSegments segments={[formatDateOnly(date), methodLabel]} />
}

export function UjatRecruitVolunteerInfoProgramView({
  program,
  sponsorName,
  form,
  isEdit,
  volunteerHalf,
  showNoticeExposure,
  sectionTitle = '봉사자 모집 정보',
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  volunteerHalf: UjatVolunteerRecruitHalf
  showNoticeExposure: boolean
  sectionTitle?: string
}) {
  const period = getUjatVolunteerRecruitPeriod(program, volunteerHalf)
  const volunteerPeriodLabel = formatDateRange(period.start, period.end)
  const publicTitle = program.mainTitle?.trim() || program.title
  const volunteerTarget = program.volunteerTarget ?? '대학(원)생'
  const volunteerTargetDetail = program.volunteerTargetDetail ?? '-'
  const notes = (program.oneLineIntroduction ?? '').trim() || '-'
  const formMode = isEdit && form ? 'edit' : 'view'
  const roundIndex = volunteerHalf === 'h1' ? 0 : 1

  return (
    <>
      <UjatRecruitSectionDescriptionHeader title={sectionTitle} />
      {showNoticeExposure && (
        <DetailInfoForm title="봉사자 모집 공고 노출 시점" hideHeader mode={formMode}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="모집 공고 노출 시점" fullRow view="모집 시작일" />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      )}

      <DetailInfoForm title="봉사자 모집 정보" hideHeader mode={formMode}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="공고용 프로그램명" view={publicTitle} />
          <DetailInfoForm.Field label="활동 기수" view={volunteerHalf === 'h1' ? '상반기 (1학기)' : '하반기 (2학기)'} />
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
            label="봉사자 모집 현황"
            readOnlyDisplay
            view={<VolunteerLifecycleView program={program} />}
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            view={volunteerTarget}
            edit={
              isEdit && form ? (
                <Controller
                  name="volunteerTarget"
                  control={form.control}
                  render={({ field }) => (
                    <AppInput {...field} value={field.value ?? ''} placeholder="모집 대상" />
                  )}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="모집 대상 상세"
            view={volunteerTargetDetail}
            edit={
              isEdit && form ? (
                <Controller
                  name="volunteerTargetDetail"
                  control={form.control}
                  render={({ field }) => (
                    <AppInput {...field} value={field.value ?? ''} placeholder="모집 대상 상세" />
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="봉사자 모집 기간"
            view={volunteerPeriodLabel}
            edit={
              isEdit && form ? (
                form.watch(`rounds.${roundIndex}`) != null ? (
                  <DateRangeEdit
                    form={form}
                    startName={
                      (volunteerHalf === 'h1'
                        ? 'rounds.0.startDate'
                        : 'rounds.1.startDate') as 'rounds.0.startDate'
                    }
                    endName={
                      (volunteerHalf === 'h1' ? 'rounds.0.endDate' : 'rounds.1.endDate') as 'rounds.0.endDate'
                    }
                  />
                ) : (
                  <DateRangeEdit
                    form={form}
                    startName="volunteerApplicationStartDate"
                    endName="volunteerApplicationEndDate"
                  />
                )
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="1차 서류합격 발표"
            view={dateMethodLine(
              program.documentPassAnnouncementDate,
              program.documentPassAnnouncementMethod,
              '홈페이지 공지'
            )}
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="2차 면접 기간"
            view={
              program.interviewStartDate && program.interviewEndDate ? (
                <UjatInlineDividedSegments
                  segments={[
                    formatDateRange(program.interviewStartDate, program.interviewEndDate),
                    program.interviewMethod,
                  ]}
                />
              ) : (
                '-'
              )
            }
          />
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            view={dateMethodLine(
              program.finalPassAnnouncementDate ?? program.resultAnnouncementDate,
              program.finalPassAnnouncementMethod ?? program.resultAnnouncementMethod,
              '홈페이지 공지'
            )}
            edit={
              isEdit && form ? (
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
                  <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
                  <Controller
                    name="finalPassAnnouncementMethod"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="발표 방법 안내"
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
                  name="otherNotes"
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
    </>
  )
}

/**
 * 일반 프로그램 상세 — 참여자 모집 정보 (스크린샷 필드 순서)
 */

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { TARGET_LEVEL_LABEL } from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { detailInfoFormSectionTitleHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppDatePicker } from '@/shared/ui/app-datepicker'
import { AppInput } from '@/shared/ui/app-input'
import { AppSelect } from '@/shared/ui/app-select'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { DividerVertical } from '@/shared/components/divider-vertical'
import {
  DateRangeEdit,
  ProgramDetailContactReadRow,
} from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import type { TargetLevel } from '@/types/domain'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

const TARGET_LEVEL_OPTIONS = Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const STUDENT_LIST_OPTIONS = [
  { value: 'required' as const, label: '필요' },
  { value: 'not_required' as const, label: '불필요' },
]

export function GeneralProgramParticipantRecruitmentInfoView({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  const display = resolveGeneralProgramParticipantRecruitmentDisplay(
    program,
    isEdit && form
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )

  const formMode = isEdit && form ? 'edit' : 'view'
  const headerProps = detailInfoFormSectionTitleHeaderProps('참여자 모집 정보')
  const lifecycle = display.recruitmentStatusLifecycle
  const statusView = lifecycle ? (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {display.recruitmentStatusLabel || getProgramLifecycleLabel(lifecycle)}
    </span>
  ) : (
    display.recruitmentStatusLabel
  )

  const contactOrg = display.contactOrganizationName

  return (
    <DetailInfoForm {...headerProps} mode={formMode}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="공고 게시 여부" view={display.announcementPublishedLabel} readOnlyDisplay />
        <DetailInfoForm.Field label="사전 안내 사항 작성 여부" view={display.preEducationNoticeLabel} readOnlyDisplay />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="학생 명단 제출 여부"
          view={display.studentListLabel}
          edit={
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
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="신청 가능 최대 학급 수"
          view={display.maxClassLabel}
          edit={
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
                      field.onChange(Number.isNaN(n) ? undefined : n)
                    }}
                    className="program-detail-info-tab__max-class-count-input"
                  />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="배정 가능 최대 강사 수" view={display.maxInstructorsLabel} readOnlyDisplay />
        <DetailInfoForm.Field label="신청 가능 1일 최대 차시" view={display.maxSessionsPerDayLabel} readOnlyDisplay />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="신청 가능 최대 일정 수" view={display.maxScheduleCountLabel} readOnlyDisplay />
        <DetailInfoForm.Field label=" " view=" " readOnlyDisplay />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 운영 기간"
          view={display.operationPeriodLabel}
          edit={
            isEdit && form ? (
              <DateRangeEdit form={form} startName="startDate" endName="endDate" />
            ) : undefined
          }
        />
        <DetailInfoForm.Field label="참여자 모집 현황" readOnlyDisplay view={statusView} />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 대상"
          view={display.targetLabel}
          edit={
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
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="교육 대상 상세"
          view={display.targetDetailLabel}
          edit={
            isEdit && form ? (
              <Controller
                name="district"
                control={form.control}
                render={({ field }) => (
                  <AppInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="특성화고등학교 3학년"
                    className="program-detail-info-tab__district-input"
                  />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 모집 기간"
          view={display.recruitmentPeriodLabel}
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
          view={display.finalAnnouncementLabel}
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
              contactName={contactOrg}
              contactPhone={display.contactPhone}
              contactEmail={display.contactEmail}
              padEmptySegments
            />
          }
          edit={
            isEdit && form ? (
              <div className="program-detail-info-tab__contact-inputs program-detail-info-tab__contact-inputs--even">
                <div className="program-detail-info-tab__contact-group">
                  <span className="program-detail-info-tab__contact-label">문의처</span>
                  <AppInput
                    placeholder="문의처"
                    value={contactOrg}
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
                        placeholder="cc@jakorea.org"
                        className="program-detail-info-tab__contact-email-input"
                      />
                    )}
                  />
                </div>
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="비고"
          view={display.notes}
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

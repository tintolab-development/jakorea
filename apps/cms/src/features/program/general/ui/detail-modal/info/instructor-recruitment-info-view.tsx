/**
 * 일반 프로그램 상세 — 강사 모집 정보 (등록 양식·스크린샷 레이아웃)
 */

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  INSTRUCTOR_TARGET_OPTIONS,
  parseInstructorTargetsSelectValue,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { ProgramDetailContactReadRow, ProgramDetailDateMethodReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from '@/features/program/general/lib/instructor-recruitment-display'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './instructor-recruitment-info-view.css'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const FORM_CLASS = 'program-registration-paragraph'

export function GeneralProgramInstructorRecruitmentInfoView({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  const display = resolveGeneralProgramInstructorRecruitmentDisplay(program)

  const formMode = isEdit && form ? 'edit' : 'view'
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
    <section className="instructor-recruitment-info-view" aria-label="강사 모집 정보">
      <FormParagraphSectionHeader title="강사 모집 정보" surface="responseEntry" titleAligned />
      <div className="instructor-recruitment-info-view__forms">
        <DetailInfoForm
          title="강사 모집 정보(설정)"
          hideHeader
          mode={formMode}
          className={FORM_CLASS}
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              fullRow
              view={display.announcementPublishedLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="instructorRecruitmentAnnouncementPublished"
                    control={form.control}
                    render={({ field }) => (
                      <ParticipantRecruitmentAnnouncementPublishedRadios
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm title="강사 모집 정보" hideHeader mode={formMode} className={FORM_CLASS}>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="프로그램 운영 기간"
              view={display.operationPeriodLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="startDate"
                    control={form.control}
                    render={({ field }) => (
                      <ParagraphDatePicker
                        mode="range"
                        value={[
                          toDayjs(field.value as string | Date | undefined),
                          toDayjs(form.watch('endDate') as string | Date | undefined),
                        ]}
                        onChange={([start, end]) => {
                          field.onChange(start ? start.toISOString() : '')
                          form.setValue('endDate', end ? end.toISOString() : '')
                        }}
                        placeholder={['운영 시작일', '운영 종료일']}
                        width="100%"
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="강사 모집 현황"
              readOnlyDisplay={!(isEdit && form)}
              view={statusView}
              edit={
                isEdit && form ? (
                  <span className="form-editor-template-field-hint-text">{RECRUIT_PROGRESS_HINT}</span>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="모집 대상"
              view={display.instructorTargetLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="instructorTargets"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        mode="multiple"
                        inputSize="medium"
                        width={240}
                        withAllOption={false}
                        value={field.value ?? []}
                        options={[...INSTRUCTOR_TARGET_OPTIONS]}
                        onChange={v => field.onChange(parseInstructorTargetsSelectValue(v))}
                        placeholder="모집 대상을 선택하세요"
                        className="program-detail-info-tab__target-select"
                      />
                    )}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="모집 대상 상세"
              view={display.instructorTargetDetailLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="instructorTargetDetail"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="상세 모집 대상을 입력하세요"
                        inputSize="medium"
                        width="100%"
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
              label="강사 모집 기간"
              view={display.recruitmentPeriodLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="instructorApplicationStartDate"
                    control={form.control}
                    render={({ field }) => (
                      <ParagraphDatePicker
                        mode="range"
                        value={[
                          toDayjs(field.value as string | Date | undefined),
                          toDayjs(
                            form.watch('instructorApplicationEndDate') as string | Date | undefined
                          ),
                        ]}
                        onChange={([start, end]) => {
                          field.onChange(start ? start.toISOString() : undefined)
                          form.setValue(
                            'instructorApplicationEndDate',
                            end ? end.toISOString() : undefined
                          )
                        }}
                        placeholder={['모집 시작일', '모집 종료일']}
                        width="100%"
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="최종 합격자 발표"
              view={
                <ProgramDetailDateMethodReadRow
                  dateIso={display.finalPassAnnouncementDate}
                  method={display.finalPassAnnouncementMethod}
                />
              }
              edit={
                isEdit && form ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="finalPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <ParagraphDatePicker
                          mode="single"
                          presetMode="date"
                          customizable={false}
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          placeholder="합격자 발표일"
                          width={190}
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
                          placeholder="발표 방법 안내"
                          inputSize="medium"
                          width="100%"
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
                      <CmsInput
                        placeholder="담당 문의처"
                        value={contactOrg}
                        readOnly
                        inputSize="medium"
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
                          <CmsPhoneInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="문의처 전화번호"
                            inputSize="medium"
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
                          <CmsInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="문의처 이메일"
                            inputSize="medium"
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
                    name="otherNotes"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="비고란을 작성하세요 (없으면 -로 입력)"
                        inputSize="medium"
                        className="program-detail-info-tab__notes-input"
                      />
                    )}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}

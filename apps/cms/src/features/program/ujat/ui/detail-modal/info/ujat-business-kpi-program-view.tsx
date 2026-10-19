import { Controller, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  resolveUjatBusinessKpiDisplay,
  UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE,
} from '@/features/program/ujat/lib/ujat-business-kpi-display'
import { createUjatRegistrationBasicInfoOverlayDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { useUjatProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { formatNumberDisplay } from '@/shared/utils'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function KpiNumber({ value }: { value: number | null }) {
  return <span style={{ fontWeight: 700 }}>{value == null ? '-' : formatNumberDisplay(value)}</span>
}

function NotApplicableText() {
  return <span className="detail-info-form--text">{UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE}</span>
}

/** 빈 값은 null — RHF Controller는 undefined면 defaultValues(이전 KPI)를 다시 보여 준다. */
function parseOptionalNonNegativeInt(raw: string): number | null {
  return raw === '' ? null : Number.parseInt(raw, 10)
}

/** UJAT 사업 KPI 목표 — 등록 양식(`UjatBusinessKpiParagraph`)과 동일 레이아웃 */
export function UjatBusinessKpiProgramView({
  program,
  isEdit = false,
  form,
}: {
  program: Program
  isEdit?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const display = resolveUjatBusinessKpiDisplay(program)
  const isFormEdit = isEdit && form != null
  const formMode = isFormEdit ? 'edit' : 'view'
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const [participantVolunteer] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.volunteer',
    defaults.participantVolunteer
  )
  const hasVolunteerRecruitment = isFormEdit ? participantVolunteer : display.hasVolunteerRecruitment

  return (
    <section className="program-detail-fullpage-modal__info-tab-block">
      {isFormEdit ? (
        <FormParagraphSectionHeader
          title="사업 KPI 목표"
          surface="responseEntry"
          titleAligned
          required
          highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[1]}
        />
      ) : null}
      <DetailInfoForm
        title="사업 KPI 목표"
        hideHeader={isFormEdit}
        mode={formMode}
        className={isFormEdit ? 'program-registration-paragraph' : undefined}
      >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 최종 인원"
          view={<KpiNumber value={display.finalParticipants} />}
          edit={
            isFormEdit ? (
              <Controller
                name="kpiFinalParticipants"
                control={form.control}
                render={({ field }) => (
                  <CmsNumericInput
                    inputSize="small"
                    placeholder="목표값 입력"
                    width={120}
                    mode="integer"
                    min={0}
                    value={field.value == null ? '' : String(field.value)}
                    onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                    status={form.formState.errors.kpiFinalParticipants ? 'error' : undefined}
                  />
                )}
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="교육진행자 최종 인원"
          view={
            <div className="detail-info-form-inputs-wrapper program-registration-paragraph__instructor-kpi-row">
              <div className="program-registration-paragraph__instructor-kpi-group">
                <span className="detail-info-form--text">강사</span>
                <NotApplicableText />
              </div>
              <DetailInfoForm.InputsSeparator />
              <div className="program-registration-paragraph__instructor-kpi-group">
                <span className="detail-info-form--text">봉사자</span>
                {hasVolunteerRecruitment ? (
                  <KpiNumber value={display.volunteerCount} />
                ) : (
                  <NotApplicableText />
                )}
              </div>
            </div>
          }
          edit={
            isFormEdit ? (
              <div className="detail-info-form-inputs-wrapper program-registration-paragraph__instructor-kpi-row">
                <div className="program-registration-paragraph__instructor-kpi-group">
                  <span className="detail-info-form--text">강사</span>
                  <CmsInput
                    disabled
                    inputSize="small"
                    placeholder={UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE}
                    width={120}
                    value=""
                  />
                </div>
                <DetailInfoForm.InputsSeparator />
                <div className="program-registration-paragraph__instructor-kpi-group">
                  <span className="detail-info-form--text">봉사자</span>
                  {hasVolunteerRecruitment ? (
                    <Controller
                      name="kpiVolunteerCount"
                      control={form.control}
                      render={({ field }) => (
                        <CmsNumericInput
                          inputSize="small"
                          placeholder="목표값 입력"
                          width={120}
                          mode="integer"
                          min={0}
                          value={field.value == null ? '' : String(field.value)}
                          onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                          status={form.formState.errors.kpiVolunteerCount ? 'error' : undefined}
                        />
                      )}
                    />
                  ) : (
                    <CmsInput
                      disabled
                      inputSize="small"
                      placeholder={UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE}
                      width={120}
                      value=""
                    />
                  )}
                </div>
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최종 파견 학교 수"
          view={<KpiNumber value={display.finalSchools} />}
          edit={
            isFormEdit ? (
              <Controller
                name="kpiFinalSchools"
                control={form.control}
                render={({ field }) => (
                  <CmsNumericInput
                    inputSize="small"
                    placeholder="목표값 입력"
                    width={120}
                    mode="integer"
                    min={0}
                    value={field.value == null ? '' : String(field.value)}
                    onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                    status={form.formState.errors.kpiFinalSchools ? 'error' : undefined}
                  />
                )}
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="최종 파견 학급 수"
          view={<KpiNumber value={display.finalClasses} />}
          edit={
            isFormEdit ? (
              <Controller
                name="kpiFinalClasses"
                control={form.control}
                render={({ field }) => (
                  <CmsNumericInput
                    inputSize="small"
                    placeholder="목표값 입력"
                    width={120}
                    mode="integer"
                    min={0}
                    value={field.value == null ? '' : String(field.value)}
                    onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                    status={form.formState.errors.kpiFinalClasses ? 'error' : undefined}
                  />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}

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
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function KpiNumber({ value }: { value: number }) {
  return <span style={{ fontWeight: 700 }}>{value}</span>
}

function NotApplicableText() {
  return <span className="detail-info-form--text">{UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE}</span>
}

function parseOptionalNonNegativeInt(raw: string): number | undefined {
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? undefined : n
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
    <DetailInfoForm title="사업 KPI 목표" mode={formMode} className="detail-info-form--gap">
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
                  <CmsInput
                    inputSize="medium"
                    placeholder="목표값 입력"
                    width={120}
                    type="number"
                    min={0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(parseOptionalNonNegativeInt(e.target.value))}
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
                    inputSize="medium"
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
                        <CmsInput
                          inputSize="medium"
                          placeholder="목표값 입력"
                          width={120}
                          type="number"
                          min={0}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(parseOptionalNonNegativeInt(e.target.value))}
                          status={form.formState.errors.kpiVolunteerCount ? 'error' : undefined}
                        />
                      )}
                    />
                  ) : (
                    <CmsInput
                      disabled
                      inputSize="medium"
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
                  <CmsInput
                    inputSize="medium"
                    placeholder="목표값 입력"
                    width={120}
                    type="number"
                    min={0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(parseOptionalNonNegativeInt(e.target.value))}
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
                  <CmsInput
                    inputSize="medium"
                    placeholder="목표값 입력"
                    width={120}
                    type="number"
                    min={0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(parseOptionalNonNegativeInt(e.target.value))}
                    status={form.formState.errors.kpiFinalClasses ? 'error' : undefined}
                  />
                )}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

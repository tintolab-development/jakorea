/**
 * UJAT 프로그램 상세 — 공통 정보
 * 조회·수정 모두 등록 양식(`UjatBasicInfoParagraph`)과 동일 3블록 레이아웃.
 */
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveUjatRegistrationBasicInfoDisplay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { UjatBusinessKpiProgramView } from './ujat-business-kpi-program-view'
import { UjatWageInfoProgramView } from './ujat-wage-info-program-view'
import { UjatBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-basic-info-paragraph'
import { UjatHalfEducationScheduleProgramView } from './ujat-half-education-schedule-program-view'
import { UjatEducationScheduleSettingsProgramView } from './ujat-education-schedule-settings-program-view'
import { UjatRegionCapacityProgramView } from './ujat-region-capacity-program-view'
import { UjatBasicInfoReadonlyView } from './ujat-basic-info-readonly-view'
import { ProgramRegistrationAuditValue } from '@/features/program/shared/ui/program-detail/registration-audit-value'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-program-detail-common-info-view.css'

export interface UjatProgramDetailCommonInfoViewProps {
  program: Program & { ujatTypedDetail?: UjatTypedDetail }
  sponsorName?: string
  isEditMode?: boolean
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}

function UjatBasicInfoRegistrationAuditRow({
  program,
  isEditMode,
  infoForm,
}: {
  program: Program
  isEditMode: boolean
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  return (
    <DetailInfoForm
      title="기본 정보"
      hideHeader
      mode={isEditMode && infoForm ? 'edit' : 'view'}
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 등록일"
          view={<ProgramRegistrationAuditValue at={program.createdAt} name={program.createdByName} />}
        />
        <DetailInfoForm.Field
          label="마지막 수정일"
          view={<ProgramRegistrationAuditValue at={program.updatedAt} name={program.updatedByName} />}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

export function UjatProgramDetailCommonInfoView({
  program,
  sponsorName,
  isEditMode = false,
  infoForm,
  scheduleForm,
}: UjatProgramDetailCommonInfoViewProps) {
  // 전체 후원사 목록은 편집 선택지, 또는 배정 응답에 이름이 없을 때의 이름 찾기에만 쓴다.
  const sponsorsQuery = useSponsorOptionsQuery(isEditMode || !sponsorName?.trim())
  const basicInfoDisplay = resolveUjatRegistrationBasicInfoDisplay(
    program,
    sponsorName,
    undefined,
    sponsorsQuery.data ?? []
  )

  return (
    <div className="program-detail-fullpage-modal__info-tab">
      <div
        className={
          isEditMode
            ? 'ujat-program-detail-common-info-view__basic-info ujat-program-detail-common-info-view__basic-info--edit'
            : 'ujat-program-detail-common-info-view__basic-info'
        }
      >
        {isEditMode ? (
          <>
            <FormParagraphSectionHeader
              title={UJAT_REGISTRATION_SECTION_META.basic.title}
              surface="responseEntry"
              titleAligned
              required
              highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[0]}
            />
            <UjatBasicInfoRegistrationAuditRow
              program={program}
              isEditMode={isEditMode}
              infoForm={infoForm}
            />
            <div className="ujat-program-detail-common-info-view__basic-info-edit-blocks">
              {/*
                UJAT create는 educationStructure 기본 SCHEDULE.
                generalProgramEducationStructure가 비어 있어도 일정형으로 보고
                세부 프로그램명을「해당없음」고정 (일반 일정형·상세와 동일).
              */}
              <UjatBasicInfoParagraph
                lockDetailedProgramToNone={
                  program.generalProgramEducationStructure !== 'curriculum'
                }
                infoForm={infoForm}
              />
            </div>
          </>
        ) : (
          <UjatBasicInfoReadonlyView
            display={basicInfoDisplay}
            program={program}
            showRegistrationAudit
          />
        )}
      </div>

      <UjatBusinessKpiProgramView
        program={program}
        isEdit={isEditMode}
        form={isEditMode ? infoForm : undefined}
      />

      <UjatWageInfoProgramView
        program={program}
        isEdit={isEditMode}
        form={isEditMode ? infoForm : undefined}
      />

      <UjatHalfEducationScheduleProgramView
        program={program}
        half="h1"
        isEdit={isEditMode}
        scheduleForm={scheduleForm}
      />

      <UjatHalfEducationScheduleProgramView
        program={program}
        half="h2"
        isEdit={isEditMode}
        scheduleForm={scheduleForm}
      />

      <UjatEducationScheduleSettingsProgramView
        program={program}
        isEdit={isEditMode}
        scheduleForm={scheduleForm}
      />

      <UjatRegionCapacityProgramView
        program={program}
        isEdit={isEditMode}
        form={isEditMode ? infoForm : undefined}
      />
    </div>
  )
}

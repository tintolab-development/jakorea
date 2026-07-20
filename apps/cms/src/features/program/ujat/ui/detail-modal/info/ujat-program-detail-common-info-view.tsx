/**
 * UJAT 프로그램 상세 — 공통 정보
 * 조회·수정 모두 등록 양식(`UjatBasicInfoParagraph`)과 동일 3블록 레이아웃.
 */
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatDate } from '@/features/program/shared/lib/program-detail-info-constants'
import { resolveUjatRegistrationBasicInfoDisplay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { UjatBusinessKpiProgramView } from './ujat-business-kpi-program-view'
import { UjatWageInfoProgramView } from './ujat-wage-info-program-view'
import { UjatBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-basic-info-paragraph'
import { UjatHalfEducationScheduleProgramView } from './ujat-half-education-schedule-program-view'
import { UjatEducationScheduleSettingsProgramView } from './ujat-education-schedule-settings-program-view'
import { UjatRegionCapacityProgramView } from './ujat-region-capacity-program-view'
import { UjatBasicInfoReadonlyView } from './ujat-basic-info-readonly-view'
import { UjatInlineDividedSegments } from '../shared/ujat-inline-divided-segments'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-program-detail-common-info-view.css'

export interface UjatProgramDetailCommonInfoViewProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
}

function UjatBasicInfoRegistrationAuditRow({ program }: { program: Program }) {
  return (
    <DetailInfoForm title="기본 정보" mode="view" className="program-registration-paragraph">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 등록일"
          view={
            <UjatInlineDividedSegments
              segments={[formatDate(program.createdAt), program.createdByName]}
            />
          }
        />
        <DetailInfoForm.Field
          label="마지막 수정일"
          view={
            <UjatInlineDividedSegments
              segments={[formatDate(program.updatedAt), program.updatedByName]}
            />
          }
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
}: UjatProgramDetailCommonInfoViewProps) {
  const sponsorsQuery = useSponsorOptionsQuery(true)
  const basicInfoDisplay = resolveUjatRegistrationBasicInfoDisplay(
    program,
    sponsorName,
    undefined,
    sponsorsQuery.data ?? []
  )

  return (
    <div className="program-detail-fullpage-modal__info-tab">
      <div className="ujat-program-detail-common-info-view__basic-info">
        {isEditMode ? (
          <>
            <UjatBasicInfoRegistrationAuditRow program={program} />
            <div className="ujat-program-detail-common-info-view__basic-info-edit-blocks">
              <UjatBasicInfoParagraph />
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

      <UjatWageInfoProgramView program={program} isEdit={isEditMode} />

      <UjatHalfEducationScheduleProgramView program={program} half="h1" isEdit={isEditMode} />

      <UjatHalfEducationScheduleProgramView program={program} half="h2" isEdit={isEditMode} />

      <UjatEducationScheduleSettingsProgramView program={program} isEdit={isEditMode} />

      <UjatRegionCapacityProgramView program={program} isEdit={isEditMode} />
    </div>
  )
}

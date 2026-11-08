import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import { getManagerEvaluationTag } from '@/shared/lib/status-tag-specs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_MANAGER_EVALUATION_ORDER,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'

export interface GeneralVolunteerApplicantManagerEvaluationSectionProps {
  applicant: GeneralVolunteerApplicantRow
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  updatingManagerEvaluation: string | null
}

export function GeneralVolunteerApplicantManagerEvaluationSection({
  applicant,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
  updatingManagerEvaluation,
}: GeneralVolunteerApplicantManagerEvaluationSectionProps) {
  return (
    <section className="general-volunteer-applicant-manager-evaluation">
      <DetailInfoForm title="담당자 서류 평가" mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A"
            view={
              <StatusDropdownCell<GeneralManagerEvaluation>
                status={applicant.managerAEvaluation}
                statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
                getTag={getManagerEvaluationTag}
                isItemDisabled={(current, option) => current === option}
                onChange={
                  applicant.canEditManagerAEvaluation
                    ? evaluation => onManagerAEvaluationChange(applicant.id, evaluation)
                    : undefined
                }
                isUpdating={updatingManagerEvaluation === `${applicant.id}:A`}
                isOpen={
                  applicant.canEditManagerAEvaluation &&
                  openManagerDropdown?.rowId === applicant.id &&
                  openManagerDropdown.manager === 'A'
                }
                onOpenChange={open =>
                  setOpenManagerDropdown(
                    open && applicant.canEditManagerAEvaluation
                      ? { rowId: applicant.id, manager: 'A' }
                      : null
                  )
                }
              />
            }
          />
          <DetailInfoForm.Field
            label="담당자 B"
            view={
              <StatusDropdownCell<GeneralManagerEvaluation>
                status={applicant.managerBEvaluation}
                statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
                getTag={getManagerEvaluationTag}
                isItemDisabled={(current, option) => current === option}
                onChange={
                  applicant.canEditManagerBEvaluation
                    ? evaluation => onManagerBEvaluationChange(applicant.id, evaluation)
                    : undefined
                }
                isUpdating={updatingManagerEvaluation === `${applicant.id}:B`}
                isOpen={
                  applicant.canEditManagerBEvaluation &&
                  openManagerDropdown?.rowId === applicant.id &&
                  openManagerDropdown.manager === 'B'
                }
                onOpenChange={open =>
                  setOpenManagerDropdown(
                    open && applicant.canEditManagerBEvaluation
                      ? { rowId: applicant.id, manager: 'B' }
                      : null
                  )
                }
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}

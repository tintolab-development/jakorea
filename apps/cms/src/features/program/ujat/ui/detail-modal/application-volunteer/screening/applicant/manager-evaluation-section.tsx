import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_MANAGER_EVALUATION_ORDER,
  type UjatManagerEvaluation,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { ManagerEvaluationBadge } from '../shared/manager-evaluation-badge'

export interface ManagerEvaluationSectionProps {
  applicant: UjatVolunteerApplicantRow
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
}

export function ManagerEvaluationSection({
  applicant,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: ManagerEvaluationSectionProps) {
  return (
    <section className="ujat-volunteer-applicant-manager-evaluation">
      <DetailInfoForm title="담당자 서류 평가" mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A"
            view={
              <StatusDropdownCell<UjatManagerEvaluation>
                status={applicant.managerAEvaluation}
                statusOptions={UJAT_MANAGER_EVALUATION_ORDER}
                renderBadge={evaluation => <ManagerEvaluationBadge evaluation={evaluation} />}
                isItemDisabled={(current, option) => current === option}
                onChange={evaluation => onManagerAEvaluationChange(applicant.id, evaluation)}
                isOpen={
                  openManagerDropdown?.rowId === applicant.id &&
                  openManagerDropdown.manager === 'A'
                }
                onOpenChange={open =>
                  setOpenManagerDropdown(open ? { rowId: applicant.id, manager: 'A' } : null)
                }
                tagLayout="tag100"
              />
            }
          />
          <DetailInfoForm.Field
            label="담당자 B"
            view={
              <StatusDropdownCell<UjatManagerEvaluation>
                status={applicant.managerBEvaluation}
                statusOptions={UJAT_MANAGER_EVALUATION_ORDER}
                renderBadge={evaluation => <ManagerEvaluationBadge evaluation={evaluation} />}
                isItemDisabled={(current, option) => current === option}
                onChange={evaluation => onManagerBEvaluationChange(applicant.id, evaluation)}
                isOpen={
                  openManagerDropdown?.rowId === applicant.id &&
                  openManagerDropdown.manager === 'B'
                }
                onOpenChange={open =>
                  setOpenManagerDropdown(open ? { rowId: applicant.id, manager: 'B' } : null)
                }
                tagLayout="tag100"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}

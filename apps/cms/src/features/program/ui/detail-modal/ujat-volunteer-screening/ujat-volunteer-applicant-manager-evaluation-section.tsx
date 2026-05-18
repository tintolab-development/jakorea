import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_MANAGER_EVALUATION_ORDER,
  type UjatManagerEvaluation,
} from '@/features/program/model/ujat-volunteer-screening-constants'
import { ManagerEvaluationBadge } from './manager-evaluation-badge'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'
import './ujat-volunteer-doc-screening-section.css'

const MANAGER_EVALUATION_BADGE_STYLE = { minWidth: 72 } as const

export interface UjatVolunteerApplicantManagerEvaluationSectionProps {
  applicant: UjatVolunteerApplicantRow
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
}

export function UjatVolunteerApplicantManagerEvaluationSection({
  applicant,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: UjatVolunteerApplicantManagerEvaluationSectionProps) {
  return (
    <section className="ujat-volunteer-applicant-detail__subsection ujat-volunteer-applicant-manager-evaluation">
      <h3 className="ujat-volunteer-applicant-detail__subsection-title">담당자 서류 평가</h3>
      <div className="program-detail-info-tab__table-wrapper ujat-volunteer-applicant-detail__table-wrapper--horizontal">
        <table className="program-detail-info-tab__table ujat-volunteer-applicant-detail__table--horizontal">
          <tbody>
            <tr>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                담당자 A
              </th>
              <td className="ujat-volunteer-applicant-detail__horizontal-value">
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
                  style={MANAGER_EVALUATION_BADGE_STYLE}
                />
              </td>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                담당자 B
              </th>
              <td className="ujat-volunteer-applicant-detail__horizontal-value">
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
                  style={MANAGER_EVALUATION_BADGE_STYLE}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

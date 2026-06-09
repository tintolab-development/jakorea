import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  GENERAL_MANAGER_EVALUATION_ORDER,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { GeneralManagerEvaluationBadge } from './status-text'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

export interface GeneralVolunteerApplicantManagerEvaluationSectionProps {
  applicant: GeneralVolunteerApplicantRow
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
}

export function GeneralVolunteerApplicantManagerEvaluationSection({
  applicant,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: GeneralVolunteerApplicantManagerEvaluationSectionProps) {
  return (
    <section className="general-volunteer-applicant-detail__subsection general-volunteer-applicant-manager-evaluation">
      <h3 className="general-volunteer-applicant-detail__subsection-title">담당자 서류 평가</h3>
      <div className="program-detail-info-tab__table-wrapper general-volunteer-applicant-detail__table-wrapper--horizontal">
        <table className="program-detail-info-tab__table general-volunteer-applicant-detail__table--horizontal">
          <tbody>
            <tr>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                담당자 A
              </th>
              <td className="general-volunteer-applicant-detail__horizontal-value">
                <StatusDropdownCell<GeneralManagerEvaluation>
                  status={applicant.managerAEvaluation}
                  statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
                  renderBadge={evaluation => <GeneralManagerEvaluationBadge evaluation={evaluation} />}
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
              </td>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                담당자 B
              </th>
              <td className="general-volunteer-applicant-detail__horizontal-value">
                <StatusDropdownCell<GeneralManagerEvaluation>
                  status={applicant.managerBEvaluation}
                  statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
                  renderBadge={evaluation => <GeneralManagerEvaluationBadge evaluation={evaluation} />}
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

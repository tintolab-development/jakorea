import { CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  GENERAL_MANAGER_EVALUATION_ORDER,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { GeneralManagerEvaluationBadge } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/status-text'
import { openPortal1365Main } from '@/shared/constants/external-urls'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

export function IndividualApplicantId1365Cell({ id1365 }: { id1365: string }) {
  if (!id1365.trim() || id1365 === '-') {
    return <>-</>
  }

  return (
    <span className="general-volunteer-applicant-basic-info__id1365-cell">
      <span>{id1365}</span>
      <DetailInfoForm.InputsSeparator />
      <CmsButton type="button" size="medium" onClick={openPortal1365Main}>
        1365 바로가기
      </CmsButton>
    </span>
  )
}

export interface IndividualApplicantManagerEvaluationSectionProps {
  applicant: GeneralIndividualApplicantRow
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
}

export function IndividualApplicantManagerEvaluationSection({
  applicant,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: IndividualApplicantManagerEvaluationSectionProps) {
  return (
    <section className="general-volunteer-applicant-manager-evaluation">
      <DetailInfoForm title="담당자 서류 평가" mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A"
            view={
              <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
                <StatusDropdownCell<GeneralManagerEvaluation>
                  status={applicant.managerAEvaluation ?? 'unreviewed'}
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
              </span>
            }
          />
          <DetailInfoForm.Field
            label="담당자 B"
            view={
              <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
                <StatusDropdownCell<GeneralManagerEvaluation>
                  status={applicant.managerBEvaluation ?? 'unreviewed'}
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
              </span>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}

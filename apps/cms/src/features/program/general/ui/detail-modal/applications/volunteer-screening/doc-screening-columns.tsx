import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS,
  GENERAL_MANAGER_EVALUATION_ORDER,
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatGeneralJaVolunteerExperienceCell,
  formatGeneralVolunteerEssayCellValue,
  type GeneralEssayColumnKey,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { GeneralDocumentScreeningStatusText, GeneralManagerEvaluationBadge } from './status-text'

const NAME_COLUMN_WIDTH = 140
const CONTACT_COLUMN_WIDTH = 200
const EMAIL_COLUMN_WIDTH = 200
const JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH = 160
/** cms-data-table 선택 열 기본폭과 동일 */
const SELECTION_COLUMN_WIDTH = 68
const NO_COLUMN_WIDTH = 80
const MANAGER_EVAL_COLUMN_WIDTH = 200
const DOCUMENT_STATUS_COLUMN_WIDTH = 160

export const GENERAL_DOC_SCREENING_TABLE_SCROLL_X =
  SELECTION_COLUMN_WIDTH +
  NO_COLUMN_WIDTH +
  NAME_COLUMN_WIDTH +
  CONTACT_COLUMN_WIDTH +
  EMAIL_COLUMN_WIDTH +
  JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH +
  MANAGER_EVAL_COLUMN_WIDTH +
  MANAGER_EVAL_COLUMN_WIDTH +
  DOCUMENT_STATUS_COLUMN_WIDTH +
  Object.values(GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS).reduce((sum, width) => sum + width, 0)

const CENTER_CELL_CLASS = 'general-volunteer-screening__center-cell'
const NOWRAP_CELL_CLASS = 'general-volunteer-screening__nowrap-cell'
const NAME_CELL_CLASS = 'general-volunteer-screening__col-name'
const CONTACT_CELL_CLASS = 'general-volunteer-screening__col-contact'
const EMAIL_CELL_CLASS = 'general-volunteer-screening__col-email'
const JA_EXPERIENCE_CELL_CLASS = 'general-volunteer-screening__col-ja-experience'
const ESSAY_CELL_CLASS = 'general-volunteer-screening__essay-cell'
const ESSAY_CELL_WIDE_CLASS = 'general-volunteer-screening__essay-cell--wide'
const ESSAY_TEXT_CELL_CLASS = 'general-volunteer-screening__essay-text'
const MANAGER_EVALUATION_CELL_CLASS = `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME} general-volunteer-screening__manager-eval-dropdown-cell`

function renderEssayCell(value: string | undefined, record: GeneralVolunteerApplicantRow) {
  const display = formatGeneralVolunteerEssayCellValue(
    record.applicationType,
    record.hasJaVolunteerExperience,
    value
  )
  return (
    <span
      className={`general-volunteer-screening__text-cell ${ESSAY_TEXT_CELL_CLASS}`}
      title={display !== '-' ? display : undefined}
    >
      {display}
    </span>
  )
}

export function useGeneralVolunteerDocScreeningColumns({
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
  openManagerDropdown,
  setOpenManagerDropdown,
  updatingManagerEvaluation,
}: {
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: Dispatch<SetStateAction<{ rowId: string; manager: 'A' | 'B' } | null>>
  updatingManagerEvaluation: string | null
}): ColumnsType<GeneralVolunteerApplicantRow> {
  return useMemo(() => {
    const essayColumns: ColumnsType<GeneralVolunteerApplicantRow> = (
      Object.keys(GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES) as GeneralEssayColumnKey[]
    ).map(key => {
      const width = GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS[key]
      const essayClass =
        key === 'essayJaExperience'
          ? `${ESSAY_CELL_CLASS} ${ESSAY_CELL_WIDE_CLASS}`
          : ESSAY_CELL_CLASS
      return {
        title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES[key],
        dataIndex: key,
        key,
        width,
        minWidth: width,
        align: 'center' as const,
        ellipsis: false,
        onHeaderCell: () => ({ className: essayClass }),
        onCell: () => ({ className: essayClass }),
        render: (value: string | undefined, record: GeneralVolunteerApplicantRow) =>
          renderEssayCell(value, record),
      }
    })

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: NO_COLUMN_WIDTH,
        minWidth: NO_COLUMN_WIDTH,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
      },
      {
        title: '신청 봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: NAME_COLUMN_WIDTH,
        minWidth: NAME_COLUMN_WIDTH,
        align: 'center',
        fixed: 'left',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: `${CENTER_CELL_CLASS} ${NAME_CELL_CLASS}` }),
        onCell: () => ({
          className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS} ${NAME_CELL_CLASS}`,
        }),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: CONTACT_COLUMN_WIDTH,
        minWidth: CONTACT_COLUMN_WIDTH,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: `${CENTER_CELL_CLASS} ${CONTACT_CELL_CLASS}` }),
        onCell: () => ({
          className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS} ${CONTACT_CELL_CLASS}`,
        }),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: EMAIL_COLUMN_WIDTH,
        minWidth: EMAIL_COLUMN_WIDTH,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: `${CENTER_CELL_CLASS} ${EMAIL_CELL_CLASS}` }),
        onCell: () => ({
          className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS} ${EMAIL_CELL_CLASS}`,
        }),
      },
      {
        title: 'JA 봉사 진행 경험',
        key: 'jaVolunteerExperience',
        width: JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH,
        minWidth: JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH,
        align: 'center',
        onHeaderCell: () => ({ className: `${CENTER_CELL_CLASS} ${JA_EXPERIENCE_CELL_CLASS}` }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${JA_EXPERIENCE_CELL_CLASS}` }),
        render: (_: unknown, record: GeneralVolunteerApplicantRow) =>
          formatGeneralJaVolunteerExperienceCell(record.hasJaVolunteerExperience),
      },
      ...essayColumns,
      {
        title: '담당자 A 평가',
        key: 'managerAEvaluation',
        width: MANAGER_EVAL_COLUMN_WIDTH,
        minWidth: MANAGER_EVAL_COLUMN_WIDTH,
        align: 'center',
        onHeaderCell: () => ({
          className: 'general-volunteer-screening__manager-eval-dropdown-header',
        }),
        onCell: () => ({ className: MANAGER_EVALUATION_CELL_CLASS }),
        render: (_: unknown, record: GeneralVolunteerApplicantRow) => (
          <StatusDropdownCell<GeneralManagerEvaluation>
            status={record.managerAEvaluation}
            statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
            renderBadge={evaluation => <GeneralManagerEvaluationBadge evaluation={evaluation} />}
            isItemDisabled={(current, option) => current === option}
            onChange={
              record.canEditManagerAEvaluation
                ? evaluation => onManagerAEvaluationChange(record.id, evaluation)
                : undefined
            }
            isUpdating={updatingManagerEvaluation === `${record.id}:A`}
            isOpen={
              record.canEditManagerAEvaluation &&
              openManagerDropdown?.rowId === record.id &&
              openManagerDropdown?.manager === 'A'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(
                open && record.canEditManagerAEvaluation ? { rowId: record.id, manager: 'A' } : null
              )
            }
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '담당자 B 평가',
        key: 'managerBEvaluation',
        width: MANAGER_EVAL_COLUMN_WIDTH,
        minWidth: MANAGER_EVAL_COLUMN_WIDTH,
        align: 'center',
        onHeaderCell: () => ({
          className: 'general-volunteer-screening__manager-eval-dropdown-header',
        }),
        onCell: () => ({ className: MANAGER_EVALUATION_CELL_CLASS }),
        render: (_: unknown, record: GeneralVolunteerApplicantRow) => (
          <StatusDropdownCell<GeneralManagerEvaluation>
            status={record.managerBEvaluation}
            statusOptions={GENERAL_MANAGER_EVALUATION_ORDER}
            renderBadge={evaluation => <GeneralManagerEvaluationBadge evaluation={evaluation} />}
            isItemDisabled={(current, option) => current === option}
            onChange={
              record.canEditManagerBEvaluation
                ? evaluation => onManagerBEvaluationChange(record.id, evaluation)
                : undefined
            }
            isUpdating={updatingManagerEvaluation === `${record.id}:B`}
            isOpen={
              record.canEditManagerBEvaluation &&
              openManagerDropdown?.rowId === record.id &&
              openManagerDropdown?.manager === 'B'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(
                open && record.canEditManagerBEvaluation ? { rowId: record.id, manager: 'B' } : null
              )
            }
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '1차 서류 심사 현황',
        dataIndex: 'documentScreeningStatus',
        key: 'documentScreeningStatus',
        width: DOCUMENT_STATUS_COLUMN_WIDTH,
        minWidth: DOCUMENT_STATUS_COLUMN_WIDTH,
        align: 'center',
        onCell: () => ({ className: 'general-volunteer-screening__screening-status-cell' }),
        render: (status: GeneralVolunteerApplicantRow['documentScreeningStatus']) => (
          <GeneralDocumentScreeningStatusText status={status} />
        ),
      },
    ]
  }, [
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
    updatingManagerEvaluation,
  ])
}

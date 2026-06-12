import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
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

const JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH = 160

export const GENERAL_DOC_SCREENING_TABLE_SCROLL_X =
  60 +
  72 +
  140 +
  140 +
  220 +
  JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH +
  200 +
  200 +
  160 +
  Object.values(GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS).reduce((sum, width) => sum + width, 0)

const CENTER_CELL_CLASS = 'general-volunteer-screening__center-cell'
const NOWRAP_CELL_CLASS = 'general-volunteer-screening__nowrap-cell'
const ESSAY_CELL_CLASS = 'general-volunteer-screening__essay-cell'
const ESSAY_TEXT_CELL_CLASS = 'general-volunteer-screening__essay-text'
const MANAGER_EVALUATION_CELL_CLASS = `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME} general-volunteer-screening__manager-eval-dropdown-cell`

function renderEssayCell(value: string | undefined, record: GeneralVolunteerApplicantRow) {
  const display = formatGeneralVolunteerEssayCellValue(record.applicationType, value)
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
}: {
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: Dispatch<SetStateAction<{ rowId: string; manager: 'A' | 'B' } | null>>
}): ColumnsType<GeneralVolunteerApplicantRow> {
  return useMemo(() => {
    const essayColumns: ColumnsType<GeneralVolunteerApplicantRow> = (
      Object.keys(GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES) as GeneralEssayColumnKey[]
    ).map(key => ({
      title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES[key],
      dataIndex: key,
      key,
      width: GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS[key],
      minWidth: GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS[key],
      align: 'center',
      ellipsis: false,
      onHeaderCell: () => ({ className: ESSAY_CELL_CLASS }),
      onCell: () => ({ className: ESSAY_CELL_CLASS }),
      render: (value: string | undefined, record: GeneralVolunteerApplicantRow) =>
        renderEssayCell(value, record),
    }))

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 72,
        minWidth: 72,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
      },
      {
        title: '신청 봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        minWidth: 140,
        align: 'center',
        fixed: 'left',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        minWidth: 140,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        minWidth: 220,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: 'JA 봉사 진행 경험',
        key: 'jaVolunteerExperience',
        width: JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH,
        minWidth: JA_VOLUNTEER_EXPERIENCE_COLUMN_WIDTH,
        align: 'center',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
        render: (_: unknown, record: GeneralVolunteerApplicantRow) =>
          formatGeneralJaVolunteerExperienceCell(record.hasJaVolunteerExperience),
      },
      ...essayColumns,
      {
        title: '담당자 A 평가',
        key: 'managerAEvaluation',
        width: 200,
        minWidth: 200,
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
            onChange={evaluation => onManagerAEvaluationChange(record.id, evaluation)}
            isOpen={
              openManagerDropdown?.rowId === record.id && openManagerDropdown?.manager === 'A'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(open ? { rowId: record.id, manager: 'A' } : null)
            }
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '담당자 B 평가',
        key: 'managerBEvaluation',
        width: 200,
        minWidth: 200,
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
            onChange={evaluation => onManagerBEvaluationChange(record.id, evaluation)}
            isOpen={
              openManagerDropdown?.rowId === record.id && openManagerDropdown?.manager === 'B'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(open ? { rowId: record.id, manager: 'B' } : null)
            }
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '1차 서류 심사 현황',
        dataIndex: 'documentScreeningStatus',
        key: 'documentScreeningStatus',
        width: 160,
        minWidth: 160,
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
  ])
}

import { useMemo, type Dispatch, type RefObject, type SetStateAction, type SyntheticEvent } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { ResizeCallbackData } from 'react-resizable'
import { STATUS_DROPDOWN_CELL_CLASSNAME, StatusDropdownCell } from '@/shared/components'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { formatUjatVolunteerApplicationType } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS,
  UJAT_ESSAY_COLUMN_MIN_WIDTHS,
  UJAT_MANAGER_EVALUATION_ORDER,
  UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatUjatVolunteerEssayCellValue,
  type UjatEssayColumnKey,
  type UjatManagerEvaluation,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { DocumentScreeningStatusText } from './document-screening-status-text'
import { ManagerEvaluationBadge } from './manager-evaluation-badge'

export const UJAT_DOC_SCREENING_SELECTION_COLUMN_WIDTH = 60

/** @deprecated UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS 사용 */
export const DEFAULT_ESSAY_COLUMN_WIDTH = UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS.essayIntro
/** @deprecated UJAT_ESSAY_COLUMN_MIN_WIDTHS 사용 */
export const ESSAY_COLUMN_MIN_WIDTH = UJAT_ESSAY_COLUMN_MIN_WIDTHS.essayIntro
export const ESSAY_COLUMN_MAX_WIDTH = 600

export { UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS, UJAT_ESSAY_COLUMN_MIN_WIDTHS }

export type { UjatEssayColumnKey } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type UjatEssayColumnWidths = Record<UjatEssayColumnKey, number>

const CENTER_CELL_CLASS = 'ujat-volunteer-doc-screening__center-cell'
const NOWRAP_CELL_CLASS = 'ujat-volunteer-doc-screening__nowrap-cell'
const ESSAY_CELL_CLASS = 'ujat-volunteer-doc-screening__essay-cell'

const FIXED_COLUMN_WIDTH_SUM =
  72 + // No.
  140 + // name
  116 + // grade
  168 + // preferredRegion
  140 + // contact
  220 + // email
  120 + // educationExperience
  168 + // applicationType (UJAT 수료자 봉사자 한 줄)
  200 + // managerA
  200 + // managerB
  160 // documentScreeningStatus

/** @deprecated use computeDocScreeningTableScrollX */
export const UJAT_VOLUNTEER_DOC_SCREENING_TABLE_SCROLL_X =
  computeDocScreeningTableScrollX(UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS)

export function computeDocScreeningTableScrollX(essayWidths: UjatEssayColumnWidths): number {
  const essaySum =
    essayWidths.essayIntro +
    essayWidths.essayEducationExperience +
    essayWidths.essayNecessity +
    essayWidths.essayJaExperience
  return UJAT_DOC_SCREENING_SELECTION_COLUMN_WIDTH + FIXED_COLUMN_WIDTH_SUM + essaySum
}

function renderEssayCell(value: string | undefined, record: UjatVolunteerApplicantRow) {
  const display = formatUjatVolunteerEssayCellValue(record.applicationType, value)
  return <span className="ujat-volunteer-doc-screening__text-cell">{display}</span>
}

function buildEssayColumnResizeStopHandler(
  key: UjatEssayColumnKey,
  onEssayColumnResizeStop: (key: UjatEssayColumnKey, width: number) => void
) {
  return (_e: SyntheticEvent, { size }: ResizeCallbackData) => {
    onEssayColumnResizeStop(key, size.width)
  }
}

const MANAGER_EVALUATION_CELL_CLASS = `${STATUS_DROPDOWN_CELL_CLASSNAME} ujat-volunteer-doc-screening__manager-eval-dropdown-cell`

const MANAGER_EVALUATION_BADGE_STYLE = {
  width: 100,
  minWidth: 100,
  maxWidth: 200,
} as const

export function useUjatVolunteerDocScreeningColumns({
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
  openManagerDropdown,
  setOpenManagerDropdown,
  essayColumnWidths,
  onEssayColumnResizeStart,
  onEssayColumnResizeStop,
  tableWrapRef,
}: {
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: Dispatch<
    SetStateAction<{ rowId: string; manager: 'A' | 'B' } | null>
  >
  essayColumnWidths: UjatEssayColumnWidths
  onEssayColumnResizeStart: () => void
  onEssayColumnResizeStop: (key: UjatEssayColumnKey, width: number) => void
  tableWrapRef: RefObject<HTMLElement | null>
}): ColumnsType<UjatVolunteerApplicantRow> {
  return useMemo(() => {
    const essayColumns: ColumnsType<UjatVolunteerApplicantRow> = (
      Object.keys(UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES) as UjatEssayColumnKey[]
    ).map(key => {
      const width = essayColumnWidths[key]
      return {
        title: UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES[key],
        dataIndex: key,
        key,
        width,
        minWidth: UJAT_ESSAY_COLUMN_MIN_WIDTHS[key],
        align: 'center',
        ellipsis: false,
        onHeaderCell: () => ({
          width,
          className: ESSAY_CELL_CLASS,
          essayColKey: key,
          tableWrapRef,
          essayColumnWidths,
          onResizeStart: onEssayColumnResizeStart,
          onResizeStop: buildEssayColumnResizeStopHandler(key, onEssayColumnResizeStop),
        }),
        onCell: () => ({ className: ESSAY_CELL_CLASS }),
        render: (value: string | undefined, record: UjatVolunteerApplicantRow) =>
          renderEssayCell(value, record),
      }
    })

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
        title: '성함/봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        minWidth: 140,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
      },
      {
        title: '신청자 학년',
        dataIndex: 'grade',
        key: 'grade',
        width: 116,
        minWidth: 116,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
      },
      {
        title: '희망 교육 활동 지역',
        dataIndex: 'preferredRegion',
        key: 'preferredRegion',
        width: 168,
        minWidth: 168,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: CENTER_CELL_CLASS }),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        minWidth: 140,
        align: 'center',
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
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: '교육 진행 경험',
        key: 'educationExperience',
        width: 120,
        minWidth: 120,
        align: 'center',
        render: (_: unknown, record) => (record.hasEducationExperience ? 'O' : 'X'),
      },
      {
        title: '지원유형',
        dataIndex: 'applicationType',
        key: 'applicationType',
        width: 168,
        minWidth: 168,
        align: 'center',
        onHeaderCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
        render: (type: UjatVolunteerApplicantRow['applicationType']) =>
          formatUjatVolunteerApplicationType(type),
      },
      ...essayColumns,
      {
        title: '담당자 A 평가',
        key: 'managerAEvaluation',
        width: 200,
        minWidth: 200,
        align: 'center',
        onHeaderCell: () => ({
          className: 'ujat-volunteer-doc-screening__manager-eval-dropdown-header',
        }),
        onCell: () => ({ className: MANAGER_EVALUATION_CELL_CLASS }),
        render: (_: unknown, record) => (
          <StatusDropdownCell<UjatManagerEvaluation>
            status={record.managerAEvaluation}
            statusOptions={UJAT_MANAGER_EVALUATION_ORDER}
            renderBadge={evaluation => <ManagerEvaluationBadge evaluation={evaluation} />}
            isItemDisabled={(current, option) => current === option}
            onChange={evaluation => onManagerAEvaluationChange(record.id, evaluation)}
            isOpen={
              openManagerDropdown?.rowId === record.id && openManagerDropdown.manager === 'A'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(open ? { rowId: record.id, manager: 'A' } : null)
            }
            style={MANAGER_EVALUATION_BADGE_STYLE}
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
          className: 'ujat-volunteer-doc-screening__manager-eval-dropdown-header',
        }),
        onCell: () => ({ className: MANAGER_EVALUATION_CELL_CLASS }),
        render: (_: unknown, record) => (
          <StatusDropdownCell<UjatManagerEvaluation>
            status={record.managerBEvaluation}
            statusOptions={UJAT_MANAGER_EVALUATION_ORDER}
            renderBadge={evaluation => <ManagerEvaluationBadge evaluation={evaluation} />}
            isItemDisabled={(current, option) => current === option}
            onChange={evaluation => onManagerBEvaluationChange(record.id, evaluation)}
            isOpen={
              openManagerDropdown?.rowId === record.id && openManagerDropdown.manager === 'B'
            }
            onOpenChange={open =>
              setOpenManagerDropdown(open ? { rowId: record.id, manager: 'B' } : null)
            }
            style={MANAGER_EVALUATION_BADGE_STYLE}
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
        onCell: () => ({ className: 'ujat-volunteer-doc-screening__screening-status-cell' }),
        render: (status: UjatVolunteerApplicantRow['documentScreeningStatus']) => (
          <DocumentScreeningStatusText status={status} />
        ),
      },
    ]
  }, [
    essayColumnWidths,
    onEssayColumnResizeStart,
    onEssayColumnResizeStop,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
    tableWrapRef,
  ])
}

import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import type { TemplateRow } from '@/features/template/model/template.schema'
import './template-table.css'
import { CMS_DATA_TABLE_CELL_H40_ACTION_CLASS } from '@/shared/constants/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

/**
 * 작성·발급 양식 탭 공통 컬럼 폭 — 시안 기준 (QA 261113 CSS #1)
 * 템플릿명 738px(유연), 생성자·최초 생성일·최근 수정일·양식 관리 각 180px
 */
const TEMPLATE_LIST_COL_WIDTH = {
  no: 80,
  name: 738,
  creator: 180,
  date: 180,
  action: 180,
} as const

const TEMPLATE_LIST_SCROLL_X =
  TEMPLATE_LIST_COL_WIDTH.no +
  TEMPLATE_LIST_COL_WIDTH.name +
  TEMPLATE_LIST_COL_WIDTH.creator +
  TEMPLATE_LIST_COL_WIDTH.date * 2 +
  TEMPLATE_LIST_COL_WIDTH.action

interface TemplateTableProps {
  rows: TemplateRow[]
  onPreview: (row: TemplateRow) => void
}

export function TemplateTable({ rows, onPreview }: TemplateTableProps) {
  const columns = useMemo<ColumnsType<TemplateRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: TEMPLATE_LIST_COL_WIDTH.no,
        align: 'center',
        className: 'template-table__col-no',
        onHeaderCell: () => ({ className: 'template-table__col-no' }),
      },
      {
        title: '템플릿명',
        dataIndex: 'templateName',
        key: 'templateName',
        // 유연 열: 넓은 화면에서 남는 폭 흡수 (CmsDataTable 정확 폭 모드)
        minWidth: TEMPLATE_LIST_COL_WIDTH.name,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'template-table__col-name',
        onHeaderCell: () => ({ className: 'template-table__col-name' }),
      },
      {
        title: '생성자',
        dataIndex: 'creator',
        key: 'creator',
        width: TEMPLATE_LIST_COL_WIDTH.creator,
        align: 'center',
        ellipsis: true,
        className: 'template-table__col-creator',
        onHeaderCell: () => ({ className: 'template-table__col-creator' }),
      },
      {
        title: '최초 생성일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: TEMPLATE_LIST_COL_WIDTH.date,
        align: 'center',
        className: 'template-table__col-date',
        onHeaderCell: () => ({ className: 'template-table__col-date' }),
      },
      {
        title: '최근 수정일',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: TEMPLATE_LIST_COL_WIDTH.date,
        align: 'center',
        className: 'template-table__col-date',
        onHeaderCell: () => ({ className: 'template-table__col-date' }),
      },
      {
        title: '양식 관리',
        key: 'action',
        width: TEMPLATE_LIST_COL_WIDTH.action,
        align: 'center',
        className: `template-table__col-action ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        onHeaderCell: () => ({
          className: `template-table__col-action ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        }),
        onCell: () => ({
          className: `template-table__col-action ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        }),
        render: (_, row) => (
          <CmsButton size="small" variant="default" onClick={() => onPreview(row)}>
            상세보기
          </CmsButton>
        ),
      },
    ],
    [onPreview]
  )

  return (
    <CmsDataTable
      className="cms-data-table template-table"
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: TEMPLATE_LIST_SCROLL_X }}
    />
  )
}

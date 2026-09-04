import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import type { TemplateRow } from '@/features/template/model/template.schema'
import './template-table.css'

/**
 * 작성·발급 양식 탭 공통 컬럼 폭 — 등록 양식 시안 기준
 * 템플릿명 666px 고정, 나머지 고정
 */
const TEMPLATE_LIST_COL_WIDTH = {
  no: 80,
  name: 666,
  creator: 160,
  date: 160,
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
        width: TEMPLATE_LIST_COL_WIDTH.name,
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
        className: 'template-table__col-action',
        onHeaderCell: () => ({ className: 'template-table__col-action' }),
        render: (_, row) => (
          <CmsButton size="medium" variant="default" onClick={() => onPreview(row)}>
            양식 상세보기
          </CmsButton>
        ),
      },
    ],
    [onPreview]
  )

  return (
    <Table
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

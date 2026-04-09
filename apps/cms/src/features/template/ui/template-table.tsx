import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import type { TemplateRow } from '@/features/template/model/template.schema'

interface TemplateTableProps {
  rows: TemplateRow[]
  onPreview: (row: TemplateRow) => void
}

export function TemplateTable({ rows, onPreview }: TemplateTableProps) {
  const columns = useMemo<ColumnsType<TemplateRow>>(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 88, align: 'center' },
      { title: '템플릿명', dataIndex: 'templateName', key: 'templateName' },
      { title: '생성자', dataIndex: 'creator', key: 'creator', width: 180, align: 'center' },
      { title: '최초 생성일', dataIndex: 'createdAt', key: 'createdAt', width: 180, align: 'center' },
      { title: '최근 수정일', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, align: 'center' },
      {
        title: '양식 관리',
        key: 'action',
        width: 150,
        align: 'center',
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
      className="cms-data-table cms-data-table--border"
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
    />
  )
}

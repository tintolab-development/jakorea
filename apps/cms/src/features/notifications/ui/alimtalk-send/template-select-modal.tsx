import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput } from '@/shared/ui'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'
import './template-select-modal.css'

const PAGE_SIZE = 5

export const TEMPLATE_SELECT_MODAL_PAGE_SIZE = PAGE_SIZE

type TemplateSelectModalProps = {
  open: boolean
  templates: AlimtalkTemplateItem[]
  onClose: () => void
  onPreview: (template: AlimtalkTemplateItem) => void
  onUse: (template: AlimtalkTemplateItem) => void
  zIndex?: number
}

function matchesTemplateName(template: AlimtalkTemplateItem, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return true
  return (
    template.name.toLowerCase().includes(needle) ||
    template.templateName.toLowerCase().includes(needle)
  )
}

export function TemplateSelectModal({
  open,
  templates,
  onClose,
  onPreview,
  onUse,
  zIndex,
}: TemplateSelectModalProps) {
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => templates.filter(template => matchesTemplateName(template, appliedKeyword)),
    [appliedKeyword, templates]
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasResults = filtered.length > 0

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim())
    setPage(1)
  }

  const columns: ColumnsType<AlimtalkTemplateItem> = [
    {
      title: '템플릿명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      className: 'template-select-modal__col-name',
      onHeaderCell: () => ({ className: 'template-select-modal__col-name' }),
      render: value => (
        <div className="template-select-modal__name-cell-wrap">
          <span className="template-select-modal__name-cell">{value ?? '-'}</span>
        </div>
      ),
    },
    {
      title: '관리',
      key: 'actions',
      width: 220,
      align: 'center',
      className: 'template-select-modal__col-actions',
      onHeaderCell: () => ({ className: 'template-select-modal__col-actions' }),
      render: (_, record) => (
        <div
          className="template-select-modal__row-actions"
          onClick={event => event.stopPropagation()}
        >
          <CmsButton
            type="button"
            variant="default"
            size="small"
            width={80}
            className="template-select-modal__action-btn template-select-modal__action-btn--preview"
            onClick={event => {
              event.stopPropagation()
              onPreview(record)
            }}
          >
            미리보기
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="small"
            width={80}
            className="template-select-modal__action-btn template-select-modal__action-btn--use"
            onClick={event => {
              event.stopPropagation()
              onUse(record)
            }}
          >
            사용하기
          </CmsButton>
        </div>
      ),
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 선택"
      size="default"
      className="template-select-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={
        <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      <div className="template-select-modal__body">
        <div className="template-select-modal__search">
          <span className="template-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="템플릿명을 입력하세요"
              inputSize="large"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="large" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        {hasResults ? (
          <>
            <div className="template-select-modal__table-section">
              <p className="template-select-modal__count">총 {filtered.length}건</p>
              <Table
                className="cms-data-table cms-data-table--skip-auto-no-col template-select-modal__table"
                columns={columns}
                dataSource={paged}
                rowKey="id"
                pagination={false}
              />
            </div>
            <div className="template-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                ariaLabel="템플릿 선택 페이지 이동"
              />
            </div>
          </>
        ) : (
          <div className="template-select-modal__empty" role="status">
            {'검색 결과가 없습니다.\n검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.'}
          </div>
        )}
      </div>
    </ContentModal>
  )
}

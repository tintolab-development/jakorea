import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, useCmsAlert } from '@/shared/ui'
import { CMS_TABLE_EMPTY_COPY } from '@/shared/ui/cms-table-empty-copy'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import './template-select-modal.css'

export const TEMPLATE_SELECT_MODAL_PAGE_SIZE = 5

export type SendTemplatePickerItem = {
  id: string
  name: string
  templateName: string
}

export type TemplateSelectModalProps<T extends SendTemplatePickerItem> = {
  open: boolean
  templates: T[]
  onClose: () => void
  onPreview: (template: T) => void
  onUse: (template: T) => void
  isTemplateUsable?: (template: T) => boolean
  getTemplateUnusableMessage?: (template: T) => string | null
  isUseEnabled?: (template: T) => boolean
  onBeforeUse?: (template: T) => boolean
  useButtonLabel?: string
  extraColumns?: ColumnsType<T>
  zIndex?: number
}

function matchesTemplateName(template: SendTemplatePickerItem, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return true
  return (
    template.name.toLowerCase().includes(needle) ||
    template.templateName.toLowerCase().includes(needle)
  )
}

export function TemplateSelectModal<T extends SendTemplatePickerItem>({
  open,
  templates,
  onClose,
  onPreview,
  onUse,
  isTemplateUsable,
  getTemplateUnusableMessage,
  isUseEnabled,
  onBeforeUse,
  useButtonLabel = '사용하기',
  extraColumns,
  zIndex,
}: TemplateSelectModalProps<T>) {
  const { showAlert } = useCmsAlert()
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => templates.filter(template => matchesTemplateName(template, appliedKeyword)),
    [appliedKeyword, templates]
  )

  const totalPages = Math.ceil(filtered.length / TEMPLATE_SELECT_MODAL_PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice(
    (currentPage - 1) * TEMPLATE_SELECT_MODAL_PAGE_SIZE,
    currentPage * TEMPLATE_SELECT_MODAL_PAGE_SIZE
  )
  const hasResults = filtered.length > 0

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim())
    setHasSearched(true)
    setPage(1)
  }

  const handleUse = (record: T) => {
    if (onBeforeUse?.(record) === false) return
    if (isTemplateUsable?.(record) === false) {
      showAlert({
        title: '안내',
        content:
          getTemplateUnusableMessage?.(record) ||
          '현재 프로그램에서는 사용할 수 없는 변수가 포함된 템플릿입니다.',
      })
      return
    }
    onUse(record)
  }

  const columns: ColumnsType<T> = [
    {
      title: '템플릿명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      className: 'send-template-select-modal__col-name',
      onHeaderCell: () => ({ className: 'send-template-select-modal__col-name' }),
      ellipsis: true,
    },
    ...(extraColumns ?? []),
    {
      title: '관리',
      key: 'actions',
      width: 220,
      align: 'center',
      className: 'send-template-select-modal__col-actions',
      onHeaderCell: () => ({ className: 'send-template-select-modal__col-actions' }),
      render: (_, record) => {
        const canUse =
          (isUseEnabled?.(record) ?? true) && isTemplateUsable?.(record) !== false
        return (
          <div
            className="send-template-select-modal__row-actions"
            onClick={event => event.stopPropagation()}
          >
            <CmsButton
              type="button"
              variant="default"
              size="small"
              width={80}
              className="send-template-select-modal__action-btn send-template-select-modal__action-btn--preview"
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
              className="send-template-select-modal__action-btn send-template-select-modal__action-btn--use"
              disabled={!canUse}
              onClick={event => {
                event.stopPropagation()
                handleUse(record)
              }}
            >
              {useButtonLabel}
            </CmsButton>
          </div>
        )
      },
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 선택"
      size="default"
      className="send-template-select-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={null}
    >
      <div className="send-template-select-modal__body">
        <div className="send-template-select-modal__search">
          <span className="send-template-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="템플릿명을 입력해 주세요"
              inputSize="large"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="large" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        {hasSearched && hasResults ? (
          <>
            <div className="send-template-select-modal__table-section">
              <p className="send-template-select-modal__count">총 {filtered.length}건</p>
              <CmsDataTable
                className="cms-data-table cms-data-table--skip-auto-no-col send-template-select-modal__table"
                columns={columns}
                dataSource={paged}
                rowKey="id"
                pagination={false}
              />
            </div>
            <div className="send-template-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={setPage}
                ariaLabel="템플릿 선택 페이지 이동"
              />
            </div>
          </>
        ) : null}
        {hasSearched && !hasResults ? (
          <div className="send-template-select-modal__empty" role="status">
            <p className="send-template-select-modal__empty-title">
              {CMS_TABLE_EMPTY_COPY['no-search'].title}
            </p>
            <p className="send-template-select-modal__empty-description">
              {CMS_TABLE_EMPTY_COPY['no-search'].description}
            </p>
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}

import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, useCmsAlert } from '@/shared/ui'
import { CMS_TABLE_EMPTY_COPY } from '@/shared/ui/cms-table-empty-copy'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { formatTemplateVariableUsage } from '@/features/notifications/model/shared/template-variable-usage'
import './template-select-modal.css'

/** QA-0370: 한 페이지 5건 → 10건 */
export const TEMPLATE_SELECT_MODAL_PAGE_SIZE = 10

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
  /** 알림톡만. 메일·문자 피커는 기본 false — 비활성 사유를 행에 상시 표시 */
  showUnusableReasonInline?: boolean
  getTemplateUnusableReason?: (template: T) => { summary: string; detail: string } | null
}

/**
 * 「변수」 열 (QA-0370). `getKeys`가 null이면 본문을 몰라 `-`로 둔다.
 * `extraColumns`로 넘긴다.
 */
export function buildTemplateVariableUsageColumn<T extends SendTemplatePickerItem>(
  getKeys: (template: T) => Iterable<string> | null
): ColumnsType<T>[number] {
  return {
    title: '변수',
    key: 'variableUsage',
    width: 110,
    align: 'center',
    render: (_, record) => formatTemplateVariableUsage(getKeys(record)),
  }
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
  showUnusableReasonInline = false,
  getTemplateUnusableReason,
}: TemplateSelectModalProps<T>) {
  const { showAlert } = useCmsAlert()
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
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
  /** 검색어 적용 전 빈 목록은 「등록 없음」, 검색 후 빈 목록은 「검색 결과 없음」 */
  const emptyCopy = CMS_TABLE_EMPTY_COPY[appliedKeyword ? 'no-search' : 'no-data']

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim())
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
      width: 200,
      align: 'center',
      className: 'send-template-select-modal__col-actions',
      onHeaderCell: () => ({ className: 'send-template-select-modal__col-actions' }),
      render: (_, record) => {
        const canUse = (isUseEnabled?.(record) ?? true) && isTemplateUsable?.(record) !== false
        const fallbackMessage =
          showUnusableReasonInline && !canUse ? getTemplateUnusableMessage?.(record) : null
        const reason =
          showUnusableReasonInline && !canUse
            ? (getTemplateUnusableReason?.(record) ??
              (fallbackMessage ? { summary: fallbackMessage, detail: fallbackMessage } : null))
            : null
        const reasonId = reason ? `send-template-unusable-${record.id}` : undefined
        return (
          <div
            className="send-template-select-modal__row-actions"
            onClick={event => event.stopPropagation()}
          >
            <div className="send-template-select-modal__row-actions-buttons">
              <CmsButton
                type="button"
                variant="default"
                size="small"
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
                className="send-template-select-modal__action-btn send-template-select-modal__action-btn--use"
                disabled={!canUse}
                aria-describedby={reasonId}
                onClick={event => {
                  event.stopPropagation()
                  handleUse(record)
                }}
              >
                {useButtonLabel}
              </CmsButton>
            </div>
            {reason ? (
              <p
                id={reasonId}
                className="send-template-select-modal__unusable-reason"
                title={reason.detail}
              >
                {reason.summary}
              </p>
            ) : null}
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
      footer={
        <CmsButton variant="cancel" size="h40" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
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
              inputSize="medium"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="h40" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        {/* 시안: 진입 시 전체 목록을 바로 보여 주고, 검색은 목록을 좁힌다 */}
        {hasResults ? (
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
        {!hasResults ? (
          <div className="send-template-select-modal__empty" role="status">
            <p className="send-template-select-modal__empty-title">{emptyCopy.title}</p>
            <p className="send-template-select-modal__empty-description">{emptyCopy.description}</p>
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput } from '@/shared/ui'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import type { TemplateRow } from '@/features/template/model/template.schema'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import { loadFormTemplateVersionDraft } from '@/features/template/api/admin-form-templates-service'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import './writing-template-select-modal.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

const PAGE_SIZE = 5
const PICKER_Z_INDEX = 1200
const PREVIEW_Z_INDEX = 1400

export type WritingTemplateSelectCategory = 'application' | 'application_form'

type WritingTemplateSelectModalProps = {
  open: boolean
  category: WritingTemplateSelectCategory
  currentTemplateName: string
  /** 지정 시 해당 카탈로그 패밀리(복제본 포함)만 노출. 생략하면 카테고리 전체. */
  familyBaseTemplateCode?: string
  onClose: () => void
  onUse: (row: TemplateRow) => void
}

function matchesTemplateName(row: TemplateRow, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return true
  return row.templateName.toLowerCase().includes(needle) || row.id.toLowerCase().includes(needle)
}

function noopUpdateParagraph(): void {
  /* 선택 모달 미리보기는 읽기 전용 */
}

export function WritingTemplateSelectModal({
  open,
  category,
  currentTemplateName,
  familyBaseTemplateCode,
  onClose,
  onUse,
}: WritingTemplateSelectModalProps) {
  const queryClient = useQueryClient()
  const { sections, isFetching } = useWritingFormSections()
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [previewRow, setPreviewRow] = useState<TemplateRow | null>(null)
  const [previewDraft, setPreviewDraft] = useState<WritingFormDraft | null>(null)

  useEffect(() => {
    if (!open) return
    setKeyword('')
    setAppliedKeyword('')
    setPage(1)
    setPreviewRow(null)
    setPreviewDraft(null)
    void queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.writingSections() })
  }, [open, queryClient])

  const rows = useMemo(() => {
    const section = sections.find(item => item.key === category)
    const all = section?.rows ?? []
    const family = familyBaseTemplateCode?.trim()
    if (family == null || family === '') return all
    return all.filter(
      row => resolveWritingFormBaseTemplateCode(row.id, row.baseTemplateCode) === family
    )
  }, [category, familyBaseTemplateCode, sections])

  const filtered = useMemo(
    () => rows.filter(row => matchesTemplateName(row, appliedKeyword)),
    [appliedKeyword, rows]
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasResults = filtered.length > 0

  const handleClose = () => {
    setPreviewRow(null)
    setPreviewDraft(null)
    onClose()
  }

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim())
    setPage(1)
  }

  const handlePreview = async (row: TemplateRow) => {
    const saved = await loadFormTemplateVersionDraft(row.id)
    const seed = createSeedDraftForOperationalCatalogId(
      resolveWritingFormBaseTemplateCode(row.id, row.baseTemplateCode)
    )
    setPreviewDraft(saved?.draft ?? seed ?? EMPTY_WRITING_FORM_DRAFT)
    setPreviewRow(row)
  }

  const columns: ColumnsType<TemplateRow> = [
    {
      title: '템플릿명',
      dataIndex: 'templateName',
      key: 'templateName',
      align: 'center',
      className: 'writing-template-select-modal__col-name',
      onHeaderCell: () => ({ className: 'writing-template-select-modal__col-name' }),
      render: value => (
        <div className="writing-template-select-modal__name-cell-wrap">
          <span className="writing-template-select-modal__name-cell">{value ?? '-'}</span>
        </div>
      ),
    },
    {
      title: '관리',
      key: 'actions',
      width: 220,
      align: 'center',
      className: 'writing-template-select-modal__col-actions',
      onHeaderCell: () => ({ className: 'writing-template-select-modal__col-actions' }),
      render: (_, record) => (
        <div
          className="writing-template-select-modal__row-actions"
          onClick={event => event.stopPropagation()}
        >
          <CmsButton
            type="button"
            variant="default"
            size="small"
            width={80}
            className="writing-template-select-modal__action-btn writing-template-select-modal__action-btn--preview"
            onClick={event => {
              event.stopPropagation()
              void handlePreview(record)
            }}
          >
            미리보기
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="small"
            width={80}
            className="writing-template-select-modal__action-btn writing-template-select-modal__action-btn--use"
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
    <>
      <ContentModal
        open={open}
        onCancel={handleClose}
        title="템플릿 선택"
        size="default"
        className="writing-template-select-modal"
        titleBodyGap="always"
        zIndex={PICKER_Z_INDEX}
        footer={
          <CmsButton variant="cancel" size="large" type="button" onClick={handleClose}>
            닫기
          </CmsButton>
        }
      >
        <div className="writing-template-select-modal__body">
          <p className="writing-template-select-modal__hint" role="note">
            현재 선택된 템플릿은 {currentTemplateName} 입니다.
          </p>
          <div className="writing-template-select-modal__search">
            <span className="writing-template-select-modal__search-input">
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

          {isFetching && !hasResults ? (
            <div className="writing-template-select-modal__empty" role="status">
              템플릿 목록을 불러오는 중입니다.
            </div>
          ) : hasResults ? (
            <>
              <div className="writing-template-select-modal__table-section">
                <p className="writing-template-select-modal__count">총 {filtered.length}건</p>
                <CmsDataTable
                  className="cms-data-table cms-data-table--skip-auto-no-col writing-template-select-modal__table"
                  columns={columns}
                  dataSource={paged}
                  rowKey="id"
                  pagination={false}
                />
              </div>
              <div className="writing-template-select-modal__pagination">
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
            <div className="writing-template-select-modal__empty" role="status">
              {'검색 결과가 없습니다.\n검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.'}
            </div>
          )}
        </div>
      </ContentModal>
      <TemplatePreviewModal
        open={previewRow != null && previewDraft != null}
        onClose={() => {
          setPreviewRow(null)
          setPreviewDraft(null)
        }}
        headerTitle={previewRow?.templateName ?? '양식 미리보기'}
        draft={previewDraft ?? EMPTY_WRITING_FORM_DRAFT}
        updateParagraph={noopUpdateParagraph}
        zIndex={PREVIEW_Z_INDEX}
        hideParagraphRequiredChrome
      />
    </>
  )
}

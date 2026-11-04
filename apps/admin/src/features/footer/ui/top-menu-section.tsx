/**
 * 푸터 — 상단 노출 메뉴
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FooterTopMenu } from '@/entities/footer/model/types'
import {
  useFooterTopMenusList,
  useReorderFooterTopMenus,
  useSaveFooterTopMenus,
  useSetFooterTopMenuActive,
} from '@/features/footer/api/hooks'
import { FooterDragHandle, FooterSortableTable } from '@/features/footer/ui/sortable-table'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import { CmsButton, CmsInput, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

const INTERNAL_LINK_LABEL = '사이트 내부 연결'

function buildLinkDraft(rows: FooterTopMenu[]): Record<string, string> {
  return Object.fromEntries(rows.map(row => [row.id, row.linkUrl]))
}

const FooterLinkField = memo(function FooterLinkField({
  sourceValue,
  ariaLabel,
  onDraftChange,
}: {
  sourceValue: string
  ariaLabel: string
  onDraftChange: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(sourceValue)

  useEffect(() => {
    setLocalValue(sourceValue)
  }, [sourceValue])

  return (
    <CmsInput
      inputSize="small"
      width="100%"
      value={localValue}
      onChange={e => {
        const next = e.target.value
        setLocalValue(next)
        onDraftChange(next)
      }}
      placeholder="연결 링크를 입력해 주세요"
      aria-label={ariaLabel}
    />
  )
})

export function FooterTopMenuSection() {
  const { showAlert } = useCmsAlert()
  const listQuery = useFooterTopMenusList()
  const reorderMutation = useReorderFooterTopMenus()
  const setActiveMutation = useSetFooterTopMenuActive()
  const saveMutation = useSaveFooterTopMenus()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [isEditing, setIsEditing] = useState(false)
  const linkDraftRef = useRef<Record<string, string>>({})

  const handleLinkDraftChange = useCallback((id: string, value: string) => {
    linkDraftRef.current = { ...linkDraftRef.current, [id]: value }
  }, [])

  const handleRowsReorder = useCallback(
    (reordered: FooterTopMenu[]) => {
      void reorderMutation.mutateAsync(reordered.map(r => r.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '메뉴 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const handleStartEdit = useCallback(() => {
    linkDraftRef.current = buildLinkDraft(rows)
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    linkDraftRef.current = {}
    setIsEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      const linkDraft = linkDraftRef.current
      await saveMutation.mutateAsync(
        rows.map(row => ({
          id: row.id,
          linkUrl: linkDraft[row.id] ?? row.linkUrl,
        }))
      )
      linkDraftRef.current = {}
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch {
      showAlert({
        title: '저장 실패',
        content: '상단 노출 메뉴 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [rows, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<FooterTopMenu>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        align: 'center',
        render: () => <FooterDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: TABLE_COLUMN_WIDTHS.usage,
        align: 'center',
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (_v, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.name} 사용 여부`}
          />
        ),
      },
      {
        title: '항목명',
        key: 'name',
        width: 200,
        align: 'center',
        ellipsis: true,
        render: (_v, record) => <span>{record.name}</span>,
      },
      {
        title: '연결 링크',
        key: 'linkUrl',
        minWidth: 280,
        align: 'center',
        ellipsis: true,
        render: (_v, record) => {
          if (isEditing && !record.isInternal) {
            return (
              <FooterLinkField
                sourceValue={linkDraftRef.current[record.id] ?? record.linkUrl}
                ariaLabel={`${record.name} 연결 링크`}
                onDraftChange={value => handleLinkDraftChange(record.id, value)}
              />
            )
          }
          if (record.isInternal) {
            const url = record.linkUrl.trim()
            return <span title={url || undefined}>{url || INTERNAL_LINK_LABEL}</span>
          }
          return <span title={record.linkUrl || undefined}>{record.linkUrl || '-'}</span>
        },
      },
    ],
    [handleLinkDraftChange, handleToggleActive, isEditing]
  )

  return (
    <section className="admin-list-card footer-section footer-top-menu-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 상단 노출 메뉴</span>
          <span className="table-description">
            {'관련 사이트 목록은 [JA Korea] > [기관 소개] > [JA Worldwide 관리]에서 등록 및 관리된 항목이 동일하게 노출됩니다.'}
          </span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="h40"
                type="button"
                onClick={handleCancelEdit}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="h40"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton
              variant="primary"
              size="h40"
              type="button"
              onClick={handleStartEdit}
              disabled={listQuery.isLoading || rows.length === 0}
            >
              수정
            </CmsButton>
          )}
        </div>
      </div>
      <div className="footer-section__table-scroll">
        <FooterSortableTable
          className="footer-top-menu-table"
          rows={rows}
          columns={columns}
          loading={listQuery.isLoading}
          onRowsReorder={handleRowsReorder}
        />
      </div>
    </section>
  )
}

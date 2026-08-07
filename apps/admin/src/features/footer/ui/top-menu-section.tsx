/**
 * 푸터 — 상단 노출 메뉴
 */

import { useCallback, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FooterTopMenu } from '@/entities/footer/model/types'
import {
  useFooterTopMenusList,
  useReorderFooterTopMenus,
  useSaveFooterTopMenus,
  useSetFooterTopMenuActive,
} from '@/features/footer/api/hooks'
import { INTERNAL_LINK_LABEL } from '@/features/footer/api/store'
import { FooterDragHandle, FooterSortableTable } from '@/features/footer/ui/sortable-table'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftRow = {
  name: string
  linkUrl: string
}

function buildDraft(rows: FooterTopMenu[]): Record<string, DraftRow> {
  return Object.fromEntries(
    rows.map(row => [row.id, { name: row.name, linkUrl: row.linkUrl }])
  )
}

export function FooterTopMenuSection() {
  const { showAlert } = useCmsAlert()
  const listQuery = useFooterTopMenusList()
  const reorderMutation = useReorderFooterTopMenus()
  const setActiveMutation = useSetFooterTopMenuActive()
  const saveMutation = useSaveFooterTopMenus()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, DraftRow>>({})

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
    setDraft(buildDraft(rows))
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    setDraft({})
    setIsEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(
        rows.map(row => {
          const d = draft[row.id]
          return {
            id: row.id,
            name: d?.name ?? row.name,
            linkUrl: d?.linkUrl ?? row.linkUrl,
          }
        })
      )
      setDraft({})
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '상단 노출 메뉴 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, rows, saveMutation, showAlert])

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
        render: (_v, record) =>
          isEditing ? (
            <CmsInput
              inputSize="medium"
              width="100%"
              value={draft[record.id]?.name ?? record.name}
              onChange={e =>
                setDraft(prev => ({
                  ...prev,
                  [record.id]: {
                    name: e.target.value,
                    linkUrl: prev[record.id]?.linkUrl ?? record.linkUrl,
                  },
                }))
              }
              aria-label={`${record.name} 항목명`}
            />
          ) : (
            <span>{record.name}</span>
          ),
      },
      {
        title: '연결 링크',
        key: 'linkUrl',
        minWidth: 280,
        align: 'center',
        ellipsis: true,
        render: (_v, record) => {
          if (isEditing) {
            return (
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft[record.id]?.linkUrl ?? record.linkUrl}
                onChange={e =>
                  setDraft(prev => ({
                    ...prev,
                    [record.id]: {
                      name: prev[record.id]?.name ?? record.name,
                      linkUrl: e.target.value,
                    },
                  }))
                }
                placeholder={
                  record.isInternal
                    ? '사이트 내부 연결 경로를 입력하세요'
                    : '연결 링크를 입력하세요'
                }
                aria-label={`${record.name} 연결 링크`}
              />
            )
          }
          if (record.isInternal) {
            const url = record.linkUrl.trim()
            return (
              <span title={url || undefined}>
                {url || INTERNAL_LINK_LABEL}
              </span>
            )
          }
          return (
            <span title={record.linkUrl || undefined}>{record.linkUrl || '-'}</span>
          )
        },
      },
    ],
    [draft, handleToggleActive, isEditing]
  )

  return (
    <section className="footer-section footer-top-menu-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">상단 노출 메뉴</span>
          <span className="table-description">
            JA Worldwide 관리 내 글로벌 네트워크 테이블과 연동됩니다.
          </span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancelEdit}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
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
              size="large"
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

/**
 * GNB 메뉴 관리 — 조회 / 메뉴명 수정 모드
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GnbMenuDoc, GnbSubMenu, GnbTopMenu } from '@/entities/gnb-menu/model/types'
import { useSaveGnbMenu } from '@/features/gnb-menu/api/hooks'
import {
  GnbMenuDragHandle,
  GnbMenuSortableTable,
} from '@/features/gnb-menu/ui/sortable-table'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'

import './gnb-menu-form.css'

type Props = {
  data: GnbMenuDoc
}

function cloneDoc(doc: GnbMenuDoc): GnbMenuDoc {
  return {
    updatedAt: doc.updatedAt,
    groups: doc.groups.map(g => ({
      ...g,
      items: g.items.map(item => ({ ...item })),
    })),
  }
}

function renumberItems(items: GnbSubMenu[]): GnbSubMenu[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

export function GnbMenuFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveGnbMenu()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<GnbMenuDoc>(() => cloneDoc(data))

  useEffect(() => {
    if (isEditing) return
    setDraft(cloneDoc(data))
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    setDraft(cloneDoc(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneDoc(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    for (const group of draft.groups) {
      for (const item of group.items) {
        if (!item.name.trim()) {
          showAlert({
            title: '필수 항목 누락',
            content: '하위 메뉴명을 입력해 주세요.',
          })
          return
        }
      }
    }
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'GNB 메뉴 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateGroupItems = useCallback(
    (groupId: string, nextItems: GnbSubMenu[]) => {
      setDraft(prev => ({
        ...prev,
        groups: prev.groups.map(g =>
          g.id === groupId ? { ...g, items: renumberItems(nextItems) } : g
        ),
      }))
    },
    []
  )

  const updateItem = useCallback(
    (groupId: string, itemId: string, patch: Partial<Pick<GnbSubMenu, 'name' | 'isActive'>>) => {
      setDraft(prev => ({
        ...prev,
        groups: prev.groups.map(g => {
          if (g.id !== groupId) return g
          return {
            ...g,
            items: g.items.map(item =>
              item.id === itemId ? { ...item, ...patch } : item
            ),
          }
        }),
      }))
    },
    []
  )

  const displayGroups = isEditing ? draft.groups : data.groups

  const buildColumns = useCallback(
    (group: GnbTopMenu): ColumnsType<GnbSubMenu> => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        align: 'center',
        render: () => <GnbMenuDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: TABLE_COLUMN_WIDTHS.usage,
        className: CMS_TABLE_USAGE_COL_CLASS,
        align: 'center',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            disabled={!isEditing}
            onChange={checked => {
              if (!isEditing) return
              updateItem(group.id, record.id, { isActive: checked })
            }}
            aria-label={`${record.name} 사용 여부`}
          />
        ),
      },
      {
        title: '하위 메뉴명',
        key: 'name',
        className: 'gnb-menu-table__name-col',
        onCell: () => ({ className: 'gnb-menu-table__name-col' }),
        onHeaderCell: () => ({ className: 'gnb-menu-table__name-col' }),
        render: (_value, record) =>
          isEditing ? (
            <CmsInput
              className="gnb-menu-form__name-input"
              inputSize="medium"
              width="100%"
              value={record.name}
              onChange={e => updateItem(group.id, record.id, { name: e.target.value })}
              placeholder="하위 메뉴명"
            />
          ) : (
            <span className="gnb-menu-form__name-text">{record.name}</span>
          ),
      },
    ],
    [isEditing, updateItem]
  )

  const columnsByGroup = useMemo(() => {
    const map = new Map<string, ColumnsType<GnbSubMenu>>()
    for (const group of displayGroups) {
      map.set(group.id, buildColumns(group))
    }
    return map
  }, [buildColumns, displayGroups])

  return (
    <div className="admin-list-card gnb-menu-form-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">GNB 메뉴 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                disabled={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              메뉴명 수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="gnb-menu-form-card__body">
        {displayGroups.map(group => (
          <section key={group.id} className="gnb-menu-form-section">
            <div className="gnb-menu-form-section-title">
              <span className="gnb-menu-form-section-title__marker" aria-hidden>
                ■
              </span>
              <span className="gnb-menu-form-section-title__text">{group.label}</span>
            </div>
            <GnbMenuSortableTable
              rows={group.items}
              columns={columnsByGroup.get(group.id) ?? []}
              dragDisabled={!isEditing}
              onRowsReorder={next => {
                if (!isEditing) return
                updateGroupItems(group.id, next)
              }}
            />
          </section>
        ))}
      </div>
    </div>
  )
}

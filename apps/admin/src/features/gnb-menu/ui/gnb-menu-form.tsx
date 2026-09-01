/**
 * GNB 메뉴 관리 — 조회 / 메뉴명 수정 모드
 *
 * 타이핑 버벅임 방지: 메뉴명 draft는 ref + 행 단위 로컬 state.
 * 키마다 부모 setDraft/columns 재생성 → 전 테이블 리렌더하지 않음.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GnbMenuDoc, GnbSubMenu } from '@/entities/gnb-menu/model/types'
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

type NameDraftMap = Record<string, string>

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

function buildNameDraftMap(doc: GnbMenuDoc): NameDraftMap {
  const map: NameDraftMap = {}
  for (const group of doc.groups) {
    for (const item of group.items) {
      map[item.id] = item.name
    }
  }
  return map
}

const GnbInlineNameField = memo(function GnbInlineNameField({
  itemId,
  sourceValue,
  onDraftChange,
}: {
  itemId: string
  sourceValue: string
  onDraftChange: (itemId: string, value: string) => void
}) {
  const [localValue, setLocalValue] = useState(sourceValue)

  useEffect(() => {
    setLocalValue(sourceValue)
  }, [sourceValue])

  return (
    <CmsInput
      className="gnb-menu-form__name-input"
      inputSize="medium"
      width="100%"
      value={localValue}
      onChange={e => {
        const next = e.target.value
        setLocalValue(next)
        onDraftChange(itemId, next)
      }}
      placeholder="하위 메뉴명"
      aria-label="하위 메뉴명"
    />
  )
})

export function GnbMenuFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveGnbMenu()
  const [isEditing, setIsEditing] = useState(false)
  /** 순서용. 메뉴명 타이핑은 nameDraftRef만 갱신. 사용 여부는 조회 모드에서 즉시 저장 */
  const [draft, setDraft] = useState<GnbMenuDoc>(() => cloneDoc(data))
  const nameDraftRef = useRef<NameDraftMap>({})

  useEffect(() => {
    if (isEditing) return
    setDraft(cloneDoc(data))
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    const next = cloneDoc(data)
    setDraft(next)
    nameDraftRef.current = buildNameDraftMap(next)
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    nameDraftRef.current = {}
    setDraft(cloneDoc(data))
    setIsEditing(false)
  }, [data])

  /** 타이핑 중 부모 setState 금지 — ref만 갱신 */
  const handleNameDraftChange = useCallback((itemId: string, value: string) => {
    nameDraftRef.current = {
      ...nameDraftRef.current,
      [itemId]: value,
    }
  }, [])

  const handleSave = useCallback(async () => {
    const nameMap = nameDraftRef.current
    const nextDoc: GnbMenuDoc = {
      ...draft,
      groups: draft.groups.map(g => ({
        ...g,
        items: g.items.map(item => ({
          ...item,
          // 수정 모드에서는 사용 여부 변경 불가 — 서버/조회 데이터 유지
          isActive:
            data.groups.find(dg => dg.id === g.id)?.items.find(di => di.id === item.id)
              ?.isActive ?? item.isActive,
          name: nameMap[item.id] ?? item.name,
        })),
      })),
    }
    for (const group of nextDoc.groups) {
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
      await saveMutation.mutateAsync(nextDoc)
      nameDraftRef.current = {}
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'GNB 메뉴 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [data.groups, draft, saveMutation, showAlert])

  const updateGroupItems = useCallback((groupId: string, nextItems: GnbSubMenu[]) => {
    setDraft(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === groupId ? { ...g, items: renumberItems(nextItems) } : g
      ),
    }))
  }, [])

  /** 조회 모드: 사용 여부 즉시 저장. 수정 모드에서는 호출하지 않음 */
  const handleToggleActive = useCallback(
    (groupId: string, itemId: string, isActive: boolean) => {
      if (isEditing) return
      const nextDoc: GnbMenuDoc = {
        ...data,
        groups: data.groups.map(g => {
          if (g.id !== groupId) return g
          return {
            ...g,
            items: g.items.map(item => (item.id === itemId ? { ...item, isActive } : item)),
          }
        }),
      }
      void saveMutation.mutateAsync(nextDoc).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
      })
    },
    [data, isEditing, saveMutation, showAlert]
  )

  const displayGroups = isEditing ? draft.groups : data.groups

  const buildColumns = useCallback(
    (groupId: string): ColumnsType<GnbSubMenu> => [
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
            disabled={isEditing || saveMutation.isPending}
            onChange={checked => {
              handleToggleActive(groupId, record.id, checked)
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
            <GnbInlineNameField
              itemId={record.id}
              sourceValue={nameDraftRef.current[record.id] ?? record.name}
              onDraftChange={handleNameDraftChange}
            />
          ) : (
            <span className="gnb-menu-form__name-text">{record.name}</span>
          ),
      },
    ],
    [handleNameDraftChange, handleToggleActive, isEditing, saveMutation.isPending]
  )

  /** displayGroups(토글/순서)에 묶지 않음 — columns 재생성으로 인풋 remount 방지 */
  const columnsByGroup = useMemo(() => {
    const map = new Map<string, ColumnsType<GnbSubMenu>>()
    for (const group of data.groups) {
      map.set(group.id, buildColumns(group.id))
    }
    return map
  }, [buildColumns, data.groups])

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

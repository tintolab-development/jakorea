/**
 * GNB 메뉴 관리 — 대메뉴(그룹)별 섹션 카드 · 섹션별 수정/저장
 * 시안 36:59834: 통합 타이틀 없음 · 카드마다 「■ 대메뉴명」(20 Bold) + [수정](h40)
 *
 * 저장 API는 GNB 20개 메뉴 전체 PUT 하나뿐이다.
 * - 섹션 저장: 서버 현재값(`data`)에서 해당 섹션 items만 draft로 바꿔 보낸다 (다른 섹션 draft 섞지 않음)
 * - 조회 상태 사용 여부 토글·순서 드래그: 같은 방식으로 즉시 저장
 * - 어느 섹션이든 저장 중이면 다른 섹션 저장·토글·드래그 잠금 (version 충돌 방지)
 *
 * 타이핑 버벅임 방지: 메뉴명 draft는 ref + 행 단위 로컬 state.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GnbMenuDoc, GnbSubMenu, GnbTopMenu } from '@/entities/gnb-menu/model/types'
import { useIsGnbMenuSaving, useSaveGnbMenu } from '@/features/gnb-menu/api/hooks'
import {
  GNB_MENU_NAME_MAX_LENGTH,
  gnbMenuMutationFailureAlert,
} from '@/features/gnb-menu/lib/mutation-failure-alert'
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
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  showSaveCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

import './gnb-menu-form.css'

type NameDraftMap = Record<string, string>

function cloneItems(items: GnbSubMenu[]): GnbSubMenu[] {
  return items.map(item => ({ ...item }))
}

function renumberItems(items: GnbSubMenu[]): GnbSubMenu[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function buildNameDraftMap(items: GnbSubMenu[]): NameDraftMap {
  const map: NameDraftMap = {}
  for (const item of items) map[item.id] = item.name
  return map
}

/** 서버 현재 문서에서 한 섹션의 items만 교체 */
function withGroupItems(doc: GnbMenuDoc, groupId: string, items: GnbSubMenu[]): GnbMenuDoc {
  return {
    ...doc,
    groups: doc.groups.map(g => (g.id === groupId ? { ...g, items: renumberItems(items) } : g)),
  }
}

const GnbInlineNameField = memo(function GnbInlineNameField({
  itemId,
  sourceValue,
  isEditing,
  resetKey,
  onDraftChange,
}: {
  itemId: string
  sourceValue: string
  isEditing: boolean
  resetKey: number
  onDraftChange: (itemId: string, value: string) => void
}) {
  const [localValue, setLocalValue] = useState(sourceValue)

  useEffect(() => {
    setLocalValue(sourceValue)
  }, [resetKey, sourceValue])

  return (
    <CmsInput
      className={
        isEditing
          ? 'gnb-menu-form__name-input gnb-menu-form__name-input--edit'
          : 'gnb-menu-form__name-input gnb-menu-form__name-input--readonly'
      }
      inputSize="medium"
      width="100%"
      value={localValue}
      maxLength={GNB_MENU_NAME_MAX_LENGTH}
      readOnly={!isEditing}
      tabIndex={isEditing ? 0 : -1}
      onChange={e => {
        if (!isEditing) return
        const next = e.target.value
        setLocalValue(next)
        onDraftChange(itemId, next)
      }}
      placeholder="하위 메뉴명"
      aria-label="하위 메뉴명"
    />
  )
})

function GnbMenuGroupCard({ data, group }: { data: GnbMenuDoc; group: GnbTopMenu }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveGnbMenu()
  const anySaving = useIsGnbMenuSaving()
  const [isEditing, setIsEditing] = useState(false)
  /** 수정 모드 순서·사용 여부. 메뉴명 타이핑은 nameDraftRef만 갱신 */
  const [draftItems, setDraftItems] = useState<GnbSubMenu[]>(() => cloneItems(group.items))
  const nameDraftRef = useRef<NameDraftMap>({})
  const [nameResetKey, setNameResetKey] = useState(0)

  const groupId = group.id
  const groupLabel = group.label

  const handleEdit = useCallback(() => {
    setDraftItems(cloneItems(group.items))
    nameDraftRef.current = buildNameDraftMap(group.items)
    setIsEditing(true)
  }, [group.items])

  const handleCancel = useCallback(() => {
    nameDraftRef.current = {}
    setDraftItems(cloneItems(group.items))
    setIsEditing(false)
    setNameResetKey(key => key + 1)
  }, [group.items])

  /** 타이핑 중 부모 setState 금지 — ref만 갱신 */
  const handleNameDraftChange = useCallback((itemId: string, value: string) => {
    nameDraftRef.current = { ...nameDraftRef.current, [itemId]: value }
  }, [])

  const handleSave = useCallback(async () => {
    const nameMap = nameDraftRef.current
    const nextItems = draftItems.map(item => ({
      ...item,
      name: (nameMap[item.id] ?? item.name).trim(),
    }))
    if (nextItems.some(item => !item.name)) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    try {
      await saveMutation.mutateAsync(withGroupItems(data, groupId, nextItems))
      nameDraftRef.current = {}
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch (error) {
      showAlert(gnbMenuMutationFailureAlert(error, groupLabel, 'save'))
    }
  }, [data, draftItems, groupId, groupLabel, saveMutation, showAlert])

  /** 조회: 즉시 저장. 수정: draft에 반영 후 [저장] 시 함께 반영 */
  const handleToggleActive = useCallback(
    (itemId: string, isActive: boolean) => {
      if (isEditing) {
        setDraftItems(prev => prev.map(item => (item.id === itemId ? { ...item, isActive } : item)))
        return
      }
      const nextItems = group.items.map(item => (item.id === itemId ? { ...item, isActive } : item))
      void saveMutation.mutateAsync(withGroupItems(data, groupId, nextItems)).catch(error => {
        showAlert(gnbMenuMutationFailureAlert(error, groupLabel, 'toggle'))
      })
    },
    [data, group.items, groupId, groupLabel, isEditing, saveMutation, showAlert]
  )

  /** 조회: 드래그 즉시 저장(낙관적 반영). 수정: draft 순서만 변경 */
  const handleRowsReorder = useCallback(
    (next: GnbSubMenu[]) => {
      if (isEditing) {
        setDraftItems(renumberItems(next))
        return
      }
      void saveMutation.mutateAsync(withGroupItems(data, groupId, next)).catch(error => {
        showAlert(gnbMenuMutationFailureAlert(error, groupLabel, 'reorder'))
      })
    },
    [data, groupId, groupLabel, isEditing, saveMutation, showAlert]
  )

  const columns = useMemo<ColumnsType<GnbSubMenu>>(
    () => [
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
            disabled={anySaving}
            onChange={checked => {
              handleToggleActive(record.id, checked)
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
        render: (_value, record) => (
          <GnbInlineNameField
            itemId={record.id}
            sourceValue={
              isEditing ? (nameDraftRef.current[record.id] ?? record.name) : record.name
            }
            isEditing={isEditing}
            resetKey={nameResetKey}
            onDraftChange={handleNameDraftChange}
          />
        ),
      },
    ],
    [anySaving, handleNameDraftChange, handleToggleActive, isEditing, nameResetKey]
  )

  const rows = isEditing ? draftItems : group.items

  return (
    <section className="admin-list-card gnb-menu-form-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title-20">■ {groupLabel}</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="h40"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="h40"
                type="button"
                loading={saveMutation.isPending}
                disabled={anySaving}
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
              disabled={anySaving}
              onClick={handleEdit}
            >
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <GnbMenuSortableTable
        rows={rows}
        columns={columns}
        dragDisabled={anySaving}
        onRowsReorder={handleRowsReorder}
      />
    </section>
  )
}

/** 대메뉴별 섹션 카드 목록 */
export function GnbMenuSectionCards({ data }: { data: GnbMenuDoc }) {
  return (
    <div className="gnb-menu-sections">
      {data.groups.map(group => (
        <GnbMenuGroupCard key={group.id} data={data} group={group} />
      ))}
    </div>
  )
}

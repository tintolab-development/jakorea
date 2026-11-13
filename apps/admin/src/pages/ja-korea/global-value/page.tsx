/**
 * JA Global Value 관리
 */

import { useCallback, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GlobalValue } from '@/entities/global-value/model/types'
import {
  useGlobalValuesList,
  useReorderGlobalValues,
  useSaveGlobalValues,
  useSetGlobalValueActive,
} from '@/features/global-value/api/hooks'
import { GLOBAL_VALUE_SIX_ITEMS_SERVER_READY } from '@/features/global-value/api/capabilities'
import { GLOBAL_VALUE_PREVIEW_ROWS } from '@/features/global-value/api/preview-rows'
import { globalValueQueryKeys } from '@/features/global-value/api/query-keys'
import { GLOBAL_VALUES_CHANGED_EVENT } from '@/features/global-value/api/store'
import {
  GlobalValueDragHandle,
  GlobalValuesSortableTable,
} from '@/features/global-value/ui/sortable-table'
import { ValueIcon } from '@/features/global-value/ui/value-icon'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsTextArea, REQUIRED_FIELDS_INCOMPLETE_ALERT, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'

import './page.css'
type DraftTexts = Record<string, { mainText: string; subText: string }>

function buildDraftTexts(rows: GlobalValue[]): DraftTexts {
  return Object.fromEntries(
    rows.map(row => [row.id, { mainText: row.mainText, subText: row.subText }])
  )
}

/**
 * 서버 6항목 지원 전: 시안 6행 미리보기. 서버 조회·저장 없음.
 * 순서·사용 여부는 화면 안에서만 바뀌고(새로고침 시 초기화), [수정]은 비활성화한다.
 */
const IS_PREVIEW = !GLOBAL_VALUE_SIX_ITEMS_SERVER_READY

export function GlobalValuePage() {
  const { showAlert } = useCmsAlert()
  const listQuery = useGlobalValuesList(!IS_PREVIEW)
  const reorderMutation = useReorderGlobalValues()
  const setActiveMutation = useSetGlobalValueActive()
  const saveMutation = useSaveGlobalValues()
  const [previewRows, setPreviewRows] = useState<GlobalValue[]>(() => [
    ...GLOBAL_VALUE_PREVIEW_ROWS,
  ])

  const rows = useMemo(
    () => (IS_PREVIEW ? previewRows : (listQuery.data ?? [])),
    [listQuery.data, previewRows]
  )
  const [isEditing, setIsEditing] = useState(false)
  const [draftTexts, setDraftTexts] = useState<DraftTexts>({})

  useInvalidateOnWindowEvent(GLOBAL_VALUES_CHANGED_EVENT, globalValueQueryKeys.lists())

  const handleRowsReorder = useCallback(
    (reorderedRows: GlobalValue[]) => {
      if (IS_PREVIEW) {
        setPreviewRows(reorderedRows.map((row, index) => ({ ...row, sortOrder: index + 1 })))
        return
      }
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: 'JA Global Value 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      if (IS_PREVIEW) {
        setPreviewRows(prev => prev.map(row => (row.id === id ? { ...row, isActive } : row)))
        return
      }
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
    setDraftTexts(buildDraftTexts(rows))
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    setDraftTexts({})
    setIsEditing(false)
  }, [])

  const handleDraftChange = useCallback(
    (id: string, field: 'mainText' | 'subText', value: string) => {
      setDraftTexts(prev => ({
        ...prev,
        [id]: {
          mainText: field === 'mainText' ? value : (prev[id]?.mainText ?? ''),
          subText: field === 'subText' ? value : (prev[id]?.subText ?? ''),
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    const hasBlank = rows.some(row => {
      const draft = draftTexts[row.id]
      return !(draft?.mainText ?? row.mainText).trim() || !(draft?.subText ?? row.subText).trim()
    })
    if (hasBlank) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    try {
      await saveMutation.mutateAsync(
        rows.map(row => ({
          id: row.id,
          mainText: draftTexts[row.id]?.mainText ?? row.mainText,
          subText: draftTexts[row.id]?.subText ?? row.subText,
        }))
      )
      setDraftTexts({})
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'JA Global Value 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draftTexts, rows, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<GlobalValue>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        align: 'center',
        render: () => <GlobalValueDragHandle />,
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
        align: 'center',
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.mainText} 사용 여부`}
          />
        ),
      },
      {
        title: '아이콘',
        key: 'icon',
        width: 110,
        align: 'center',
        className: 'global-value-table__col--icon',
        // 시안 아이콘 54×54 (Figma 27:41296)
        render: (_value, record) => <ValueIcon iconKey={record.iconKey} size={54} />,
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        // 시안 열 폭(Figma 27:39543, 표 1538): 순서 80 · No. 80 · 사용 여부 100 · 아이콘 110 · 메인 584 · 서브 584
        // 메인·서브는 폭 미지정 — 남는 폭을 반씩 나눠 시안(584/584)과 같고, 좁은 화면에서 가로 스크롤이 늘지 않는다
        render: (_value, record) => {
          const value = draftTexts[record.id]?.mainText ?? record.mainText
          if (isEditing) {
            return (
              <CmsTextArea
                inputSize="medium"
                width="100%"
                layout="fixed"
                // 줄바꿈만큼 늘어남(hug, 상한 없음) — 같은 행 다른 칸은 표 공통 fill로 높이 맞춤
                autoSize={{ minRows: 1 }}
                value={value}
                onChange={e => handleDraftChange(record.id, 'mainText', e.target.value)}
                placeholder="메인 텍스트를 입력해 주세요"
                aria-label={`메인 텍스트 ${record.sortOrder}`}
              />
            )
          }
          return (
            <span className="global-value-page__main-text" title={value || undefined}>
              {value || '-'}
            </span>
          )
        },
      },
      {
        title: '서브 텍스트',
        key: 'subText',
        render: (_value, record) => {
          const value = draftTexts[record.id]?.subText ?? record.subText
          if (isEditing) {
            return (
              <CmsTextArea
                inputSize="medium"
                width="100%"
                layout="fixed"
                // 줄바꿈만큼 늘어남(hug, 상한 없음) — 같은 행 다른 칸은 표 공통 fill로 높이 맞춤
                autoSize={{ minRows: 1 }}
                value={value}
                onChange={e => handleDraftChange(record.id, 'subText', e.target.value)}
                placeholder="서브 텍스트를 입력해 주세요"
                aria-label={`서브 텍스트 ${record.sortOrder}`}
              />
            )
          }
          return (
            <span className="global-value-page__sub-text" title={value || undefined}>
              {value || '-'}
            </span>
          )
        },
      },
    ],
    [draftTexts, handleDraftChange, handleToggleActive, isEditing]
  )

  return (
    <div className="global-value-page">
      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">JA Global Value 관리</span>
            <span className="table-description">아이콘 이미지는 수정 및 삭제가 불가합니다.</span>
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
                disabled={IS_PREVIEW || listQuery.isLoading || rows.length === 0}
              >
                수정
              </CmsButton>
            )}
          </div>
        </div>

        <div className="global-value-page__table-scroll">
          <GlobalValuesSortableTable
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            onRowsReorder={handleRowsReorder}
          />
        </div>
      </div>
    </div>
  )
}

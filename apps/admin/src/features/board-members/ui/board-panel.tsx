/**
 * 이사회 관리 패널 — 그룹 테이블 + 일괄 수정 + 등록/삭제
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  BoardMember,
  BoardMemberCreateInput,
  BoardMemberTextPatch,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import {
  BOARD_ROLE_GROUP_LABELS,
  BOARD_ROLE_GROUP_ORDER,
} from '@/entities/board-members/model/types'
import {
  useBoardMembersList,
  useBulkUpdateBoardMembers,
  useCreateBoardMember,
  useRemoveBoardMembers,
  useReorderBoardMembersInGroup,
  useSetBoardMemberPublic,
} from '@/features/board-members/api/hooks'
import { boardMembersQueryKeys } from '@/features/board-members/api/query-keys'
import { BOARD_MEMBERS_CHANGED_EVENT } from '@/features/board-members/api/store'
import { BoardMemberFormModal } from '@/features/board-members/ui/board-member-form-modal'
import {
  BoardMemberDragHandle,
  BoardMembersSortableTable,
} from '@/features/board-members/ui/sortable-table'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_SORT_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsInput, ConfirmModal, PageContentLoading, useCmsAlert } from '@/shared/ui'

import './board-panel.css'

/**
 * 시안 이사회 테이블 컬럼 폭
 * 선택 60 · 순서·No 80 · 공개 100 (공통 상수) + 나머지 비율
 */
const BOARD_COLUMN_WIDTHS = {
  selection: TABLE_COLUMN_WIDTHS.checkbox,
  sort: TABLE_COLUMN_WIDTHS.sort,
  no: TABLE_COLUMN_WIDTHS.index,
  isPublic: TABLE_COLUMN_WIDTHS.usage,
  nameKo: 140,
  nameEn: 188,
  position: 120,
  affiliation: 460,
} as const

const BOARD_TABLE_SCROLL_X =
  BOARD_COLUMN_WIDTHS.selection +
  BOARD_COLUMN_WIDTHS.sort +
  BOARD_COLUMN_WIDTHS.no +
  BOARD_COLUMN_WIDTHS.isPublic +
  BOARD_COLUMN_WIDTHS.nameKo +
  BOARD_COLUMN_WIDTHS.nameEn +
  BOARD_COLUMN_WIDTHS.position +
  BOARD_COLUMN_WIDTHS.affiliation

type DraftFields = {
  nameKo: string
  nameEn: string
  position: string
  affiliation: string
}

type DraftMap = Record<string, DraftFields>

function buildDraftMap(rows: BoardMember[]): DraftMap {
  return Object.fromEntries(
    rows.map(row => [
      row.id,
      {
        nameKo: row.nameKo,
        nameEn: row.nameEn,
        position: row.position,
        affiliation: row.affiliation,
      },
    ])
  )
}

function inlineFieldClass(isEditing: boolean) {
  return [
    'board-panel-inline-field',
    isEditing ? 'board-panel-inline-field--edit' : 'board-panel-inline-field--readonly',
  ].join(' ')
}

export function BoardPanel() {
  const { showAlert } = useCmsAlert()
  const listQuery = useBoardMembersList()
  const createMutation = useCreateBoardMember()
  const bulkUpdateMutation = useBulkUpdateBoardMembers()
  const removeMutation = useRemoveBoardMembers()
  const reorderMutation = useReorderBoardMembersInGroup()
  const setPublicMutation = useSetBoardMemberPublic()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [isEditing, setIsEditing] = useState(false)
  const [draftMap, setDraftMap] = useState<DraftMap>({})
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [registerOpen, setRegisterOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(BOARD_MEMBERS_CHANGED_EVENT, boardMembersQueryKeys.lists())

  const groups = useMemo(() => {
    return BOARD_ROLE_GROUP_ORDER.map(roleGroup => ({
      roleGroup,
      label: BOARD_ROLE_GROUP_LABELS[roleGroup],
      rows: rows
        .filter(row => row.roleGroup === roleGroup)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
  }, [rows])

  const handleTogglePublic = useCallback(
    (id: string, isPublic: boolean) => {
      void setPublicMutation.mutateAsync({ id, isPublic }).catch(() => {
        showAlert({
          title: '공개 여부 변경 실패',
          content: '공개 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setPublicMutation, showAlert]
  )

  const handleRowsReorder = useCallback(
    (roleGroup: BoardRoleGroup, reorderedRows: BoardMember[]) => {
      void reorderMutation
        .mutateAsync({
          roleGroup,
          orderedIds: reorderedRows.map(row => row.id),
        })
        .catch(() => {
          showAlert({
            title: '순서 변경 실패',
            content: '이사회 구성원 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
          })
          void listQuery.refetch()
        })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleStartEdit = useCallback(() => {
    setDraftMap(buildDraftMap(rows))
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    setDraftMap({})
    setIsEditing(false)
  }, [])

  const handleDraftChange = useCallback(
    (id: string, field: keyof DraftFields, value: string) => {
      setDraftMap(prev => ({
        ...prev,
        [id]: {
          nameKo: field === 'nameKo' ? value : (prev[id]?.nameKo ?? ''),
          nameEn: field === 'nameEn' ? value : (prev[id]?.nameEn ?? ''),
          position: field === 'position' ? value : (prev[id]?.position ?? ''),
          affiliation: field === 'affiliation' ? value : (prev[id]?.affiliation ?? ''),
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    const patches: BoardMemberTextPatch[] = rows.map(row => ({
      id: row.id,
      nameKo: draftMap[row.id]?.nameKo ?? row.nameKo,
      nameEn: draftMap[row.id]?.nameEn ?? row.nameEn,
      position: draftMap[row.id]?.position ?? row.position,
      affiliation: draftMap[row.id]?.affiliation ?? row.affiliation,
    }))
    try {
      await bulkUpdateMutation.mutateAsync(patches)
      setDraftMap({})
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '이사회 구성원 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [bulkUpdateMutation, draftMap, listQuery, rows, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedKeys.length === 0) {
      showAlert({
        title: '선택 항목 없음',
        content: '삭제할 구성원을 선택해 주세요.',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedKeys.length, showAlert])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedKeys.map(String))
      setSelectedKeys([])
      setDeleteConfirmOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '구성원 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [listQuery, removeMutation, selectedKeys, showAlert])

  const handleRegister = useCallback(
    async (values: BoardMemberCreateInput) => {
      try {
        await createMutation.mutateAsync(values)
        setRegisterOpen(false)
      } catch {
        showAlert({
          title: '등록 실패',
          content: '구성원 등록에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, showAlert]
  )

  const buildColumns = useCallback(
    (): ColumnsType<BoardMember> => [
      {
        title: '순서',
        key: 'sort',
        width: BOARD_COLUMN_WIDTHS.sort,
        align: 'center',
        className: `${CMS_TABLE_SORT_COL_CLASS} board-members-table__col--sort`,
        onHeaderCell: () => ({ className: `${CMS_TABLE_SORT_COL_CLASS} board-members-table__col--sort` }),
        render: () => <BoardMemberDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: BOARD_COLUMN_WIDTHS.no,
        align: 'center',
        className: `${CMS_TABLE_NO_COL_CLASS} board-members-table__col--no`,
        onHeaderCell: () => ({
          className: `${CMS_TABLE_NO_COL_CLASS} board-members-table__col--no`,
        }),
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '공개 여부',
        key: 'isPublic',
        width: BOARD_COLUMN_WIDTHS.isPublic,
        align: 'center',
        className: 'board-members-table__col--public',
        onHeaderCell: () => ({ className: 'board-members-table__col--public' }),
        render: (_value, record) => (
          <Switch
            checked={record.isPublic}
            onChange={checked => handleTogglePublic(record.id, checked)}
            aria-label={`${record.nameKo} 공개 여부`}
            disabled={isEditing}
          />
        ),
      },
      {
        title: '한글 성명',
        key: 'nameKo',
        width: BOARD_COLUMN_WIDTHS.nameKo,
        align: 'center',
        ellipsis: true,
        className: 'board-members-table__col--name-ko',
        onHeaderCell: () => ({ className: 'board-members-table__col--name-ko' }),
        render: (_value, record) => {
          const value = draftMap[record.id]?.nameKo ?? record.nameKo
          return (
            <CmsInput
              className={inlineFieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, 'nameKo', e.target.value)
              }}
              aria-label={`${record.nameKo || '구성원'} 한글 성명`}
            />
          )
        },
      },
      {
        title: '영문 성명',
        key: 'nameEn',
        width: BOARD_COLUMN_WIDTHS.nameEn,
        align: 'center',
        ellipsis: true,
        className: 'board-members-table__col--name-en',
        onHeaderCell: () => ({ className: 'board-members-table__col--name-en' }),
        render: (_value, record) => {
          const value = draftMap[record.id]?.nameEn ?? record.nameEn
          return (
            <CmsInput
              className={inlineFieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, 'nameEn', e.target.value)
              }}
              aria-label={`${record.nameKo || '구성원'} 영문 성명`}
            />
          )
        },
      },
      {
        title: '직위',
        key: 'position',
        width: BOARD_COLUMN_WIDTHS.position,
        align: 'center',
        ellipsis: true,
        className: 'board-members-table__col--position',
        onHeaderCell: () => ({ className: 'board-members-table__col--position' }),
        render: (_value, record) => {
          const value = draftMap[record.id]?.position ?? record.position
          return (
            <CmsInput
              className={inlineFieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, 'position', e.target.value)
              }}
              aria-label={`${record.nameKo || '구성원'} 직위`}
            />
          )
        },
      },
      {
        title: '소속 및 직책',
        key: 'affiliation',
        width: BOARD_COLUMN_WIDTHS.affiliation,
        align: 'center',
        ellipsis: true,
        className: 'board-members-table__col--affiliation',
        onHeaderCell: () => ({ className: 'board-members-table__col--affiliation' }),
        render: (_value, record) => {
          const value = draftMap[record.id]?.affiliation ?? record.affiliation
          return (
            <CmsInput
              className={inlineFieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, 'affiliation', e.target.value)
              }}
              aria-label={`${record.nameKo || '구성원'} 소속 및 직책`}
            />
          )
        },
      },
    ],
    [draftMap, handleDraftChange, handleTogglePublic, isEditing]
  )

  const columns = useMemo(() => buildColumns(), [buildColumns])

  if (listQuery.isLoading) {
    return (
      <div className="board-panel">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (listQuery.isError) {
    return (
      <div className="board-panel">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="board-panel">
      <div className="admin-list-card board-panel__card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">이사회 관리</span>
            <span className="table-description">총 {rows.length}명</span>
          </div>
          <div className="table-header-actions--wrapper">
            {isEditing ? (
              <>
                <CmsButton
                  variant="secondary"
                  size="large"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={bulkUpdateMutation.isPending}
                >
                  취소
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  loading={bulkUpdateMutation.isPending}
                  onClick={() => {
                    void handleSave()
                  }}
                >
                  저장
                </CmsButton>
              </>
            ) : (
              <>
                <CmsButton
                  variant="delete"
                  size="large"
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={removeMutation.isPending}
                >
                  선택 삭제
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  size="large"
                  type="button"
                  onClick={handleStartEdit}
                  disabled={rows.length === 0}
                >
                  구성원 수정
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                >
                  구성원 등록
                </CmsButton>
              </>
            )}
          </div>
        </div>

        <div className="board-panel__body">
          {groups.map(group => (
            <section key={group.roleGroup} className="board-panel__group">
              <div className="board-panel__group-title">
                <span className="board-panel__group-title-marker" aria-hidden />
                <span className="board-panel__group-title-text">{group.label}</span>
              </div>
              <div className="board-panel__table-scroll">
                <BoardMembersSortableTable
                  rows={group.rows}
                  columns={columns}
                  loading={listQuery.isFetching && group.rows.length === 0}
                  scrollX={BOARD_TABLE_SCROLL_X}
                  selectionColumnWidth={BOARD_COLUMN_WIDTHS.selection}
                  rowSelection={{
                    selectedRowKeys: selectedKeys,
                    onChange: setSelectedKeys,
                  }}
                  onRowsReorder={reordered =>
                    handleRowsReorder(group.roleGroup, reordered)
                  }
                />
              </div>
            </section>
          ))}
        </div>
      </div>

      <BoardMemberFormModal
        open={registerOpen}
        confirmLoading={createMutation.isPending}
        onCancel={() => setRegisterOpen(false)}
        onSubmit={values => {
          void handleRegister(values)
        }}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="구성원 삭제"
        content={`선택한 ${selectedKeys.length}명의 구성원을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
      />
    </div>
  )
}

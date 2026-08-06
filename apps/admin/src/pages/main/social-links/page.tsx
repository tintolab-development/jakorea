/**
 * 메인 소셜 링크 관리
 */

import { useCallback, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SocialLink } from '@/entities/social-link/model/types'
import {
  useReorderSocialLinks,
  useSaveSocialLinks,
  useSetSocialLinkActive,
  useSocialLinksList,
} from '@/features/social-link/api/hooks'
import { socialLinkQueryKeys } from '@/features/social-link/api/query-keys'
import { SOCIAL_LINKS_CHANGED_EVENT } from '@/features/social-link/api/store'
import {
  SocialLinkDragHandle,
  SocialLinksSortableTable,
} from '@/features/social-link/ui/sortable-table'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'

import './page.css'

function buildDraftUrls(rows: SocialLink[]): Record<string, string> {
  return Object.fromEntries(rows.map(row => [row.id, row.linkUrl]))
}

export function SocialLinksPage() {
  const { showAlert } = useCmsAlert()
  const listQuery = useSocialLinksList()
  const reorderMutation = useReorderSocialLinks()
  const setActiveMutation = useSetSocialLinkActive()
  const saveMutation = useSaveSocialLinks()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [isEditing, setIsEditing] = useState(false)
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({})

  useInvalidateOnWindowEvent(SOCIAL_LINKS_CHANGED_EVENT, socialLinkQueryKeys.lists())

  const handleRowsReorder = useCallback(
    (reorderedRows: SocialLink[]) => {
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '소셜 링크 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
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
    setDraftUrls(buildDraftUrls(rows))
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    setDraftUrls({})
    setIsEditing(false)
  }, [])

  const handleDraftChange = useCallback((id: string, value: string) => {
    setDraftUrls(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    const invalid = rows.filter(row => {
      if (!row.isActive) return false
      const url = (draftUrls[row.id] ?? row.linkUrl).trim()
      return url.length === 0
    })
    if (invalid.length > 0) {
      showAlert({
        title: '연결 링크 필수',
        content: `사용 중인 채널(${invalid.map(r => r.name).join(', ')})의 연결 링크를 입력해 주세요.`,
      })
      return
    }

    try {
      await saveMutation.mutateAsync(
        rows.map(row => ({
          id: row.id,
          linkUrl: draftUrls[row.id] ?? row.linkUrl,
        }))
      )
      setDraftUrls({})
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '소셜 링크 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draftUrls, rows, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<SocialLink>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <SocialLinkDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 72,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: 100,
        align: 'center',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.name} 사용 여부`}
          />
        ),
      },
      {
        title: '소셜 매체명',
        key: 'name',
        width: 160,
        render: (_value, record) => (
          <span className="social-links-page__name">{record.name}</span>
        ),
      },
      {
        title: '연결 링크',
        key: 'linkUrl',
        render: (_value, record) =>
          isEditing ? (
            <CmsInput
              inputSize="medium"
              width="100%"
              value={draftUrls[record.id] ?? record.linkUrl}
              onChange={e => handleDraftChange(record.id, e.target.value)}
              placeholder="연결 링크를 입력하세요"
              aria-label={`${record.name} 연결 링크`}
            />
          ) : (
            <span className="social-links-page__link" title={record.linkUrl || undefined}>
              {record.linkUrl || '-'}
            </span>
          ),
      },
    ],
    [draftUrls, handleDraftChange, handleToggleActive, isEditing]
  )

  return (
    <div className="social-links-page">
      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">소셜 링크 목록</span>
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

        <div className="social-links-page__table-scroll">
          <SocialLinksSortableTable
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

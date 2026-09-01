/**
 * JA Worldwide 관리 — 단건 상세 폼 (view / edit)
 */

import { useCallback, useState } from 'react'
import type {
  JaKoreaWorldwide,
  WorldwideBranchId,
} from '@/entities/ja-korea-worldwide/model/types'
import { useSaveJaKoreaWorldwide } from '@/features/ja-korea-worldwide/api/hooks'
import { BranchesTable } from '@/features/ja-korea-worldwide/ui/branches-table'
import { BottomTextTable } from '@/features/ja-korea-worldwide/ui/bottom-text-table'
import {
  HTTP_LINK_URL_FORMAT_ALERT,
  isValidHttpLinkUrl,
} from '@/shared/lib/http-link-url'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './worldwide-form.css'

type Props = {
  data: JaKoreaWorldwide
}

function cloneWorldwide(data: JaKoreaWorldwide): JaKoreaWorldwide {
  return {
    branches: data.branches.map(b => ({ ...b })),
    bottomText: data.bottomText,
    updatedAt: data.updatedAt,
    settingVersion: data.settingVersion,
  }
}

export function WorldwideFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaKoreaWorldwide()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<JaKoreaWorldwide>(() => cloneWorldwide(data))

  const handleEdit = useCallback(() => {
    setDraft(cloneWorldwide(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneWorldwide(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    const invalidLink = draft.branches.find(branch => {
      const trimmed = branch.linkUrl.trim()
      return trimmed.length > 0 && !isValidHttpLinkUrl(trimmed)
    })
    if (invalidLink) {
      showAlert(HTTP_LINK_URL_FORMAT_ALERT)
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'JA Worldwide 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateLink = useCallback((id: WorldwideBranchId, linkUrl: string) => {
    setDraft(prev => ({
      ...prev,
      branches: prev.branches.map(b => (b.id === id ? { ...b, linkUrl } : b)),
    }))
  }, [])

  const mode = isEditing ? 'edit' : 'view'
  const branches = isEditing ? draft.branches : data.branches
  const bottomText = isEditing ? draft.bottomText : data.bottomText

  return (
    <div className="admin-list-card ja-worldwide-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">JA Worldwide 관리</span>
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
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="ja-worldwide-card__body">
        <BranchesTable branches={branches} mode={mode} onChangeLink={updateLink} />
        <BottomTextTable
          value={bottomText}
          mode={mode}
          onChange={next => setDraft(prev => ({ ...prev, bottomText: next }))}
        />
      </div>
    </div>
  )
}

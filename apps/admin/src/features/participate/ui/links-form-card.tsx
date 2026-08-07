/**
 * 참여하기 — 메뉴명 연결 링크 관리 카드
 * 조회↔수정: 동일 CmsInput + readOnly · 빈 링크는 empty 문구
 */

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import { useSaveParticipateMenuLinks } from '@/features/participate/api/hooks'
import { participateQueryKeys } from '@/features/participate/api/query-keys'
import { EMPTY_LINK_LABEL } from '@/features/participate/api/store'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'

import './links-form-card.css'

type Props = {
  data: ParticipateMenuLinks
}

type Draft = {
  onlineLearningUrl: string
  alumniUrl: string
}

function cloneDraft(data: ParticipateMenuLinks): Draft {
  return {
    onlineLearningUrl: data.onlineLearningUrl,
    alumniUrl: data.alumniUrl,
  }
}

function fieldClass(isEditing: boolean) {
  return [
    'participate-links-inline-field',
    isEditing
      ? 'participate-links-inline-field--edit'
      : 'participate-links-inline-field--readonly',
  ].join(' ')
}

function LinkFieldValue({
  isEditing,
  value,
  onChange,
  placeholder,
}: {
  isEditing: boolean
  value: string
  onChange: (next: string) => void
  placeholder: string
}) {
  const empty = !value.trim()

  if (!isEditing && empty) {
    return (
      <span className="participate-links-empty" aria-label={EMPTY_LINK_LABEL}>
        {EMPTY_LINK_LABEL}
      </span>
    )
  }

  return (
    <CmsInput
      className={fieldClass(isEditing)}
      inputSize="medium"
      width="100%"
      value={value}
      readOnly={!isEditing}
      tabIndex={isEditing ? 0 : -1}
      placeholder={placeholder}
      onChange={e => {
        if (!isEditing) return
        onChange(e.target.value)
      }}
    />
  )
}

export function ParticipateLinksFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const saveMutation = useSaveParticipateMenuLinks()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => cloneDraft(data))

  useEffect(() => {
    if (isEditing) return
    setDraft(cloneDraft(data))
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    setDraft(cloneDraft(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneDraft(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({
        onlineLearningUrl: draft.onlineLearningUrl,
        alumniUrl: draft.alumniUrl,
        updatedAt: data.updatedAt,
      })
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '메뉴 연결 링크 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void queryClient.invalidateQueries({ queryKey: participateQueryKeys.all })
    }
  }, [data.updatedAt, draft, queryClient, saveMutation, showAlert])

  return (
    <div
      className={
        isEditing
          ? 'admin-list-card participate-links-card participate-links-card--editing'
          : 'admin-list-card participate-links-card'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">메뉴명 연결 링크 관리</span>
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

      <div className="participate-links-card__body">
        <DetailInfoForm
          className="participate-links-card__info"
          title="메뉴 연결 링크"
          hideHeader
          mode="edit"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="온라인 학습 링크"
              view={null}
              edit={
                <LinkFieldValue
                  isEditing={isEditing}
                  value={draft.onlineLearningUrl}
                  placeholder="https://"
                  onChange={next =>
                    setDraft(prev => ({ ...prev, onlineLearningUrl: next }))
                  }
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="Alumni 링크"
              view={null}
              edit={
                <LinkFieldValue
                  isEditing={isEditing}
                  value={draft.alumniUrl}
                  placeholder="https://"
                  onChange={next => setDraft(prev => ({ ...prev, alumniUrl: next }))}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

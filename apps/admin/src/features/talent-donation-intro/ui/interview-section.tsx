/**
 * 재능기부 소개 — 인터뷰 슬롯 (인라인 편집 + 게시글 선택)
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { InterviewSlot } from '@/entities/talent-donation-intro/model/types'
import { useSaveInterview } from '@/features/talent-donation-intro/api/hooks'
import { talentDonationIntroSaveFailureAlert } from '@/features/talent-donation-intro/lib/save-failure-alert'
import { InterviewPostPickerModal } from '@/features/talent-donation-intro/ui/interview-post-picker-modal'
import { CmsButton, CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './section-shared.css'
import './interview-section.css'

type Draft = {
  mainText: string
  subText: string
  buttonLabel: string
  linkedStoryId: string | null
  linkedStoryTitle: string
  thumbnailUrl: string
}

function toDraft(slot: InterviewSlot): Draft {
  return {
    mainText: slot.mainText,
    subText: slot.subText,
    buttonLabel: slot.buttonLabel,
    linkedStoryId: slot.linkedStoryId,
    linkedStoryTitle: slot.linkedStoryTitle,
    thumbnailUrl: slot.thumbnailUrl,
  }
}

function slotTitle(id: InterviewSlot['id']): string {
  return id === 'interview_01' ? '■ 인터뷰 01' : '■ 인터뷰 02'
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  slot: InterviewSlot
}

export function InterviewSectionCard({ slot }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveInterview()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(slot))
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (isEditing) return
    setDraft(toDraft(slot))
  }, [isEditing, slot])

  const handleEdit = useCallback(() => {
    setDraft(toDraft(slot))
    setIsEditing(true)
  }, [slot])

  const handleCancel = useCallback(() => {
    setDraft(toDraft(slot))
    setIsEditing(false)
    setPickerOpen(false)
  }, [slot])

  const handleSave = useCallback(async () => {
    if (!draft.mainText.trim()) {
      showAlert({ title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' })
      return
    }
    if (!draft.subText.trim()) {
      showAlert({ title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' })
      return
    }
    if (!draft.buttonLabel.trim()) {
      showAlert({ title: '입력 확인', content: '버튼명을 입력해 주세요.' })
      return
    }
    if (!draft.linkedStoryTitle.trim() && !draft.linkedStoryId) {
      showAlert({ title: '입력 확인', content: '연결 게시글을 선택해 주세요.' })
      return
    }
    try {
      await saveMutation.mutateAsync({
        id: slot.id,
        mainText: draft.mainText,
        subText: draft.subText,
        buttonLabel: draft.buttonLabel,
        linkedStoryId: draft.linkedStoryId,
        linkedStoryTitle: draft.linkedStoryTitle,
        thumbnailUrl: draft.thumbnailUrl,
        version: slot.version,
      })
      setIsEditing(false)
    } catch (err) {
      showAlert(
        talentDonationIntroSaveFailureAlert(
          err,
          '인터뷰 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [draft, saveMutation, showAlert, slot.id, slot.version])

  const mode = isEditing ? 'edit' : 'view'

  return (
    <div className="talent-intro-section talent-intro-interview">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">{slotTitle(slot.id)}</span>
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

      <DetailInfoForm
        title={slotTitle(slot.id)}
        hideHeader
        mode={mode}
        className="talent-intro-interview__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 텍스트"
            view={<span className="talent-intro-interview__preline">{slot.mainText || '-'}</span>}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                value={draft.mainText}
                placeholder="메인 텍스트를 입력하세요"
                onChange={e => setDraft(prev => ({ ...prev, mainText: e.target.value }))}
              />
            }
            readOnlyDisplay={!isEditing}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            view={<span className="talent-intro-interview__preline">{slot.subText || '-'}</span>}
            edit={
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="large"
                width="100%"
                rows={4}
                value={draft.subText}
                placeholder="서브 텍스트를 입력하세요"
                onChange={e => setDraft(prev => ({ ...prev, subText: e.target.value }))}
              />
            }
            readOnlyDisplay={!isEditing}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="버튼명"
            view={<span>{slot.buttonLabel || '-'}</span>}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                value={draft.buttonLabel}
                placeholder="버튼명을 입력하세요"
                onChange={e => setDraft(prev => ({ ...prev, buttonLabel: e.target.value }))}
              />
            }
            readOnlyDisplay={!isEditing}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="연결 게시글"
            view={<span>{slot.linkedStoryTitle || '-'}</span>}
            edit={
              <CmsInput
                className="talent-intro-interview__post-input"
                inputSize="large"
                width="100%"
                readOnly
                value={draft.linkedStoryTitle}
                placeholder="연결할 게시글을 선택하세요"
                suffix={
                  <button
                    type="button"
                    className="talent-intro-interview__search-btn"
                    aria-label="게시글 검색"
                    onClick={() => setPickerOpen(true)}
                  >
                    <SearchIcon />
                  </button>
                }
                onClick={() => setPickerOpen(true)}
              />
            }
            readOnlyDisplay={!isEditing}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <InterviewPostPickerModal
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onSelect={payload => {
          setDraft(prev => ({
            ...prev,
            linkedStoryId: payload.id,
            linkedStoryTitle: payload.title,
            thumbnailUrl: payload.thumbnailUrl || prev.thumbnailUrl,
          }))
          setPickerOpen(false)
        }}
      />
    </div>
  )
}

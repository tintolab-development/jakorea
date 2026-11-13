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
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  CmsTextArea,
  showSaveCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

import './section-shared.css'
import './interview-section.css'
import { FieldSearchIcon } from '@jakorea/admin-ui/field'

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

function inlineFieldClass(isEditing: boolean): string {
  return [
    'talent-intro-interview__field',
    isEditing
      ? 'talent-intro-interview__field--edit'
      : 'talent-intro-interview__field--readonly',
  ].join(' ')
}

type Props = {
  slot: InterviewSlot
  siblingLinkedStoryIds?: readonly (string | null)[]
}

export function InterviewSectionCard({ slot, siblingLinkedStoryIds = [] }: Props) {
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
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!draft.subText.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!draft.buttonLabel.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!draft.linkedStoryId?.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const linkedId = draft.linkedStoryId?.trim() ?? ''
    if (linkedId && siblingLinkedStoryIds.some(id => (id ?? '').trim() === linkedId)) {
      showAlert({
        title: '연결 게시글 중복',
        content: '다른 인터뷰 슬롯에 이미 연결된 게시글입니다. 다른 글을 선택해 주세요.',
      })
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
      showSaveCompletedAlert()
    } catch (err) {
      showAlert(
        talentDonationIntroSaveFailureAlert(err, '인터뷰 저장에 실패했습니다. 다시 시도해 주세요.')
      )
    }
  }, [draft, saveMutation, showAlert, siblingLinkedStoryIds, slot.id, slot.version])

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
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="h40" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <DetailInfoForm
        title={slotTitle(slot.id)}
        hideHeader
        mode="edit"
        className="talent-intro-interview__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 텍스트"
            required={isEditing}
            view={null}
            edit={
              <CmsTextArea
                className={inlineFieldClass(isEditing)}
                inputSize="small"
                width="100%"
                // 높이 조절 핸들 없음(layout fixed) · 조회·수정 모두 내용 줄 수만큼(hug)
                layout="fixed"
                autoSize={{ minRows: 1 }}
                value={draft.mainText}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                placeholder="메인 텍스트를 입력해 주세요"
                onChange={e => {
                  if (!isEditing) return
                  setDraft(prev => ({ ...prev, mainText: e.target.value }))
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            required={isEditing}
            view={null}
            edit={
              <CmsTextArea
                className={inlineFieldClass(isEditing)}
                inputSize="small"
                width="100%"
                // 높이 조절 핸들 없음(layout fixed) · 조회·수정 모두 내용 줄 수만큼(hug)
                layout="fixed"
                autoSize={{ minRows: 1 }}
                value={draft.subText}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                placeholder="서브 텍스트를 입력해 주세요"
                onChange={e => {
                  if (!isEditing) return
                  setDraft(prev => ({ ...prev, subText: e.target.value }))
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="버튼명"
            required={isEditing}
            view={null}
            edit={
              <CmsInput
                className={inlineFieldClass(isEditing)}
                inputSize="small"
                width="100%"
                value={draft.buttonLabel}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                placeholder="버튼명을 입력해 주세요"
                onChange={e => {
                  if (!isEditing) return
                  setDraft(prev => ({ ...prev, buttonLabel: e.target.value }))
                }}
              />
            }
          />
          <DetailInfoForm.Field
            label="연결 게시글"
            required={isEditing}
            view={null}
            edit={
              <CmsInput
                className={`talent-intro-interview__post-input ${inlineFieldClass(isEditing)}`}
                inputSize="small"
                width="100%"
                readOnly
                allowClear={false}
                value={draft.linkedStoryTitle}
                placeholder="연결할 게시글을 선택해 주세요"
                // 조회에서는 아이콘을 두지 않아 글자가 아이콘 폭만큼 밀리지 않는다 (시안 496:39095)
                icon={
                  isEditing ? (
                    <button
                      type="button"
                      className="talent-intro-interview__search-btn"
                      aria-label="게시글 검색"
                      onClick={() => setPickerOpen(true)}
                    >
                      <FieldSearchIcon style={{ width: 20, height: 20 }} />
                    </button>
                  ) : undefined
                }
                onClick={() => {
                  if (!isEditing) return
                  setPickerOpen(true)
                }}
              />
            }
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

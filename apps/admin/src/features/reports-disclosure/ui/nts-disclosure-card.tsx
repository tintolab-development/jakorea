/**
 * 국세청 공시 — 버튼 연결 링크 단건 관리
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  useNtsDisclosure,
  useSaveNtsDisclosure,
} from '@/features/reports-disclosure/api/hooks'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT, CmsButton, CmsInput, PageContentLoading, showSaveCompletedAlert, useCmsAlert,
  mapAdminMutationAlert,
} from '@/shared/ui'

import './nts-disclosure-card.css'

function fieldClass(isEditing: boolean) {
  return [
    'rd-nts-inline-field',
    isEditing && 'rd-nts-inline-field--edit',
  ]
    .filter(Boolean)
    .join(' ')
}

export function NtsDisclosureCard() {
  const { showAlert } = useCmsAlert()
  const query = useNtsDisclosure()
  const saveMutation = useSaveNtsDisclosure()

  const data = query.data
  const [isEditing, setIsEditing] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')

  useEffect(() => {
    if (!isEditing && data) {
      setDraftUrl(data.linkUrl)
    }
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    if (data) setDraftUrl(data.linkUrl)
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    if (data) setDraftUrl(data.linkUrl)
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    const url = draftUrl.trim()
    if (!url) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    try {
      await saveMutation.mutateAsync(url)
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch (error) {
      // 잠금 충돌(다른 관리자 수정)·권한 거부·필수 미입력은 공통 문구, 그 외는 일반 실패 안내
      showAlert(
        mapAdminMutationAlert(error) ?? {
          title: '저장 실패',
          content: '국세청 공시 링크 저장에 실패했습니다. 다시 시도해 주세요.',
        },
      )
      void query.refetch()
    }
  }, [draftUrl, saveMutation, showAlert, query])

  if (query.isLoading) {
    return (
      <div className="admin-list-card admin-document-card rd-nts-card">
        <PageContentLoading variant="default" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-list-card admin-document-card rd-nts-card page-content-error" role="alert">
        콘텐츠를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <div
      className={
        isEditing
          ? 'admin-list-card admin-document-card rd-nts-card rd-nts-card--editing'
          : 'admin-list-card admin-document-card rd-nts-card'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">국세청 공시 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending} >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }} >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="medium" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="admin-document-card__body rd-nts-card__body">
        <DetailInfoForm title="국세청 공시" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="버튼 연결 링크"
              labelWidth={200}
              required={isEditing}
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draftUrl}
                  readOnly={!isEditing}
                  inlineReadOnly="slot"
                  onChange={e => {
                    if (!isEditing) return
                    setDraftUrl(e.target.value)
                  }}
                  placeholder="https://"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

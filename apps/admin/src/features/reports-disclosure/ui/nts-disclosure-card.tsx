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
import { reportsDisclosureQueryKeys } from '@/features/reports-disclosure/api/query-keys'
import { NTS_DISCLOSURE_CHANGED_EVENT } from '@/features/reports-disclosure/api/store'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsInput, PageContentLoading, useCmsAlert } from '@/shared/ui'

import './nts-disclosure-card.css'

function fieldClass(isEditing: boolean) {
  return [
    'rd-nts-inline-field',
    isEditing ? 'rd-nts-inline-field--edit' : 'rd-nts-inline-field--readonly',
  ].join(' ')
}

export function NtsDisclosureCard() {
  const { showAlert } = useCmsAlert()
  const query = useNtsDisclosure()
  const saveMutation = useSaveNtsDisclosure()

  useInvalidateOnWindowEvent(NTS_DISCLOSURE_CHANGED_EVENT, reportsDisclosureQueryKeys.nts())

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
      showAlert({
        title: '입력 확인',
        content: '버튼 연결 링크를 입력해 주세요.',
      })
      return
    }
    try {
      await saveMutation.mutateAsync(url)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '국세청 공시 링크 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void query.refetch()
    }
  }, [draftUrl, saveMutation, showAlert, query])

  if (query.isLoading) {
    return (
      <div className="admin-list-card rd-nts-card">
        <PageContentLoading variant="default" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-list-card rd-nts-card page-content-error" role="alert">
        콘텐츠를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <div
      className={
        isEditing
          ? 'admin-list-card rd-nts-card rd-nts-card--editing'
          : 'admin-list-card rd-nts-card'
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

      <div className="rd-nts-card__body">
        <DetailInfoForm title="국세청 공시" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="버튼 연결 링크"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draftUrl}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
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

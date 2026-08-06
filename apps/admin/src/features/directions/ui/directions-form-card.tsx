/**
 * 오시는 길 관리 — 단건 문서 폼 카드
 *
 * 조회↔수정 UI shift 최소화:
 * - 필드를 span↔input 으로 갈아끼우지 않음
 * - 동일 컨트롤을 유지하고 readOnly + 스타일만 전환
 */

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { DirectionsInfo } from '@/entities/directions/model/types'
import { useSaveDirections } from '@/features/directions/api/hooks'
import { directionsQueryKeys } from '@/features/directions/api/query-keys'
import { CmsButton, CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './directions-form-card.css'

type Props = {
  data: DirectionsInfo
}

function cloneDirections(data: DirectionsInfo): DirectionsInfo {
  return {
    addressKo: data.addressKo,
    addressEn: data.addressEn,
    kakaoMapHtml: data.kakaoMapHtml,
    phone: data.phone,
    fax: data.fax,
    email: data.email,
    updatedAt: data.updatedAt,
  }
}

function fieldClass(isEditing: boolean, ...extra: Array<string | false | undefined>) {
  return [
    'directions-inline-field',
    isEditing ? 'directions-inline-field--edit' : 'directions-inline-field--readonly',
    ...extra,
  ]
    .filter(Boolean)
    .join(' ')
}

export function DirectionsFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const saveMutation = useSaveDirections()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DirectionsInfo>(() => cloneDirections(data))

  useEffect(() => {
    if (isEditing) return
    setDraft(cloneDirections(data))
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    setDraft(cloneDirections(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneDirections(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '오시는 길 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void queryClient.invalidateQueries({ queryKey: directionsQueryKeys.all })
    }
  }, [draft, saveMutation, showAlert, queryClient])

  const updateDraft = useCallback(
    (patch: Partial<Omit<DirectionsInfo, 'updatedAt'>>) => {
      setDraft(prev => ({ ...prev, ...patch }))
    },
    []
  )

  return (
    <div
      className={
        isEditing
          ? 'admin-list-card directions-card directions-card--editing'
          : 'admin-list-card directions-card'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">오시는 길 관리</span>
          <span className="table-description">
            카카오맵 HTML 삽입 시, 지도의 크기는 1440*728 설정을 권장합니다.
          </span>
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

      <div className="directions-card__body">
        {/*
          mode 항상 edit — view/edit 슬롯 스왑으로 인한 언마운트·행 높이 점프 방지.
          조회 시 readOnly + readonly 스타일만 적용.
          상단 블록(주소+지도)이 남은 높이를 채우고, 카카오맵 HTML 행이 fill.
        */}
        <DetailInfoForm
          className="directions-card__info"
          title="오시는 길 정보"
          hideHeader
          mode="edit"
        >
          <DetailInfoForm.Row type="single" className="directions-card__row--fixed">
            <DetailInfoForm.Field
              label="국문 주소지"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.addressKo}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ addressKo: e.target.value })
                  }}
                  placeholder="국문 주소지 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single" className="directions-card__row--fixed">
            <DetailInfoForm.Field
              label="영문 주소지"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.addressEn}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ addressEn: e.target.value })
                  }}
                  placeholder="영문 주소지 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single" className="directions-card__row--kakao">
            <DetailInfoForm.Field
              label="카카오맵 HTML"
              view={null}
              edit={
                <CmsTextArea
                  className={fieldClass(
                    isEditing,
                    'directions-inline-field--kakao',
                    'cms-textarea--fixed-rows'
                  )}
                  inputSize="medium"
                  width="100%"
                  rows={12}
                  value={draft.kakaoMapHtml}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ kakaoMapHtml: e.target.value })
                  }}
                  placeholder="카카오맵에서 복사한 HTML 코드를 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm
          className="directions-card__contact"
          title="연락처"
          hideHeader
          mode="edit"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="전화번호"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.phone}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ phone: e.target.value })
                  }}
                  placeholder="전화번호 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="Fax 번호"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.fax}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ fax: e.target.value })
                  }}
                  placeholder="Fax 번호 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="이메일 주소"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.email}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    updateDraft({ email: e.target.value })
                  }}
                  placeholder="이메일 주소 입력"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

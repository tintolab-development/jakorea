import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'
import { useSaveJaKoreaBi } from '@/features/ja-korea-bi/api/hooks'
import { CmsButton, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './bi-form.css'

type Props = {
  data: JaKoreaBi
}

function PrelineView({ value }: { value: string }) {
  return <span className="ja-korea-bi-preline">{value || '-'}</span>
}

function cloneBi(data: JaKoreaBi): JaKoreaBi {
  return {
    title: data.title,
    mainText: data.mainText,
    subText: data.subText,
    updatedAt: data.updatedAt,
  }
}

export function BiFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaKoreaBi()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<JaKoreaBi>(() => cloneBi(data))

  const handleEdit = useCallback(() => {
    setDraft(cloneBi(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneBi(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'BI 소개 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateDraft = useCallback((patch: Partial<Pick<JaKoreaBi, 'title' | 'mainText' | 'subText'>>) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }, [])

  const mode = isEditing ? 'edit' : 'view'
  const current = isEditing ? draft : data

  return (
    <div className="admin-list-card ja-korea-bi-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">BI 소개 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
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
            <CmsButton variant="primary" size="medium" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="ja-korea-bi-card__body">
        <DetailInfoForm title="BI 소개" hideHeader mode={mode}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="타이틀"
              view={<PrelineView value={current.title} />}
              edit={
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="large"
                  width="100%"
                  rows={1}
                  value={draft.title}
                  onChange={e => updateDraft({ title: e.target.value })}
                  placeholder="타이틀 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="메인 텍스트"
              view={<PrelineView value={current.mainText} />}
              edit={
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="large"
                  width="100%"
                  rows={2}
                  value={draft.mainText}
                  onChange={e => updateDraft({ mainText: e.target.value })}
                  placeholder="메인 텍스트 입력"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="서브 텍스트"
              view={<PrelineView value={current.subText} />}
              edit={
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="large"
                  width="100%"
                  rows={3}
                  value={draft.subText}
                  onChange={e => updateDraft({ subText: e.target.value })}
                  placeholder="서브 텍스트 입력"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

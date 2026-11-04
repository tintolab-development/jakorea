import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryOrigin } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryOrigin } from '@/features/ja-history/api/hooks'
import { showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { InlineText, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'

export function OriginSection({ origin }: { origin: JaHistoryOrigin }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryOrigin()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(origin)

  useEffect(() => {
    if (!editing) setDraft(origin)
  }, [editing, origin])

  const patch = (partial: Partial<JaHistoryOrigin>) => {
    setDraft(prev => ({ ...prev, ...partial }))
  }

  const handleSave = () => {
    void saveMutation
      .mutateAsync({
        title: draft.title,
        body: draft.body,
        learningEyebrow: draft.learningEyebrow,
        learningTitle: draft.learningTitle,
        learningBody: draft.learningBody,
        learningOutro: draft.learningOutro,
        learningEmphasis: draft.learningEmphasis,
      })
      .then(
        () => {
          setEditing(false)
          showSaveCompletedAlert()
        },
        error => {
          showAlert(jaHistorySaveAlert(error, 'JA의 시작 저장에 실패했습니다. 다시 시도해 주세요.'))
        }
      )
  }

  return (
    <SectionFrame
      title="JA의 시작 - 1919년도"
      note="연도 및 이미지는 수정이 불가합니다."
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
    >
      <div className="ja-history-subsection">
        <h3 className="ja-history-subsection__title">소개 텍스트</h3>
        <div
          className="ja-history-header-table ja-history-header-table--split"
          role="group"
          aria-label="소개 텍스트"
        >
          <div className="ja-history-header-table__cell">
            <div className="ja-history-header-table__label">소개 타이틀</div>
            <div className="ja-history-header-table__value ja-history-header-table__value--center">
              <InlineText
                editing={editing}
                value={draft.title}
                onChange={title => patch({ title })}
                rows={2}
                label="소개 타이틀"
                placeholder="소개 타이틀을 입력해 주세요"
              />
            </div>
          </div>
          <div className="ja-history-header-table__cell">
            <div className="ja-history-header-table__label">소개 텍스트</div>
            <div className="ja-history-header-table__value">
              <InlineText
                editing={editing}
                value={draft.body}
                onChange={body => patch({ body })}
                rows={4}
                label="소개 텍스트"
                placeholder="소개 텍스트를 입력해 주세요"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="ja-history-subsection">
        <h3 className="ja-history-subsection__title">
          {draft.learningEyebrow || 'LEARNING BY DOING'}
        </h3>
        <DetailInfoForm
          title="LEARNING BY DOING"
          hideHeader
          mode="edit"
          className="ja-history-form"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="상단 타이틀"
              view={null}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningTitle}
                  onChange={learningTitle => patch({ learningTitle })}
                  rows={1}
                  label="상단 타이틀"
                  placeholder="상단 타이틀을 입력해 주세요"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="상단 텍스트"
              view={null}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningBody}
                  onChange={learningBody => patch({ learningBody })}
                  rows={3}
                  label="상단 텍스트"
                  placeholder="상단 텍스트를 입력해 주세요"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="이미지"
              view={null}
              edit={<MediaPreview media={origin.learningImage} size="banner" />}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="하단 메인 텍스트"
              view={null}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningOutro}
                  onChange={learningOutro => patch({ learningOutro })}
                  rows={3}
                  label="하단 메인 텍스트"
                  placeholder="하단 메인 텍스트를 입력해 주세요"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="하단 서브 텍스트"
              view={null}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningEmphasis}
                  onChange={learningEmphasis => patch({ learningEmphasis })}
                  rows={2}
                  label="하단 서브 텍스트"
                  placeholder="하단 서브 텍스트를 입력해 주세요"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </SectionFrame>
  )
}

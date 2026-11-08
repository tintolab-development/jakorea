import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryOrigin } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryOrigin } from '@/features/ja-history/api/hooks'
import { showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { TABLE_ROW_FILL_FIELDS_CLASS } from '@/shared/ui/table-row-fill-fields'
import { HistoryCopy, InlineText, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'

type IntroRow = { key: 'intro' }

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

  const introColumns = useMemo<ColumnsType<IntroRow>>(
    () => [
      {
        title: '소개 타이틀',
        key: 'title',
        align: 'center',
        ellipsis: false,
        render: () =>
          editing ? (
            <InlineText
              editing
              value={draft.title}
              onChange={title => patch({ title })}
              rows={2}
              label="소개 타이틀"
              placeholder="소개 타이틀을 입력해 주세요"
            />
          ) : (
            <HistoryCopy value={origin.title} align="center" />
          ),
      },
      {
        title: '소개 텍스트',
        key: 'body',
        align: 'center',
        ellipsis: false,
        render: () =>
          editing ? (
            <InlineText
              editing
              value={draft.body}
              onChange={body => patch({ body })}
              rows={4}
              label="소개 텍스트"
              placeholder="소개 텍스트를 입력해 주세요"
            />
          ) : (
            <HistoryCopy value={origin.body} align="center" />
          ),
      },
    ],
    [draft.body, draft.title, editing, origin.body, origin.title]
  )

  const mode = editing ? 'edit' : 'view'
  const learningTitle = draft.learningEyebrow || 'LEARNING BY DOING'

  return (
    <SectionFrame
      title="JA의 시작 - 1919년도"
      marker={false}
      note="연도 및 이미지는 수정이 불가합니다."
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
    >
      <div className="ja-history-subsection">
        <h3 className="ja-history-subsection__title">■ 소개 텍스트</h3>
        <CmsDataTable<IntroRow>
          className={`cms-data-table cms-data-table--skip-auto-no-col ja-history-table ${TABLE_ROW_FILL_FIELDS_CLASS}`}
          columns={introColumns}
          dataSource={[{ key: 'intro' }]}
          pagination={false}
          rowKey="key"
        />
      </div>
      <div className="ja-history-subsection">
        <h3 className="ja-history-subsection__title">■ {learningTitle}</h3>
        <DetailInfoForm title={learningTitle} hideHeader mode={mode} className="ja-history-form">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="상단 타이틀"
              view={<HistoryCopy value={origin.learningTitle} />}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningTitle}
                  onChange={next => patch({ learningTitle: next })}
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
              view={<HistoryCopy value={origin.learningBody} />}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningBody}
                  onChange={next => patch({ learningBody: next })}
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
              view={<MediaPreview media={origin.learningImage} size="origin" />}
              edit={<MediaPreview media={origin.learningImage} size="origin" />}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="하단 메인 텍스트"
              view={<HistoryCopy value={origin.learningOutro} />}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningOutro}
                  onChange={next => patch({ learningOutro: next })}
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
              view={<HistoryCopy value={origin.learningEmphasis} />}
              edit={
                <InlineText
                  editing={editing}
                  value={draft.learningEmphasis}
                  onChange={next => patch({ learningEmphasis: next })}
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

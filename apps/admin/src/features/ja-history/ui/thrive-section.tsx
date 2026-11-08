import { useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryThrive, JaHistoryThriveCard } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryThrive } from '@/features/ja-history/api/hooks'
import { showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { HistoryCopy, InlineText, SectionFrame, jaHistorySaveAlert } from './chrome'
import { TABLE_ROW_FILL_FIELDS_CLASS } from '@/shared/ui/table-row-fill-fields'

export function ThriveSection({ thrive }: { thrive: JaHistoryThrive }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryThrive()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(thrive)

  useEffect(() => {
    if (!editing) setDraft(thrive)
  }, [editing, thrive])

  const columns = useMemo<ColumnsType<JaHistoryThriveCard>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 100,
        align: 'center',
        render: (_value, _record, index) => String(index + 1),
      },
      {
        title: '제목',
        key: 'title',
        width: 400,
        align: 'center',
        className: 'ja-history-col-text',
        render: (_value, record) => {
          const card = draft.cards.find(item => item.id === record.id) ?? record
          if (!editing) {
            return <HistoryCopy value={record.title} align="center" />
          }
          return (
            <InlineText
              editing
              value={card.title}
              rows={1}
              label={`${record.id} 제목`}
              placeholder="제목을 입력해 주세요"
              onChange={title => {
                setDraft(prev => ({
                  ...prev,
                  cards: prev.cards.map(item =>
                    item.id === record.id ? { ...item, title } : item
                  ),
                }))
              }}
            />
          )
        },
      },
      {
        title: '설명',
        key: 'description',
        align: 'center',
        className: 'ja-history-col-text',
        render: (_value, record) => {
          const card = draft.cards.find(item => item.id === record.id) ?? record
          if (!editing) {
            return <HistoryCopy value={record.description} align="center" />
          }
          return (
            <InlineText
              editing
              value={card.description}
              rows={3}
              label={`${record.id} 설명`}
              placeholder="설명을 입력해 주세요"
              onChange={description => {
                setDraft(prev => ({
                  ...prev,
                  cards: prev.cards.map(item =>
                    item.id === record.id ? { ...item, description } : item
                  ),
                }))
              }}
            />
          )
        },
      },
    ],
    [draft.cards, editing]
  )

  const cardsTable = (
    <div className="ja-history-thrive-cards">
      <CmsDataTable<JaHistoryThriveCard>
        className={`cms-data-table cms-data-table--skip-auto-no-col ja-history-table ${TABLE_ROW_FILL_FIELDS_CLASS}`}
        columns={columns}
        dataSource={thrive.cards}
        pagination={false}
        rowKey="id"
      />
    </div>
  )

  return (
    <SectionFrame
      title="글로벌 전략 Thrive"
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={() => {
        void saveMutation
          .mutateAsync({
            title: draft.title,
            lead: draft.lead,
            footnote: draft.footnote,
            cards: draft.cards.map(card => ({
              id: card.id,
              title: card.title,
              description: card.description,
            })),
          })
          .then(
            () => {
              setEditing(false)
              showSaveCompletedAlert()
            },
            error => {
              showAlert(
                jaHistorySaveAlert(
                  error,
                  '글로벌 전략 Thrive 저장에 실패했습니다. 다시 시도해 주세요.'
                )
              )
            }
          )
      }}
    >
      <DetailInfoForm
        title="글로벌 전략 Thrive"
        hideHeader
        mode={editing ? 'edit' : 'view'}
        className="ja-history-form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀"
            view={<HistoryCopy value={thrive.title} />}
            edit={
              <InlineText
                editing={editing}
                value={draft.title}
                onChange={title => setDraft(prev => ({ ...prev, title }))}
                rows={2}
                label="타이틀"
                placeholder="타이틀을 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            view={<HistoryCopy value={thrive.lead} />}
            edit={
              <InlineText
                editing={editing}
                value={draft.lead}
                onChange={lead => setDraft(prev => ({ ...prev, lead }))}
                rows={3}
                label="서브 텍스트"
                placeholder="서브 텍스트를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="카드 섹션" view={cardsTable} edit={cardsTable} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="하단 텍스트"
            view={<HistoryCopy value={thrive.footnote} />}
            edit={
              <InlineText
                editing={editing}
                value={draft.footnote}
                onChange={footnote => setDraft(prev => ({ ...prev, footnote }))}
                rows={3}
                label="하단 텍스트"
                placeholder="하단 텍스트를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </SectionFrame>
  )
}

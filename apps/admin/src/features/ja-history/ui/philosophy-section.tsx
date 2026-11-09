import { useMemo, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ColumnsType } from 'antd/es/table'
import type { JaHistoryPhilosophy, JaHistoryPhilosophyCard } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryPhilosophy } from '@/features/ja-history/api/hooks'
import { CmsButton, CmsDataTable, REQUIRED_FIELDS_INCOMPLETE_ALERT, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { InlineText, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'
import { PhilosophyCardFormModal, type PhilosophyCardFormValues } from './philosophy-card-form-modal'
import { TABLE_ROW_FILL_FIELDS_CLASS } from '@/shared/ui/table-row-fill-fields'

function cardOrderLabel(index: number): string {
  return String(index + 1).padStart(2, '0')
}

type PhilosophyCardRow = JaHistoryPhilosophyCard & { orderLabel: string; index: number }

function philosophySavePayload(
  philosophy: JaHistoryPhilosophy,
  cards: JaHistoryPhilosophyCard[],
  cardPatch?: { id: string; values: PhilosophyCardFormValues }
) {
  return {
    eyebrow: philosophy.eyebrow,
    title: philosophy.title,
    lead: philosophy.lead,
    cards: cards.map(card => {
      if (cardPatch && card.id === cardPatch.id) {
        return {
          id: card.id,
          title: cardPatch.values.title,
          description: cardPatch.values.description,
          imageFile: cardPatch.values.imageFile,
          imageAssetId: cardPatch.values.imageAssetId ?? card.image.assetId ?? null,
        }
      }
      return {
        id: card.id,
        title: card.title,
        description: card.description,
        imageAssetId: card.image.assetId ?? null,
      }
    }),
  }
}

export function PhilosophySection({ philosophy }: { philosophy: JaHistoryPhilosophy }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryPhilosophy()
  // 소개(타이틀·서브 텍스트)는 팝업이 아니라 섹션 안에서 바로 수정한다 (Figma 747:580 — 취소·저장은 섹션 타이틀 우측)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: philosophy.title, lead: philosophy.lead })
  const [editingCard, setEditingCard] = useState<{
    card: JaHistoryPhilosophyCard
    index: number
  } | null>(null)

  const cards = philosophy.cards

  const handleIntroSave = () => {
    if (!draft.title.trim() || !draft.lead.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    void saveMutation
      .mutateAsync(
        philosophySavePayload({ ...philosophy, title: draft.title, lead: draft.lead }, cards)
      )
      .then(
        () => {
          setEditing(false)
          showSaveCompletedAlert()
        },
        error => {
          showAlert(
            jaHistorySaveAlert(error, '믿음을 키우는 교육 저장에 실패했습니다. 다시 시도해 주세요.')
          )
        }
      )
  }
  const rows = useMemo<PhilosophyCardRow[]>(
    () =>
      cards.map((card, index) => ({
        ...card,
        index,
        orderLabel: cardOrderLabel(index),
      })),
    [cards]
  )

  const columns = useMemo<ColumnsType<PhilosophyCardRow>>(
    () => [
      {
        title: '카드 순서',
        dataIndex: 'orderLabel',
        width: 200,
        align: 'center',
      },
      {
        title: '이미지',
        dataIndex: 'image',
        width: 200,
        align: 'center',
        render: (_value, record) => <MediaPreview media={record.image} size="card" />,
      },
      {
        title: '타이틀',
        dataIndex: 'title',
        align: 'center',
        render: (value: string) => <p className="ja-history-philosophy-table__copy">{value || '-'}</p>,
      },
      {
        title: '텍스트',
        dataIndex: 'description',
        align: 'center',
        ellipsis: false,
        render: (value: string) => (
          <p className="ja-history-philosophy-table__copy">{value || '-'}</p>
        ),
      },
      {
        title: '관리',
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="h32"
            type="button"
            onClick={() => setEditingCard({ card: record, index: record.index })}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    []
  )

  return (
    <>
      <SectionFrame
        title="믿음을 키우는 교육"
        marker={false}
        editing={editing}
        saving={saveMutation.isPending && editingCard == null}
        onEdit={() => {
          // 수정 시작 시점의 저장값으로 초안을 다시 채운다 (취소 후 재진입·원격 갱신 반영)
          setDraft({ title: philosophy.title, lead: philosophy.lead })
          setEditing(true)
        }}
        onCancel={() => setEditing(false)}
        onSave={handleIntroSave}
      >
        <div className="ja-history-philosophy">
          <DetailInfoForm
            title="믿음을 키우는 교육"
            hideHeader
            mode={editing ? 'edit' : 'view'}
            className="ja-history-form ja-history-philosophy-intro"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="타이틀"
                required={editing}
                view={<p className="ja-history-philosophy-intro__text">{philosophy.title || '-'}</p>}
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
                required={editing}
                view={<p className="ja-history-philosophy-intro__text">{philosophy.lead || '-'}</p>}
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
          </DetailInfoForm>

          <CmsDataTable<PhilosophyCardRow>
            className={`cms-data-table cms-data-table--skip-auto-no-col ja-history-table ja-history-philosophy-table ${TABLE_ROW_FILL_FIELDS_CLASS}`}
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="id"
          />
        </div>
      </SectionFrame>
      {editingCard ? (
        <PhilosophyCardFormModal
          open
          orderLabel={cardOrderLabel(editingCard.index)}
          initial={editingCard.card}
          confirmLoading={saveMutation.isPending}
          onCancel={() => setEditingCard(null)}
          onSubmit={values => {
            void saveMutation
              .mutateAsync(
                philosophySavePayload(philosophy, cards, {
                  id: editingCard.card.id,
                  values,
                })
              )
              .then(
                () => {
                  setEditingCard(null)
                  showSaveCompletedAlert()
                },
                error => {
                  showAlert(
                    jaHistorySaveAlert(
                      error,
                      '믿음을 키우는 교육 저장에 실패했습니다. 다시 시도해 주세요.'
                    )
                  )
                }
              )
          }}
        />
      ) : null}
    </>
  )
}

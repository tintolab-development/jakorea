import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryPhilosophy } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryPhilosophy } from '@/features/ja-history/api/hooks'
import { useCmsAlert } from '@/shared/ui'
import { InlineText, SectionFrame, jaHistorySaveAlert } from './chrome'
import { PhilosophyCardNestedTable } from './philosophy-card-nested-table'

export function PhilosophySection({ philosophy }: { philosophy: JaHistoryPhilosophy }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryPhilosophy()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(philosophy)

  useEffect(() => {
    if (!editing) setDraft(philosophy)
  }, [editing, philosophy])

  const cards = editing ? draft.cards : philosophy.cards

  return (
    <SectionFrame
      title="믿음을 키우는 교육"
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={() => {
        void saveMutation
          .mutateAsync({
            eyebrow: draft.eyebrow,
            title: draft.title,
            lead: draft.lead,
            cards: draft.cards.map(card => ({
              id: card.id,
              title: card.title,
              description: card.description,
              ...(card.image.url.startsWith('data:')
                ? { imageUrl: card.image.url, imageFileName: card.image.fileName }
                : {}),
            })),
          })
          .then(
            () => setEditing(false),
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
    >
      <DetailInfoForm title="믿음을 키우는 교육" hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀"
            view={null}
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
            view={null}
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
        {cards.map((card, index) => {
          const label = `교육 카드 ${String(index + 1).padStart(2, '0')}`
          const nested = (
            <PhilosophyCardNestedTable
              card={card}
              editing={editing}
              ariaLabel={label}
              onChange={patch => {
                setDraft(prev => ({
                  ...prev,
                  cards: prev.cards.map(item =>
                    item.id === card.id ? { ...item, ...patch } : item
                  ),
                }))
              }}
            />
          )
          return (
            <DetailInfoForm.Row key={card.id} type="single">
              <DetailInfoForm.Field label={label} view={null} edit={nested} />
            </DetailInfoForm.Row>
          )
        })}
      </DetailInfoForm>
    </SectionFrame>
  )
}

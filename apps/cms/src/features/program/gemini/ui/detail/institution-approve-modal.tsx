import { useEffect, useMemo, useState } from 'react'
import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'
import { listGeminiApproveScheduleCards } from '../../api/visiting-training/preferred-lecture-schedule'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import '@/features/program/shared/ui/detail-modal/components/institution-approve-modal.css'

export type GeminiInstitutionApproveConfirmPayload = PermissionModalPayload

function resolveSubjectName(name: string): string {
  const trimmed = name.trim()
  return trimmed && trimmed !== '-' ? trimmed : '기관'
}

export function buildGeminiInstitutionApproveMessage(
  subjectName: string,
  selectionCount = 1,
  withScheduleAssignment = false
): string {
  const name = resolveSubjectName(subjectName)
  if (selectionCount > 1) {
    return `**[${name}] 외 ${selectionCount - 1}개**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`
  }
  if (withScheduleAssignment) {
    return `**[${name}]**의 프로그램 신청을 승인하시겠습니까?\n승인 시 선택한 일정으로 교육이 배정되며, 담당 교사에게 승인 알림이 발송됩니다.`
  }
  return `**[${name}]**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`
}

export function GeminiInstitutionApproveModal({
  open,
  subjectName,
  selectionCount = 1,
  preferredScheduleBlocks,
  confirmLoading,
  onCancel,
  onConfirm,
}: {
  open: boolean
  subjectName: string
  selectionCount?: number
  preferredScheduleBlocks?: PreferredScheduleBlock[] | null
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (payload: GeminiInstitutionApproveConfirmPayload) => void
}) {
  const isBulk = selectionCount > 1
  const cards = useMemo(
    () => (isBulk ? [] : listGeminiApproveScheduleCards(preferredScheduleBlocks)),
    [isBulk, preferredScheduleBlocks]
  )
  const [selectedRank, setSelectedRank] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedRank(cards.length === 1 ? (cards[0]?.rank ?? null) : null)
  }, [open, cards])

  const selectedCard = cards.find(card => card.rank === selectedRank) ?? null
  const showScheduleCards = cards.length > 0

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-approve-modal"
      title="프로그램 신청 승인 안내"
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.full}
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={payload => {
        onConfirm(payload)
      }}
      width={600}
    >
      <PermissionModalMessage
        text={buildGeminiInstitutionApproveMessage(
          subjectName,
          selectionCount,
          false
        )}
      />
      {showScheduleCards ? (
        <div className="institution-approve-modal__schedule-section">
          <div className="institution-approve-modal__schedule-cards">
            {cards.map(card => {
              const selected = card.rank === selectedRank
              return (
                <button
                  key={card.rank}
                  type="button"
                  className={[
                    'institution-approve-modal__schedule-card',
                    selected ? 'institution-approve-modal__schedule-card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => setSelectedRank(selected ? null : card.rank)}
                >
                  <span className="institution-approve-modal__schedule-card-title">{card.title}</span>
                  {card.detail ? (
                    <span className="institution-approve-modal__schedule-card-detail">
                      {card.detail}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="institution-approve-modal__assignment-hint">
            교육은 하나의 일정에만 배정할 수 있습니다.
          </p>
          <div className="institution-approve-modal__assigned">
            <DetailInfoForm title="" hideHeader mode="edit">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="배정된 일정"
                  edit={
                    selectedCard ? (
                      <div className="institution-approve-modal__assigned-list">
                        <div className="institution-approve-modal__assigned-item">
                          <span>{selectedCard.title}</span>
                          <ItemDeleteButton
                            className="item-delete-button"
                            aria-label={`${selectedCard.title} 배정 삭제`}
                            onClick={() => setSelectedRank(null)}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="institution-approve-modal__assigned-empty">
                        배정할 일정을 선택해 주세요.
                      </span>
                    )
                  }
                  view={null}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
        </div>
      ) : null}
    </PermissionModal>
  )
}

import dayjs from 'dayjs'
import { ConfirmModal } from '@/shared/ui'
import type { UjatRegistrationLocalSaveRecord } from '@/features/program/ujat/lib/ujat-registration-local-save'

function formatSavedAt(iso: string): string {
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : iso
}

function buildDraftNoticeContent(records: readonly UjatRegistrationLocalSaveRecord[]): string {
  const lines = records.slice(0, 5).map(record => {
    const name = record.program.title?.trim() || '제목 없음'
    return `· ${name} (${formatSavedAt(record.savedAt)} 저장)`
  })
  const overflow = records.length > 5 ? `\n· 외 ${records.length - 5}건` : ''
  return [
    `임시 저장된 프로그램 등록 이력이 ${records.length}건 있습니다.`,
    '목록에서 해당 프로그램을 선택해 이어서 작성할 수 있습니다.',
    '',
    ...lines,
    overflow,
    '',
    '신규 등록을 진행하시겠습니까?',
  ]
    .filter(Boolean)
    .join('\n')
}

export function UjatRegistrationDraftNoticeModal({
  open,
  records,
  onConfirm,
  onCancel,
}: {
  open: boolean
  records: readonly UjatRegistrationLocalSaveRecord[]
  onConfirm: () => void
  onCancel: () => void
}) {
  if (records.length === 0) return null

  return (
    <ConfirmModal
      open={open}
      title="임시저장 이력 안내"
      content={buildDraftNoticeContent(records)}
      confirmText="신규 등록"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
      width={560}
    />
  )
}

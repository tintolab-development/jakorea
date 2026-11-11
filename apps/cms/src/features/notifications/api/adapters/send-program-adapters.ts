import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import type { MailSendProgram } from '@/features/notifications/model/mail-send/types'

function resolveProgramYear(dto: AdminProgramListItemDto): number {
  if (typeof dto.businessYear === 'number' && dto.businessYear > 0) return dto.businessYear
  const raw = dto.businessStartDate ?? dto.startDate
  if (!raw) return 0
  const year = Number(String(raw).slice(0, 4))
  return Number.isFinite(year) && year >= 2000 && year <= 2100 ? year : 0
}

/**
 * BE `NotificationSendBatchAccessService.isTerminalProgram`과 같은 종료 상태.
 * 이 상태의 프로그램은 수신자 후보 조회·발송이 409 `NOTIFICATION_PROGRAM_NOT_ACTIVE`로 막힌다.
 */
const NOTIFICATION_SEND_TERMINAL_PERIOD_STATUSES = new Set([
  'COMPLETED',
  'PERIOD_ENDED',
  'CANCELLED',
  'CANCELED',
  'CLOSED',
])

/**
 * 발송 대상으로 고를 수 있는 프로그램인지 (BE 판정과 동일, 2026-11-11).
 * - 게시(`PUBLISHED`)가 아니면 제외. 목록 API가 `draftStatus`를 주지 않으면(현재) 게시로 본다.
 * - 기간 상태가 종료·취소면 제외.
 */
export function isNotificationSendableProgram(dto: AdminProgramListItemDto): boolean {
  const draftStatus = dto.draftStatus?.trim().toUpperCase()
  if (draftStatus && draftStatus !== 'PUBLISHED') return false
  const periodStatus = dto.periodStatus?.trim().toUpperCase()
  if (periodStatus && NOTIFICATION_SEND_TERMINAL_PERIOD_STATUSES.has(periodStatus)) return false
  return true
}

export function mapAdminProgramListItemToSendProgram(
  dto: AdminProgramListItemDto
): MailSendProgram | null {
  if (dto.id == null || dto.id === '') return null
  const numericId = Number(dto.id)
  if (!Number.isFinite(numericId)) return null

  const name = dto.nameKo?.trim() || dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'

  return {
    id: String(numericId),
    name,
    year: resolveProgramYear(dto),
  }
}

export function mapAdminProgramListItemsToSendPrograms(
  items: AdminProgramListItemDto[] | undefined
): MailSendProgram[] {
  const seen = new Set<string>()
  const programs: MailSendProgram[] = []
  for (const item of items ?? []) {
    if (!isNotificationSendableProgram(item)) continue
    const program = mapAdminProgramListItemToSendProgram(item)
    if (program == null || seen.has(program.id)) continue
    seen.add(program.id)
    programs.push(program)
  }
  return programs.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, 'ko'))
}

import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import type { MailSendProgram } from '@/features/notifications/model/mail-send/types'

function resolveProgramYear(dto: AdminProgramListItemDto): number {
  if (typeof dto.businessYear === 'number' && dto.businessYear > 0) return dto.businessYear
  const raw = dto.businessStartDate ?? dto.startDate
  if (!raw) return 0
  const year = Number(String(raw).slice(0, 4))
  return Number.isFinite(year) && year >= 2000 && year <= 2100 ? year : 0
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
    const program = mapAdminProgramListItemToSendProgram(item)
    if (program == null || seen.has(program.id)) continue
    seen.add(program.id)
    programs.push(program)
  }
  return programs.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, 'ko'))
}

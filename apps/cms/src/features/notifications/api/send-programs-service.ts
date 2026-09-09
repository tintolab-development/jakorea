import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import {
  fetchAdminProgramsRemote,
  type AdminProgramListItemDto,
} from '@/features/program/general/api/programs-api-client'
import type { MailSendProgram } from '@/features/notifications/model/mail-send/types'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { mapAdminProgramListItemsToSendPrograms } from './adapters/send-program-adapters'

const PAGE_SIZE = 500
const MAX_PAGES = 20
const SEND_PROGRAM_API_TYPES = [
  'GENERAL',
  'UJAT',
  'COMPANY_SCHOOL',
  'TRAINED_TEACHER',
  'GEMINI_TRAINING',
] as const

export function shouldUseNotificationSendProgramsRemote(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

async function fetchProgramListPages(programType: string): Promise<AdminProgramListItemDto[]> {
  const items: AdminProgramListItemDto[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const dto = await fetchAdminProgramsRemote({ programType, page, size: PAGE_SIZE })
    items.push(...(dto.items ?? []))
    const totalPages = dto.totalPages ?? 1
    if (page + 1 >= totalPages) break
  }
  return items
}

/** 발송 대상 프로그램 피커 — remote면 BE 프로그램 id를 그대로 쓴다. mock id(101…)는 template-variables가 PROGRAM_NOT_FOUND. */
export async function getNotificationSendPrograms(): Promise<MailSendProgram[]> {
  if (!shouldUseNotificationSendProgramsRemote()) {
    return []
  }

  const results = await Promise.allSettled(
    SEND_PROGRAM_API_TYPES.map(programType => fetchProgramListPages(programType))
  )
  const items = results.flatMap(result => (result.status === 'fulfilled' ? result.value : []))
  if (items.length === 0) {
    const firstError = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    if (firstError) throw firstError.reason
  }

  return mapAdminProgramListItemsToSendPrograms(items)
}

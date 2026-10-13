import type { ProgramApplicationType } from '../../applications/api/types'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

export type PortalProgramNoticeComposeInput = {
  applicationType: ProgramApplicationType
  applicationId: string
  title: string
  content: string
}

/**
 * Portal 프로그램 안내사항(게시글) 등록 — OpenAPI에 POST가 없어 BE 배포 전까지 throw.
 * 연동 시 `POST .../program-applications/{type}/{id}/notices` 등으로 교체.
 */
export async function createPortalProgramNotice(
  _input: PortalProgramNoticeComposeInput,
): Promise<void> {
  if (!isRemoteApiConfigured()) return
  throw new Error('PORTAL_PROGRAM_NOTICE_CREATE_NOT_AVAILABLE')
}

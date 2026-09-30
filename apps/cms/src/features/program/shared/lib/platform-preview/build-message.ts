import {
  PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE,
  type PlatformProgramPreviewAssets,
  type PlatformProgramPreviewMessage,
  type PortalProgramDetail,
} from '@jakorea/domain/portal/program-detail'

/** 유형별 빌더가 만든 Portal 상세 + 저장 전 자원 → Platform 미리보기 메시지 */
export function buildPlatformPreviewMessage(
  detail: PortalProgramDetail,
  assets?: PlatformProgramPreviewAssets
): PlatformProgramPreviewMessage {
  const attachments = assets?.attachments?.filter(file => file.name.trim())
  return {
    type: PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE,
    version: 1,
    detail,
    assets: {
      ...(assets?.thumbnailUrl ? { thumbnailUrl: assets.thumbnailUrl } : {}),
      ...(attachments ? { attachments } : {}),
    },
  }
}

export function toPreviewAttachments(
  names: readonly string[] | null | undefined
): PlatformProgramPreviewAssets['attachments'] {
  const files = (names ?? []).map(name => name.trim()).filter(Boolean)
  return files.map(name => ({ name }))
}

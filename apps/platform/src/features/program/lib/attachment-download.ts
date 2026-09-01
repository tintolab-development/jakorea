/**
 * @deprecated Prefer `downloadAttachment` from `@/shared/lib`.
 * 하위 호환용 re-export.
 */
export {
  downloadAttachment as downloadProgramAttachment,
  getAttachmentFileExtension,
  getEmptyAttachmentMimeType,
  needsEmptyAttachmentFallback,
} from '@/shared/lib/download-attachment'

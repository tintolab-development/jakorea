import type { Editor } from '@tiptap/react'
import FileHandler from '@tiptap/extension-file-handler'
import {
  insertImageFromFile,
  RICH_TEXT_IMAGE_ACCEPT,
  type ResolvedRichTextImageSrc,
} from './insert-actions'
import { isAllowedDroppedImageMime, shouldInsertDroppedImageFiles } from './dropped-image-files'

export { shouldInsertDroppedImageFiles }

const ALLOWED_MIME_TYPES = RICH_TEXT_IMAGE_ACCEPT.split(',').map(type => type.trim())

function handleImageFiles(
  editor: Editor,
  files: File[],
  resolveSrc?: (file: File) => Promise<ResolvedRichTextImageSrc>,
): void {
  const imageFile = files.find(file => isAllowedDroppedImageMime(file.type))
  if (!imageFile) return
  insertImageFromFile(editor, imageFile, resolveSrc)
}

/** 드래그·붙여넣기 이미지 — insertImageFromFile 재사용 */
export function createRichTextFileHandler(
  getResolveSrc?: () => ((file: File) => Promise<ResolvedRichTextImageSrc>) | undefined,
  options?: { requireImageFilesOnDrop?: boolean },
) {
  return FileHandler.configure({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    onDrop: (currentEditor, files) => {
      if (options?.requireImageFilesOnDrop && !shouldInsertDroppedImageFiles(files)) return
      handleImageFiles(currentEditor, files, getResolveSrc?.())
    },
    onPaste: (currentEditor, files) => {
      handleImageFiles(currentEditor, files, getResolveSrc?.())
    },
  })
}

export const RichTextFileHandler = createRichTextFileHandler()

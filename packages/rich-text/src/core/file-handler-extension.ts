import type { Editor } from '@tiptap/react'
import FileHandler from '@tiptap/extension-file-handler'
import { insertImageFromFile, RICH_TEXT_IMAGE_ACCEPT } from './insert-actions'

const ALLOWED_MIME_TYPES = RICH_TEXT_IMAGE_ACCEPT.split(',').map(type => type.trim())

function handleImageFiles(
  editor: Editor,
  files: File[],
  resolveSrc?: (file: File) => Promise<string>,
): void {
  const imageFile = files.find(file => ALLOWED_MIME_TYPES.includes(file.type))
  if (!imageFile) return
  insertImageFromFile(editor, imageFile, resolveSrc)
}

/** 드래그·붙여넣기 이미지 — insertImageFromFile 재사용 */
export function createRichTextFileHandler(
  getResolveSrc?: () => ((file: File) => Promise<string>) | undefined,
) {
  return FileHandler.configure({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    onDrop: (currentEditor, files) => {
      handleImageFiles(currentEditor, files, getResolveSrc?.())
    },
    onPaste: (currentEditor, files) => {
      handleImageFiles(currentEditor, files, getResolveSrc?.())
    },
  })
}

export const RichTextFileHandler = createRichTextFileHandler()

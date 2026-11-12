import fileAiUrl from './icons/file-ai.svg'
import fileDefaultUrl from './icons/file-default.svg'
import fileExcelUrl from './icons/file-excel.svg'
import fileHwpUrl from './icons/file-hwp.svg'
import fileJpgUrl from './icons/file-jpg.svg'
import filePdfUrl from './icons/file-pdf.svg'
import filePngUrl from './icons/file-png.svg'
import filePptUrl from './icons/file-ppt.svg'
import fileWordUrl from './icons/file-word.svg'

/** 시안 Icon / File(24) — 확장자별 아이콘, 시안에 없는 확장자는 기본(클립) 아이콘 */
const FILE_TYPE_ICON_BY_EXTENSION: Record<string, string> = {
  jpg: fileJpgUrl,
  jpeg: fileJpgUrl,
  png: filePngUrl,
  pdf: filePdfUrl,
  doc: fileWordUrl,
  docx: fileWordUrl,
  xls: fileExcelUrl,
  xlsx: fileExcelUrl,
  csv: fileExcelUrl,
  ppt: filePptUrl,
  pptx: filePptUrl,
  hwp: fileHwpUrl,
  hwpx: fileHwpUrl,
  ai: fileAiUrl,
}

export function getFileTypeIconUrl(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex + 1).trim().toLowerCase() : ''
  return FILE_TYPE_ICON_BY_EXTENSION[extension] ?? fileDefaultUrl
}

/** 파일 확장자별 아이콘 (20×20). 매핑 없는 확장자는 클립 아이콘 */

import type { ImgHTMLAttributes } from 'react'
import aiUrl from '@/shared/assets/icons/file-types/file-icon-ai.svg'
import clipUrl from '@/shared/assets/icons/file-types/file-icon-clip.svg'
import excelUrl from '@/shared/assets/icons/file-types/file-icon-excel.svg'
import hwpUrl from '@/shared/assets/icons/file-types/file-icon-hwp.svg'
import jpgUrl from '@/shared/assets/icons/file-types/file-icon-jpg.svg'
import netUrl from '@/shared/assets/icons/file-types/file-icon-net.svg'
import pdfUrl from '@/shared/assets/icons/file-types/file-icon-pdf.svg'
import pngUrl from '@/shared/assets/icons/file-types/file-icon-png.svg'
import pptUrl from '@/shared/assets/icons/file-types/file-icon-ppt.svg'
import wordUrl from '@/shared/assets/icons/file-types/file-icon-word.svg'

export type FileTypeIconType =
  | 'ai'
  | 'clip'
  | 'excel'
  | 'hwp'
  | 'jpg'
  | 'net'
  | 'pdf'
  | 'png'
  | 'ppt'
  | 'word'

const FILE_TYPE_ICON_URL: Record<FileTypeIconType, string> = {
  ai: aiUrl,
  clip: clipUrl,
  excel: excelUrl,
  hwp: hwpUrl,
  jpg: jpgUrl,
  net: netUrl,
  pdf: pdfUrl,
  png: pngUrl,
  ppt: pptUrl,
  word: wordUrl,
}

const EXTENSION_TO_TYPE: Record<string, FileTypeIconType> = {
  ai: 'ai',
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  ppt: 'ppt',
  pptx: 'ppt',
  hwp: 'hwp',
  hwpx: 'hwp',
  htm: 'net',
  html: 'net',
  url: 'net',
}

export function resolveFileTypeIconType(fileName: string | null | undefined): FileTypeIconType {
  const trimmed = fileName?.trim() ?? ''
  if (/^https?:\/\//i.test(trimmed)) return 'net'
  const dot = trimmed.lastIndexOf('.')
  if (dot < 0) return 'clip'
  const ext = trimmed.slice(dot + 1).toLowerCase()
  return EXTENSION_TO_TYPE[ext] ?? 'clip'
}

export type FileTypeIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  /** 파일명 또는 URL — `type`이 없을 때 확장자로 아이콘 결정 */
  fileName?: string | null
  type?: FileTypeIconType
  size?: number
}

export function FileTypeIcon({ fileName, type, size = 20, style, ...props }: FileTypeIconProps) {
  const resolved = type ?? resolveFileTypeIconType(fileName)
  return (
    <img
      src={FILE_TYPE_ICON_URL[resolved]}
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      style={{
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
      {...props}
    />
  )
}

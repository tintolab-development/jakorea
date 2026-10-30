import type { ProgramAttachmentItem } from '@/features/program/shared/api/program-attachments'

/**
 * Gemini 모집 상세 첨부 — 파일명과 업로드 fileObjectId를 같은 index로 맞춘다.
 * attachmentFileObjectIds undefined: 이번 편집에서 첨부 변경 없음(PUT 생략).
 * null 칸: 파일명만 있는 기존 항목(GET attachments 파일명으로 매칭).
 */
export type GeminiAttachmentFields = {
  attachmentFileNames: string[]
  attachmentFileObjectIds?: Array<number | null>
}

function alignedIds(values: GeminiAttachmentFields): Array<number | null> {
  const ids = values.attachmentFileObjectIds ?? []
  return values.attachmentFileNames.map((_, i) => {
    const id = ids[i]
    return typeof id === 'number' && Number.isFinite(id) ? id : null
  })
}

export function appendGeminiAttachmentUploads(
  values: GeminiAttachmentFields,
  uploads: ReadonlyArray<{ fileName: string; fileObjectId: number }>
): Required<GeminiAttachmentFields> {
  return {
    attachmentFileNames: [...values.attachmentFileNames, ...uploads.map(u => u.fileName)],
    attachmentFileObjectIds: [...alignedIds(values), ...uploads.map(u => u.fileObjectId)],
  }
}

export function removeGeminiAttachmentAt(
  values: GeminiAttachmentFields,
  index: number
): Required<GeminiAttachmentFields> {
  return {
    attachmentFileNames: values.attachmentFileNames.filter((_, i) => i !== index),
    attachmentFileObjectIds: alignedIds(values).filter((_, i) => i !== index),
  }
}

/**
 * PUT /programs/{id}/attachments 요청 id. 전체 교체라 기존 연결분(파일명 매칭)도 포함한다.
 * null 반환: PUT 하지 않는다.
 */
export function resolveGeminiAttachmentFileObjectIdsForSave(
  values: GeminiAttachmentFields,
  existing: readonly ProgramAttachmentItem[] = []
): number[] | null {
  if (values.attachmentFileObjectIds === undefined) return null
  const unused = existing.filter(item => typeof item.fileObjectId === 'number')
  const out: number[] = []
  const ids = alignedIds(values)
  values.attachmentFileNames.forEach((name, i) => {
    let id = ids[i]
    if (id == null) {
      const matchIndex = unused.findIndex(item => (item.originalFileName ?? '') === name)
      if (matchIndex < 0) return
      id = unused[matchIndex]!.fileObjectId as number
      unused.splice(matchIndex, 1)
    }
    if (!out.includes(id)) out.push(id)
  })
  if (out.length === 0 && existing.length === 0) return null
  return out
}

/**
 * 공지·임팩트 스토리·채용공고 persist용.
 * 폼 첨부 순서를 유지해 READY asset id 배열을 만든다. 없으면 [].
 */

export async function resolveOrderedAttachmentAssetIds(
  attachments: ReadonlyArray<{ file?: File; assetId?: number }>,
  upload: (file: File) => Promise<number>,
): Promise<number[]> {
  const ids: number[] = []
  for (const att of attachments) {
    if (att.file instanceof File) {
      ids.push(await upload(att.file))
      continue
    }
    if (att.assetId != null && att.assetId > 0) {
      ids.push(att.assetId)
    }
  }
  return ids
}

/** 슬롯 카피와 무관. 공개 interviews[].linkedStoryId만 href가 된다. */
export function talentInterviewStoryHref(linkedStoryId: unknown): string | null {
  if (typeof linkedStoryId === 'number' && Number.isFinite(linkedStoryId) && linkedStoryId > 0) {
    return `/impact/${String(linkedStoryId)}`
  }
  if (typeof linkedStoryId === 'string') {
    const id = linkedStoryId.trim()
    if (!id) return null
    const numeric = Number(id)
    if (Number.isFinite(numeric) && numeric > 0) return `/impact/${String(numeric)}`
    return `/impact/${id}`
  }
  return null
}

/** 후원사 등록 셀렉트 — API 옵션 + 선택 id fallback 라벨 (테스트·UI 공유) */
export function mergeSponsorRegistrationSelectOptions(args: {
  sponsorIds: readonly string[]
  apiOptions: ReadonlyArray<{ value: string; label: string }>
  sponsors: ReadonlyArray<{ id: string | number; name?: string | null }>
}): Array<{ value: string; label: string }> {
  const byId = new Map(
    args.apiOptions.map(option => [String(option.value), { ...option, value: String(option.value) }])
  )
  for (const id of args.sponsorIds) {
    const key = String(id)
    if (byId.has(key)) continue
    const row = args.sponsors.find(sponsor => String(sponsor.id) === key)
    byId.set(key, { value: key, label: row?.name?.trim() || key })
  }
  return [...byId.values()]
}

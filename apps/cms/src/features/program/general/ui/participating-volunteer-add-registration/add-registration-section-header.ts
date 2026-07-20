function resolveSeedParagraphDescription(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '설명 입력') return undefined
  return trimmed
}

export function resolveParticipatingVolunteerSeedSectionDescription(
  paragraphDescription: string | undefined
): string | undefined {
  return resolveSeedParagraphDescription(paragraphDescription)
}

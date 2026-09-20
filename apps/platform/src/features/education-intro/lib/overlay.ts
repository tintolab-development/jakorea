import type { PublicProgramIntroImage, PublicProgramIntroResponse, PublicProgramIntroSection } from '../api/types'

type OverlayImage = {
  src: string
  alt: string
  width: number
  height: number
}

type OverlaySection = {
  id: string
  title: string
  description: string
  images: OverlayImage[]
  programName?: string
  partnerName?: string
  programDescription?: string
}

export function heroTitleLinesFromIntro(
  heroText: string | undefined,
  fallback: readonly string[],
): string[] {
  const lines = (heroText ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : [...fallback]
}

function overlayImages<T extends OverlayImage>(
  fallback: readonly T[],
  remote: PublicProgramIntroImage[] | undefined,
): T[] {
  const sorted = [...(remote ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  return fallback.map((image, index) => {
    const row = sorted[index]
    const src = row?.publicUrl?.trim()
    if (!src) return { ...image }
    return {
      ...image,
      src,
      alt: row.alt?.trim() || image.alt,
      width: row.width ?? image.width,
      height: row.height ?? image.height,
    }
  })
}

function overlaySection<T extends OverlaySection>(
  fallback: T,
  remote: PublicProgramIntroSection,
): T {
  return {
    ...fallback,
    title: remote.programType?.trim() || fallback.title,
    description: remote.typeDescription ?? fallback.description,
    images: overlayImages(fallback.images, remote.images),
    programName: remote.representativeProgram ?? fallback.programName,
    partnerName: remote.sponsorName ?? fallback.partnerName,
    programDescription: remote.representativeDescription ?? fallback.programDescription,
  }
}

export function overlayProgramIntroSections<T extends OverlaySection>(
  fallback: readonly T[],
  remote: PublicProgramIntroResponse | undefined,
): T[] {
  const sections = [...(remote?.sections ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
  if (sections.length === 0) return fallback.map(item => ({ ...item, images: [...item.images] }))

  const mapped: T[] = []
  for (const section of sections) {
    const key = section.sectionKey?.trim()
    const match = key ? fallback.find(item => item.id === key) : undefined
    if (!match) continue
    mapped.push(overlaySection(match, section))
  }
  return mapped.length > 0
    ? mapped
    : fallback.map(item => ({ ...item, images: [...item.images] }))
}

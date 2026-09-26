import type {
  PublicProgramIntroImage,
  PublicProgramIntroResponse,
  PublicProgramIntroSection,
} from '../api/types'

type LayoutImage = {
  src: string
  alt: string
  width: number
  height: number
}

type LayoutSection = {
  id: string
  title: string
  description: string
  images: LayoutImage[]
  programName?: string
  partnerName?: string
  programDescription?: string
}

export function heroTitleLinesFromIntro(heroText: string | undefined): string[] {
  return (heroText ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function mapImages<T extends LayoutImage>(
  layout: readonly T[],
  remote: PublicProgramIntroImage[] | undefined,
): T[] {
  const sorted = [...(remote ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const mapped: T[] = []
  sorted.forEach((row, index) => {
    const src = row.publicUrl?.trim()
    const slot = layout[index] ?? layout[layout.length - 1]
    if (!src || !slot) return
    mapped.push({
      ...slot,
      src,
      alt: row.alt?.trim() || '',
      width: row.width && row.width > 0 ? row.width : slot.width,
      height: row.height && row.height > 0 ? row.height : slot.height,
    })
  })
  return mapped
}

function mapSection<T extends LayoutSection>(
  layout: T,
  remote: PublicProgramIntroSection,
): T {
  const programName = remote.representativeProgram?.trim() ?? ''
  const partnerName = remote.sponsorName?.trim() ?? ''
  const programDescription = remote.representativeDescription?.trim() ?? ''
  return {
    ...layout,
    id: (remote.sectionKey?.trim() || layout.id) as T['id'],
    title: remote.programType?.trim() || '',
    description: remote.typeDescription?.trim() || '',
    images: mapImages(layout.images, remote.images),
    programName,
    partnerName,
    programDescription,
  }
}

export function mapProgramIntroSections<T extends LayoutSection>(
  layoutTemplates: readonly T[],
  remote: PublicProgramIntroResponse | undefined,
): T[] {
  const sections = [...(remote?.sections ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
  const mapped: T[] = []
  sections.forEach((section, index) => {
    const key = section.sectionKey?.trim()
    const layout =
      (key ? layoutTemplates.find(item => item.id === key) : undefined) ??
      layoutTemplates[Math.min(index, Math.max(layoutTemplates.length - 1, 0))]
    if (!layout) return
    mapped.push(mapSection(layout, section))
  })
  return mapped
}

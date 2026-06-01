import type { ReactNode } from 'react'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'

export type UjatVolunteerAddRegistrationSectionHeaderProps = {
  title: string
  required?: boolean
  description?: ReactNode
}

export function UjatVolunteerAddRegistrationSectionHeader({
  title,
  required = false,
  description,
}: UjatVolunteerAddRegistrationSectionHeaderProps) {
  const descriptionText = typeof description === 'string' ? description : undefined

  return (
    <FormParagraphSectionHeader
      title={title}
      description={descriptionText}
      required={required}
      headingLevel="h3"
      surface="responseEntry"
      titleAligned
      headerClassName="ujat-volunteer-add-registration__section-header"
      titleClassName="info-section-title"
    />
  )
}

function resolveSeedParagraphDescription(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '설명 입력') return undefined
  return trimmed
}

export function resolveUjatVolunteerSeedSectionDescription(
  paragraphDescription: string | undefined
): string | undefined {
  return resolveSeedParagraphDescription(paragraphDescription)
}

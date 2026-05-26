import type { ReactNode } from 'react'
import { FormParagraphSectionDescription } from '@/features/template/ui/shared/form-paragraph-section-description'

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
  return (
    <header className="ujat-volunteer-add-registration__section-header">
      <h3 className="info-section-title">
        {title}
        {required ? (
          <span className="detail-info-form__field-required" aria-hidden>
            *
          </span>
        ) : null}
      </h3>
      {description ? (
        <FormParagraphSectionDescription surface="responseEntry" titleAligned>
          {description}
        </FormParagraphSectionDescription>
      ) : null}
    </header>
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

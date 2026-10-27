import {
  ensureCareersMailTemplateLayoutMarker,
  resolveCareersMailTemplateBodyHtml,
} from './careers-layout'
import {
  ensureConsultationMailTemplateLayoutMarker,
  resolveConsultationMailTemplateBodyHtml,
} from './consultation-layout'
import {
  ensureTalentDonationMailTemplateLayoutMarker,
  resolveTalentDonationMailTemplateBodyHtml,
} from './talent-donation-layout'

export function resolveMailTemplateBodyHtml(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return resolveConsultationMailTemplateBodyHtml(
    templateId,
    resolveCareersMailTemplateBodyHtml(
      templateId,
      resolveTalentDonationMailTemplateBodyHtml(templateId, bodyHtml)
    )
  )
}

export function ensureMailTemplateLayoutMarker(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return ensureConsultationMailTemplateLayoutMarker(
    templateId,
    ensureCareersMailTemplateLayoutMarker(
      templateId,
      ensureTalentDonationMailTemplateLayoutMarker(templateId, bodyHtml)
    )
  )
}

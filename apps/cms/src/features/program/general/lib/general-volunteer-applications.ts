import type { GeneralDetailLnbKey } from '@/features/program/general/lib/detail-url'

export const GENERAL_VOLUNTEER_APPLICATION_TABS = [
  'vol_all',
  'vol_doc1',
  'vol_doc_passed',
  'vol_interview2',
] as const

export type GeneralVolunteerApplicationTab = (typeof GENERAL_VOLUNTEER_APPLICATION_TABS)[number]

/** @see GENERAL_VOLUNTEER_APPLICATION_QA in `@/data/mock/general-programs` */
export { GENERAL_VOLUNTEER_APPLICATION_QA } from '@/data/mock/general-programs'

export function isGeneralVolunteerApplicantDetailRoute(
  lnb: GeneralDetailLnbKey,
  tab: string
): boolean {
  return (
    lnb === 'volunteer_applications' &&
    (GENERAL_VOLUNTEER_APPLICATION_TABS as readonly string[]).includes(tab)
  )
}

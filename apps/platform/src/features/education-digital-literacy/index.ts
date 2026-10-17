export type {
  DigitalLiteracyProgramGalleryVariant,
  DigitalLiteracyProgramId,
  DigitalLiteracyProgramImage,
  DigitalLiteracyProgramSection,
} from './model/types'
export {
  DEFAULT_EDUCATION_DIGITAL_LITERACY_TAB,
  EDUCATION_DIGITAL_LITERACY_HERO,
  EDUCATION_DIGITAL_LITERACY_PATH,
  EDUCATION_DIGITAL_LITERACY_TAB_ITEMS,
} from './lib/constants'
export { isEducationDigitalLiteracyPath } from './lib/routes'
export {
  EDUCATION_DIGITAL_LITERACY_PROGRAMS,
  getEducationDigitalLiteracyPrograms,
} from './lib/page-content'
export { ProgramSection } from './ui/program-section'
export { ProgramGallery } from './ui/program-gallery'
export { PartnerBadge } from './ui/partner-badge'

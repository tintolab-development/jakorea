export type {
  EducationForm,
  EducationTargetKey,
  ProgramCategory,
  ProgramDetail,
  ProgramListItem,
  ProgramsListParams,
} from './model/types'
export {
  DEFAULT_PROGRAMS_LIST_PARAMS,
  OPERATING_PERIOD_FILTER_OPTIONS,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_FILTER_KEYS,
  PROGRAM_SORT_OPTIONS,
  PROGRAMS_PATH,
  programApplyCompletePath,
  programApplyPath,
  programApplyRequiredPath,
  programDetailPath,
} from './lib/constants'
export { getMockApplyFormDraft } from './lib/apply-form-drafts'
export {
  getMockProgramById,
  getMockPrograms,
  loadMockProgramById,
  loadMockPrograms,
  programOverlapsOperatingYear,
} from './lib/mock-programs'
export { mergeSeedAndCatalogPrograms } from './lib/merge-seed-catalog'
export { useMockProgramById, useMockProgramsCatalog } from './lib/use-mock-programs-catalog'
export {
  mapCmsProgramToPlatformDetail,
  mapCmsProgramToPlatformListItem,
  mapCmsProgramsToPlatformDetails,
  mapLifecycleToRecruitmentStatus,
  resolvePlatformCategory,
} from './lib/map-from-cms'
export {
  CMS_PLATFORM_PROGRAM_FIXTURES,
  ECONOMY_REGISTRATION_FIXTURE,
  ECONOMY_REGISTRATION_FIXTURES,
  GENERAL_REGISTRATION_FIXTURES,
  GEMINI_RECRUITMENT_FIXTURES,
  TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  getCmsRegistrationFixtureById,
  getCmsRegistrationFixturesByCase,
} from './lib/cms-registration-fixtures'
export type {
  CmsProgramLike,
  CmsRegistrationCaseKind,
} from './model/cms-program.types'
export {
  buildProgramsListPath,
  getProgramsListReturnPath,
  parseEducationTargetFilter,
  readProgramsListParams,
} from './lib/list-params'
export { filterAndSortPrograms } from './lib/filter-programs'
export {
  getProgramIdFromPath,
  isProgramsPath,
  parseProgramRoute,
  type ParsedProgramRoute,
  type ProgramRouteName,
} from './lib/routes'
export {
  EDUCATION_FORM_ICON_MAP,
  EDUCATION_FORM_LABEL_MAP,
  RECRUITMENT_STATUS_TONE_MAP,
  educationTargetBadgeIconUrl,
} from './lib/badge-config'
export { ProgramBackButton } from './ui/back-button'
export { ProgramListItemRow } from './ui/list-item'
export { ProgramSort } from './ui/program-sort'
export { ProgramStatusBadges } from './ui/program-status-badges'

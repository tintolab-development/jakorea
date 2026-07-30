export type {
  BackendDummyCategoryId,
  BackendDummyDomainId,
  IntegrationStatus,
  GateKey,
} from './types'
export {
  BACKEND_DUMMIES_AS_OF,
  BACKEND_DUMMIES_DOC_HINT,
  BACKEND_DUMMY_CATEGORIES,
  getBackendDummyCategory,
  getCategoriesByDomain,
  getAllCategoryIds,
} from './categories'
export {
  BACKEND_DUMMY_DOMAINS,
  DEFAULT_DOMAIN_TAB,
  getBackendDummyDomain,
  isBackendDummyDomainId,
  collectAllDomainGateKeys,
} from './domains'
export { SURFACE_ROWS, getSurfacesForCategory } from './surfaces'
export { SEED_CASES, getSeedCasesForCategory } from './seed-cases'
export { GAP_ROWS, getGapsForCategory } from './gaps'

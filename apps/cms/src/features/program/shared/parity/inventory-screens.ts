/**
 * CMS 프로그램 상세·depth parity 전수조사 — screenId SSOT.
 * matrix 테스트·인벤토리 문서·리포트가 이 목록을 기준으로 동작한다.
 */

export type ProgramDetailVariant =
  | 'general'
  | 'company_school'
  | 'trained_teachers'
  | 'ujat'
  | 'gemini_recruitment'
  | 'gemini_approved'
  | 'registration_general'
  | 'registration_ujat'

export type ParityRemotePolicy = 'remote' | 'mock' | 'mixed'

export type ParityScreenEntry = {
  screenId: string
  variant: ProgramDetailVariant
  routeHint: string
  readChain: string[]
  writeChain?: string[]
  remotePolicy: ParityRemotePolicy
  priority: 'P0' | 'P1' | 'P2'
  notes?: string
}

/** GET Program(adapter) SSOT strict parity 대상 */
export const PARITY_SCREEN_INVENTORY: readonly ParityScreenEntry[] = [
  {
    screenId: 'general.info.common',
    variant: 'general',
    routeHint: '/programs/general?lnb=info&tab=info',
    readChain: ['resolveGeneralProgramCommonInfo'],
    writeChain: ['programToGeneralCommonInfoEditValues', 'generalCommonInfoEditValuesToProgramPatch'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'general.info.recruitment.participant',
    variant: 'general',
    routeHint: '/programs/general?lnb=info&tab=recruitment (participant)',
    readChain: ['resolveGeneralProgramForRecruitmentEdit', 'resolveGeneralRecruitDetailDisplayProgram'],
    writeChain: ['detailEditValuesToProgramPatch', 'buildMergedRegistrationOverlayForRecruitSave'],
    remotePolicy: 'remote',
    priority: 'P0',
    notes: 'strict: preferOverlay false; live: resolveGeneralRecruitDisplayProgram',
  },
  {
    screenId: 'general.info.recruitment.instructor',
    variant: 'general',
    routeHint: '/programs/general?lnb=info&tab=recruitment (instructor)',
    readChain: ['resolveGeneralProgramForRecruitmentEdit', 'resolveGeneralRecruitDetailDisplayProgram'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'general.info.recruitment.volunteer',
    variant: 'general',
    routeHint: '/programs/general?lnb=info&tab=recruitment (volunteer)',
    readChain: ['resolveGeneralProgramForRecruitmentEdit', 'resolveGeneralRecruitDetailDisplayProgram'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'general.info.application',
    variant: 'general',
    routeHint: '/programs/general?lnb=info&tab=application',
    readChain: ['seedOperationalOverlayFromProgramCatalog'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'general.progress.school',
    variant: 'general',
    routeHint: 'lnb=progress&tab=progress_participants&schoolId&schoolTab',
    readChain: ['school-detail-fullpage-view'],
    remotePolicy: 'remote',
    priority: 'P1',
    notes: 'multi GET: program + progress APIs',
  },
  {
    screenId: 'general.progress.instructor',
    variant: 'general',
    routeHint: 'progress_instructors&instructorId&instructorTab',
    readChain: ['participating-instructor-fullpage-view'],
    remotePolicy: 'remote',
    priority: 'P1',
  },
  {
    screenId: 'general.progress.volunteer',
    variant: 'general',
    routeHint: 'progress_volunteers&volunteerId&volunteerTab',
    readChain: ['participating-volunteer-fullpage-view'],
    remotePolicy: 'remote',
    priority: 'P1',
  },
  {
    screenId: 'general.progress.participant',
    variant: 'general',
    routeHint: 'progress_participants&participantId',
    readChain: ['participating-participant-fullpage-view'],
    remotePolicy: 'remote',
    priority: 'P1',
  },
  {
    screenId: 'company_school.info.common',
    variant: 'company_school',
    routeHint: '/programs/company_school?programId (program-detail-fullpage-modal)',
    readChain: ['applyEconomyRegistrationOverlayToProgram', 'resolveGeneralProgramCommonInfo'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'trained_teachers.info.common',
    variant: 'trained_teachers',
    routeHint: '/programs/trained-teachers?programId',
    readChain: ['resolveGeneralProgramCommonInfo'],
    remotePolicy: 'remote',
    priority: 'P2',
  },
  {
    screenId: 'ujat.info.common',
    variant: 'ujat',
    routeHint: '/programs/ujat?lnb=info',
    readChain: ['ujat common info views'],
    remotePolicy: 'remote',
    priority: 'P0',
  },
  {
    screenId: 'registration.general.seed_to_detail',
    variant: 'registration_general',
    routeHint: 'registration-fullpage-modal → detail-fullpage-modal',
    readChain: ['seedGeneralRegistrationOverlayFromProgram'],
    remotePolicy: 'mixed',
    priority: 'P0',
  },
]

export function parityScreenById(screenId: string): ParityScreenEntry | undefined {
  return PARITY_SCREEN_INVENTORY.find(s => s.screenId === screenId)
}

export function parityScreensByPriority(priority: ParityScreenEntry['priority']): ParityScreenEntry[] {
  return PARITY_SCREEN_INVENTORY.filter(s => s.priority === priority)
}

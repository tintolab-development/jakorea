/**
 * 일반 프로그램 상세 — 공통 정보 수정 폼 (RHF + Zod)
 */

import { useEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Program } from '@/types/domain'
import { GENERAL_PROGRAM_WAGE_DEDUCTION_ITEMS_LABEL } from '@/features/program/general/lib/wage-info-constants'
import {
  generalProgramCommonInfoEditSchema,
  programToGeneralCommonInfoEditValues,
  resolveSponsorManagementIds,
  type GeneralProgramCommonInfoEditFormValues,
  type GeneralProgramSponsorEditContext,
} from '@/features/program/general/model/common-info-edit-schema'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useDetailedProgramOptionsQuery } from '@/features/detailed-program/hooks/use-detailed-program-options-query'

export interface UseGeneralProgramCommonInfoEditFormOptions {
  program: Program | null
  isEditMode: boolean
}

const EMPTY_INTERIM_SPONSORS: GeneralProgramSponsorEditContext['sponsors'] = []
const EMPTY_INTERIM_CONTACTS: GeneralProgramSponsorEditContext['contactsBySponsorId'] = {}
const EMPTY_DETAILED_PROGRAM_CATALOG: NonNullable<
  ReturnType<typeof useDetailedProgramOptionsQuery>['data']
> = []

const EMPTY_DEFAULTS: GeneralProgramCommonInfoEditFormValues = {
  mainTitle: '',
  titleEn: '',
  announcementTitle: '',
  detailedProgramId: '',
  startDate: '',
  endDate: '',
  participantIndividual: false,
  participantOrganization: false,
  participantTeacherInstructor: false,
  participantVolunteer: false,
  businessArea: '',
  sponsorManagementIds: [],
  sponsorManagerContactIds: [],
  sponsorManagerContactId: '',
  venueKind: 'inside',
  venueDetail: '',
  surveySurvey: false,
  surveySatisfaction: false,
  surveyLectureEvaluation: false,
  educationProcess: '',
  ipOwned: '',
  courseDeliveredBy: '',
  partnerInvolvement: 'no',
  kpiFinalParticipants: 0,
  kpiInstructorCount: 0,
  kpiVolunteerCount: 0,
  kpiFinalSchools: 0,
  kpiFinalClasses: 0,
  wageGrade1Amount: '',
  wageGrade2Amount: '',
  wageGrade3Amount: '',
  wagePaymentItemIds: [],
  wageDeductionItems: GENERAL_PROGRAM_WAGE_DEDUCTION_ITEMS_LABEL,
  educationStructure: 'curriculum',
  sessionRound: 'single',
  educationForm: 'online',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  ipsCategory: '',
  ipsDetail: '',
  participationMethod: 'individual',
  curriculumSessions: [],
  scheduleGroupCount: 1,
  scheduleDetails: [],
  scheduleCurriculumPreEducation: false,
  educationScheduleMode: 'date',
  educationScheduleLines: [],
}

export function useGeneralProgramCommonInfoEditForm({
  program,
  isEditMode,
}: UseGeneralProgramCommonInfoEditFormOptions): UseFormReturn<GeneralProgramCommonInfoEditFormValues> {
  const sponsorsQuery = useSponsorOptionsQuery(Boolean(program))
  const interimSponsorContext = useMemo(
    (): GeneralProgramSponsorEditContext => ({
      sponsors: sponsorsQuery.data ?? EMPTY_INTERIM_SPONSORS,
      contactsBySponsorId: EMPTY_INTERIM_CONTACTS,
    }),
    [sponsorsQuery.data]
  )
  const initialSponsorIds = useMemo(
    () => (program ? resolveSponsorManagementIds(program, interimSponsorContext) : []),
    [interimSponsorContext, program]
  )
  const sponsorContext = useGeneralProgramSponsorEditContext(initialSponsorIds, true, {
    sponsorRows: sponsorsQuery.data ?? EMPTY_INTERIM_SPONSORS,
  })
  // 세부 프로그램 옵션은 수정 모드에서만 필요하다. 수정 진입 시 handleInfoEdit이 먼저 받아 둔다.
  const detailedProgramsQuery = useDetailedProgramOptionsQuery(Boolean(program) && isEditMode)
  const detailedProgramCatalog = useMemo(
    () => detailedProgramsQuery.data ?? EMPTY_DETAILED_PROGRAM_CATALOG,
    [detailedProgramsQuery.data]
  )

  const programSyncKey = useMemo(() => {
    if (!program) return ''
    return `${program.id}:${program.updatedAt ?? ''}`
  }, [program])

  const sponsorContextSyncKey = useMemo(() => {
    const sponsorIds = sponsorContext.sponsors.map(row => row.id).join(',')
    const contactIds = Object.entries(sponsorContext.contactsBySponsorId)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sponsorId, contacts]) =>
        `${sponsorId}=${(contacts ?? []).map(c => c.id).join('.')}`
      )
      .join(';')
    return `${sponsorIds}|${contactIds}`
  }, [sponsorContext])

  const detailedCatalogSyncKey = useMemo(
    () => detailedProgramCatalog.map(row => row.id).join(','),
    [detailedProgramCatalog]
  )

  const defaultValues = useMemo(() => {
    if (program) {
      return programToGeneralCommonInfoEditValues(
        program,
        sponsorContext,
        detailedProgramCatalog.length > 0 ? detailedProgramCatalog : undefined
      )
    }
    return EMPTY_DEFAULTS
  }, [program, sponsorContext, detailedProgramCatalog])

  const form = useForm<GeneralProgramCommonInfoEditFormValues>({
    resolver: zodResolver(generalProgramCommonInfoEditSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  useEffect(() => {
    if (!program) return
    // 편집 중 catalog/sponsor 도착이나 program 동기화로 화면 입력을 덮지 않는다.
    // 편집 진입 reset은 상세 모달 handleInfoEdit → resetToProgram 이 담당한다.
    if (isEditMode) return
    reset(
      programToGeneralCommonInfoEditValues(
        program,
        sponsorContext,
        detailedProgramCatalog.length > 0 ? detailedProgramCatalog : undefined
      ),
      { keepDefaultValues: false }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when sync keys change; avoid unstable object refs
  }, [programSyncKey, isEditMode, reset, sponsorContextSyncKey, detailedCatalogSyncKey])

  return form
}

/**
 * 일반 프로그램 상세 — 공통 정보 수정 폼 (RHF + Zod)
 */

import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Program } from '@/types/domain'
import { GENERAL_PROGRAM_WAGE_DEDUCTION_ITEMS_LABEL } from '@/features/program/general/lib/wage-info-constants'
import {
  generalProgramCommonInfoEditSchema,
  programToGeneralCommonInfoEditValues,
  resolveSponsorManagementIds,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'

export interface UseGeneralProgramCommonInfoEditFormOptions {
  program: Program | null
  isEditMode: boolean
}

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
  scheduleGroupCount: 2,
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
    () => ({
      sponsors: sponsorsQuery.data ?? [],
      contactsBySponsorId: {},
    }),
    [sponsorsQuery.data]
  )
  const initialSponsorIds = useMemo(
    () => (program ? resolveSponsorManagementIds(program, interimSponsorContext) : []),
    [interimSponsorContext, program]
  )
  const sponsorContext = useGeneralProgramSponsorEditContext(initialSponsorIds)

  const defaultValues = useMemo(() => {
    if (program) return programToGeneralCommonInfoEditValues(program, sponsorContext)
    return EMPTY_DEFAULTS
  }, [program, sponsorContext])

  const form = useForm<GeneralProgramCommonInfoEditFormValues>({
    resolver: zodResolver(generalProgramCommonInfoEditSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  useEffect(() => {
    if (program) {
      reset(programToGeneralCommonInfoEditValues(program, sponsorContext), { keepDefaultValues: false })
    }
  }, [program, reset, sponsorContext])

  useLayoutEffect(() => {
    if (isEditMode && program) {
      reset(programToGeneralCommonInfoEditValues(program, sponsorContext), { keepDefaultValues: false })
    }
  }, [isEditMode, program, reset, sponsorContext])

  return form
}

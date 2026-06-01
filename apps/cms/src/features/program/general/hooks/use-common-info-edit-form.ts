/**
 * 일반 프로그램 상세 — 공통 정보 수정 폼 (RHF + Zod)
 */

import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Program } from '@/types/domain'
import {
  generalProgramCommonInfoEditSchema,
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'

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
  sponsorManagementId: '',
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
  wageDeductionItems: '',
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
  educationScheduleMode: 'date',
  educationScheduleLines: [],
}

export function useGeneralProgramCommonInfoEditForm({
  program,
  isEditMode,
}: UseGeneralProgramCommonInfoEditFormOptions): UseFormReturn<GeneralProgramCommonInfoEditFormValues> {
  const defaultValues = useMemo(() => {
    if (program) return programToGeneralCommonInfoEditValues(program)
    return EMPTY_DEFAULTS
  }, [program])

  const form = useForm<GeneralProgramCommonInfoEditFormValues>({
    resolver: zodResolver(generalProgramCommonInfoEditSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  useEffect(() => {
    if (program) {
      reset(programToGeneralCommonInfoEditValues(program), { keepDefaultValues: false })
    }
  }, [program, reset])

  useLayoutEffect(() => {
    if (isEditMode && program) {
      reset(programToGeneralCommonInfoEditValues(program), { keepDefaultValues: false })
    }
  }, [isEditMode, program, reset])

  return form
}

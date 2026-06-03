/**
 * 일반 프로그램 상세 풀페이지 모달 — `/programs/general?programId=…&lnb=…&tab=…`
 * LNB·breadcrumb·queryParam 복원만 구성 (본문 화면은 추후 API 연동)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import type { Program } from '@/types/domain'
import {
  GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
  getGeneralParticipantApplicationsLnbLabel,
  getGeneralSurveyMenuItems,
  getGeneralVolunteerInterviewEnabled,
  hasGeneralInstructorApplications,
  hasGeneralVolunteerApplications,
  resolveGeneralProgramForDetail,
  type GeneralSurveyMenuItem,
} from '@/features/program/general/lib/detail-meta'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'
import {
  parseGeneralDetailLnb,
  type GeneralDetailLnbKey,
} from '@/features/program/general/lib/detail-url'
import { useGeneralProgramCommonInfoEditForm } from '@/features/program/general/hooks/use-common-info-edit-form'
import { useGeneralProgramCommonInfoSave } from '@/features/program/general/hooks/use-common-info-save'
import { GeneralProgramDetailSidebar } from './detail-sidebar'
import { GeneralProgramDetailCommonInfoView } from './info/common-info-view'
import { GeneralProgramRecruitmentView } from './info/recruitment-view'
import {
  normalizeGeneralRecruitTab,
  type GeneralRecruitTabKey,
} from '@/features/program/general/lib/recruitment-tabs'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { GeneralSurveyManagementView } from './survey-management/survey-management-view'
import { ProgramManagersTab } from '../program-managers-tab'
import { GeneralParticipantApplicationsView } from './applications/participant-applications-view'
import { GeneralInstructorApplicationsView } from './applications/general-instructor-applications-view'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import { APPLICANT_ID_PARAM } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import { ProgramDetailSponsorDetailOverlay } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-detail-overlay'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'
const EDIT_PARAM = 'edit'

const GENERAL_DETAIL_QUERY_PARAMS = [
  'programId',
  LNB_PARAM,
  TAB_PARAM,
  EDIT_PARAM,
  APPLICANT_ID_PARAM,
  'detailTab',
] as const

const INFO_TABS = ['info', 'recruitment', 'application'] as const
const VOLUNTEER_INTERVIEW_TABS = ['vol_doc1', 'vol_doc_passed', 'vol_interview2'] as const
const PROGRESS_TABS = [
  'progress_institutions',
  'progress_instructors',
  'progress_volunteers',
] as const

export interface GeneralProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
  programIdHint?: string | null
}

function defaultTabForLnb(
  lnb: GeneralDetailLnbKey,
  interview: boolean,
  surveyKeys: string[]
): string {
  switch (lnb) {
    case 'info':
      return 'info'
    case 'institution_applications':
    case 'instructor_applications':
      return 'main'
    case 'volunteer_applications':
      return interview ? 'vol_doc1' : 'vol_all'
    case 'progress':
      return 'progress_institutions'
    case 'survey':
      return surveyKeys[0] ?? 'main'
    case 'managers':
      return 'main'
    default:
      return 'info'
  }
}

function isVolunteerTabValid(tab: string, interview: boolean): boolean {
  if (!interview) return tab === 'vol_all' || tab === 'main'
  return (VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(tab)
}

function normalizeGeneralDetailParams(
  programId: string,
  searchParams: URLSearchParams,
  program: Program
): URLSearchParams | null {
  const interview = getGeneralVolunteerInterviewEnabled(program)
  const surveyKeys = getGeneralSurveyMenuItems(program).map(s => s.key)
  const showInstructor = hasGeneralInstructorApplications(program)
  const showVolunteer = hasGeneralVolunteerApplications(program)

  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)

  let lnb: GeneralDetailLnbKey = parseGeneralDetailLnb(searchParams) ?? 'info'
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const setInvalid = (l: GeneralDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (tab === '') {
    tab = defaultTabForLnb(lnb, interview, surveyKeys)
  }

  if (lnb === 'info') {
    if (!(INFO_TABS as readonly string[]).includes(tab)) {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (tab !== 'main') setInvalid('institution_applications', 'main')
  } else if (lnb === 'instructor_applications') {
    if (!showInstructor) setInvalid('info', 'info')
    else if (tab !== 'main') setInvalid('instructor_applications', 'main')
  } else if (lnb === 'volunteer_applications') {
    if (!showVolunteer) setInvalid('info', 'info')
    else if (!isVolunteerTabValid(tab, interview)) {
      setInvalid(
        'volunteer_applications',
        defaultTabForLnb('volunteer_applications', interview, surveyKeys)
      )
    }
  } else if (lnb === 'progress') {
    if (!(PROGRESS_TABS as readonly string[]).includes(tab)) {
      setInvalid('progress', 'progress_institutions')
    }
  } else if (lnb === 'survey') {
    if (surveyKeys.length === 0) {
      if (tab !== 'main') setInvalid('survey', 'main')
    } else if (!(surveyKeys as readonly string[]).includes(tab)) {
      setInvalid('survey', surveyKeys[0] ?? 'main')
    }
  } else if (lnb === 'managers') {
    if (tab !== 'main') setInvalid('managers', 'main')
  }

  if (next.get(LNB_PARAM) !== lnb) next.set(LNB_PARAM, lnb)
  if (next.get(TAB_PARAM) !== tab) next.set(TAB_PARAM, tab)

  const changed =
    searchParams.get('programId') !== programId ||
    searchParams.get(LNB_PARAM) !== lnb ||
    searchParams.get(TAB_PARAM) !== tab

  return changed ? next : null
}

function generalLnbBreadcrumbLabel(
  lnb: GeneralDetailLnbKey,
  participantApplicationsLnbLabel: string
): string {
  switch (lnb) {
    case 'info':
      return '프로그램 정보'
    case 'institution_applications':
      return participantApplicationsLnbLabel
    case 'instructor_applications':
      return '강사 신청 목록'
    case 'volunteer_applications':
      return '봉사자 신청 목록'
    case 'progress':
      return '프로그램 진행 현황'
    case 'survey':
      return '설문 관리'
    case 'managers':
      return '담당자 정보'
    default:
      return '프로그램 정보'
  }
}

function generalChildBreadcrumbLabel(
  lnb: GeneralDetailLnbKey,
  tab: string,
  surveyItems: GeneralSurveyMenuItem[]
): string | null {
  if (lnb === 'info') {
    if (tab === 'info') return '공통 정보'
    if (tab === 'recruitment') return '모집 정보'
    if (tab === 'application') return '신청 정보'
    return null
  }
  if (lnb === 'volunteer_applications') {
    if (tab === 'vol_doc1') return '1차 서류 심사 대상자'
    if (tab === 'vol_doc_passed') return '1차 서류 합격자'
    if (tab === 'vol_interview2') return '2차 면접 대상자'
    return null
  }
  if (lnb === 'progress') {
    if (tab === 'progress_institutions') return '참여 기관'
    if (tab === 'progress_instructors') return '참여 강사'
    if (tab === 'progress_volunteers') return '참여 봉사자'
    return null
  }
  if (lnb === 'survey') {
    return surveyItems.find(item => item.key === tab)?.label ?? null
  }
  return null
}

function generalLnbBreadcrumbTargetTab(
  lnb: GeneralDetailLnbKey,
  activeTab: string,
  interview: boolean,
  surveyKeys: string[]
): string {
  if (lnb === 'volunteer_applications' && interview) {
    if ((VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(activeTab)) return activeTab
    return 'vol_doc1'
  }
  return defaultTabForLnb(lnb, interview, surveyKeys)
}

export function GeneralProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
}: GeneralProgramDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? searchParams.get('programId') ?? undefined

  const {
    program: detailProgram,
    loading,
    sponsorName,
    canWrite,
    updateProgram,
    setSelectedProgram,
  } = useProgramDetail(open ? programId : undefined)
  const displayProgram = useMemo(() => {
    return (
      detailProgram ??
      program ??
      (programId ? (resolveGeneralProgramForDetail(programId) ?? null) : null)
    )
  }, [detailProgram, program, programId])

  const interviewEnabled = displayProgram
    ? getGeneralVolunteerInterviewEnabled(displayProgram)
    : false
  const surveyItems = useMemo(
    () => (displayProgram ? getGeneralSurveyMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const showInstructorApplications = displayProgram
    ? hasGeneralInstructorApplications(displayProgram)
    : false
  const showVolunteerApplications = displayProgram
    ? hasGeneralVolunteerApplications(displayProgram)
    : false
  const participantApplicationsLnbLabel = useMemo(
    () =>
      displayProgram
        ? getGeneralParticipantApplicationsLnbLabel(displayProgram)
        : GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
    [displayProgram]
  )

  const activeLnb: GeneralDetailLnbKey = open
    ? (parseGeneralDetailLnb(searchParams) ?? 'info')
    : 'info'
  const activeTab = open ? (searchParams.get(TAB_PARAM) ?? 'info') : 'info'
  const editTab = open ? searchParams.get(EDIT_PARAM) : null

  const setEditMode = useCallback(
    (tab: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (tab) next.set(EDIT_PARAM, tab)
      else next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const isEditModeInfo =
    open && activeLnb === 'info' && activeTab === 'info' && editTab === 'info' && !!displayProgram

  const infoForm = useGeneralProgramCommonInfoEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { triggerSave: infoTriggerSave, resetToProgram: infoResetToProgram } =
    useGeneralProgramCommonInfoSave({
      form: infoForm,
      program: displayProgram ?? null,
      onSaveEdit: displayProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
            } catch {
              // API 연동 전 — 일반 프로그램 mock은 선택 프로그램 store에만 반영
              setSelectedProgram(draft)
            }
          }
        : undefined,
    })

  const handleInfoEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'info' || !displayProgram) return
    infoResetToProgram()
    setEditMode('info')
  }, [activeLnb, activeTab, displayProgram, infoResetToProgram, setEditMode])

  const handleInfoSave = useCallback(async () => {
    if (!displayProgram) return
    const isValid = await infoForm.trigger()
    if (!isValid) return
    setEditMode(null)
    void infoTriggerSave()
  }, [displayProgram, infoForm, infoTriggerSave, setEditMode])

  const [recruitSubTab, setRecruitSubTab] = useState<GeneralRecruitTabKey>('institutions')

  useEffect(() => {
    setRecruitSubTab(prev =>
      normalizeGeneralRecruitTab(prev, {
        showInstructor: showInstructorApplications,
        showVolunteer: showVolunteerApplications,
      })
    )
  }, [showInstructorApplications, showVolunteerApplications])

  const handleRecruitSubTabChange = useCallback(
    (tab: GeneralRecruitTabKey) => {
      setRecruitSubTab(tab)
      if (editTab) setEditMode(null)
    },
    [editTab, setEditMode]
  )

  const isEditModeInstitutions =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'institutions' &&
    editTab === 'institutions' &&
    !!displayProgram

  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstitutions,
    schema: programDetailInstitutionsEditSchema,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const isEditModeInstructors =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'instructors' &&
    editTab === 'instructors' &&
    !!displayProgram

  const instructorsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstructors,
  })
  const {
    triggerSave: instructorsTriggerSave,
    resetToProgram: instructorsResetToProgram,
    registerGetAdditionalContentHtml: registerInstructorsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: instructorsForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const isEditModeVolunteers =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'volunteers' &&
    editTab === 'volunteers' &&
    !!displayProgram

  const volunteersForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeVolunteers,
  })
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const handleRecruitmentEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'recruitment' || !displayProgram) return
    if (recruitSubTab === 'institutions') {
      institutionsResetToProgram()
      setEditMode('institutions')
      return
    }
    if (recruitSubTab === 'instructors') {
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (recruitSubTab === 'volunteers') {
      volunteersResetToProgram()
      setEditMode('volunteers')
    }
  }, [
    activeLnb,
    activeTab,
    displayProgram,
    recruitSubTab,
    institutionsResetToProgram,
    instructorsResetToProgram,
    volunteersResetToProgram,
    setEditMode,
  ])

  const handleRecruitmentSave = useCallback(async () => {
    if (!displayProgram) return
    if (recruitSubTab === 'institutions') {
      const isValid = await institutionsForm.trigger()
      if (!isValid) return
      setEditMode(null)
      void institutionsTriggerSave()
      return
    }
    if (recruitSubTab === 'instructors') {
      const isValid = await instructorsForm.trigger()
      if (!isValid) return
      setEditMode(null)
      void instructorsTriggerSave()
      return
    }
    if (recruitSubTab === 'volunteers') {
      const isValid = await volunteersForm.trigger()
      if (!isValid) return
      setEditMode(null)
      void volunteersTriggerSave()
    }
  }, [
    displayProgram,
    recruitSubTab,
    institutionsForm,
    instructorsForm,
    volunteersForm,
    institutionsTriggerSave,
    instructorsTriggerSave,
    volunteersTriggerSave,
    setEditMode,
  ])

  const applicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const [applicantDetailMeta, setApplicantDetailMeta] = useState<ApplicantDetailMeta>(null)

  const handleApplicantDetailMetaChange = useCallback((meta: ApplicantDetailMeta) => {
    setApplicantDetailMeta(meta)
  }, [])

  useEffect(() => {
    if (
      !open ||
      (activeLnb !== 'institution_applications' && activeLnb !== 'instructor_applications')
    ) {
      setApplicantDetailMeta(null)
    }
  }, [open, activeLnb])

  const handleModalClose = useCallback(() => {
    if (
      (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications') &&
      applicantCloseHandlerRef.current?.()
    ) {
      return
    }
    onClose()
  }, [activeLnb, onClose])

  useEffect(() => {
    if (!open || !programId || !displayProgram) return
    const normalized = normalizeGeneralDetailParams(programId, searchParams, displayProgram)
    if (normalized) setSearchParams(normalized, { replace: true })
  }, [open, programId, displayProgram, searchParams, setSearchParams])

  const setLnbTab = useCallback(
    (lnb: GeneralDetailLnbKey, tab: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, lnb)
      next.set(TAB_PARAM, tab)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const headerBreadcrumbItems = (() => {
    const listParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
    })
    const items = [makeBreadcrumbItem('프로그램 목록', location.pathname, listParams)]

    if (!displayProgram) return items

    const programParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const lnbLabel = generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
    const childLabel = generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems)
    const lnbTab = generalLnbBreadcrumbTargetTab(activeLnb, activeTab, interviewEnabled, surveyKeys)
    const lnbParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]: lnbTab,
      },
    })
    const childParams = childLabel
      ? buildSearchParams(searchParams, {
          delete: GENERAL_DETAIL_QUERY_PARAMS,
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeTab,
          },
        })
      : null

    items.push(
      makeBreadcrumbItem(
        resolveGeneralProgramDisplayTitle(displayProgram),
        location.pathname,
        programParams
      )
    )

    const hasParticipantApplicationDetail =
      applicantDetailMeta != null &&
      (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications')

    if (!childLabel) {
      items.push(
        hasParticipantApplicationDetail
          ? makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams)
          : { label: lnbLabel }
      )
    } else {
      items.push(makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams))
      items.push(
        childParams
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    }

    if (hasParticipantApplicationDetail) {
      items.push({ label: applicantDetailMeta.breadcrumbLabel })
    }

    return items
  })()

  if (!open) return null

  const modalTitle =
    applicantDetailMeta &&
    (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications')
      ? applicantDetailMeta.title
      : displayProgram
        ? resolveGeneralProgramDisplayTitle(displayProgram)
        : '프로그램 상세'

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={handleModalClose}
        title={modalTitle}
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className="program-detail-fullpage-modal general-detail-fullpage-modal program-detail-fullpage-modal--program-list-overview"
        sidebar={
          programId ? (
            <GeneralProgramDetailSidebar
              activeLnb={activeLnb}
              activeTab={activeTab}
              participantApplicationsLnbLabel={participantApplicationsLnbLabel}
              showInstructorApplications={showInstructorApplications}
              showVolunteerApplications={showVolunteerApplications}
              volunteerInterviewEnabled={interviewEnabled}
              surveyItems={surveyItems}
              onSelectChildTab={setLnbTab}
            />
          ) : null
        }
      >
        {loading && !displayProgram ? (
          <div className="detail-fullpage-modal__loading">
            <Spin size="large" />
          </div>
        ) : displayProgram ? (
          <>
            {activeLnb === 'info' && activeTab === 'info' ? (
              <GeneralProgramDetailCommonInfoView
                program={displayProgram}
                sponsorName={sponsorName}
                isEditMode={isEditModeInfo}
                form={infoForm}
                canWrite={canWrite}
                onEdit={handleInfoEdit}
                onSave={handleInfoSave}
              />
            ) : activeLnb === 'info' && activeTab === 'recruitment' ? (
              <GeneralProgramRecruitmentView
                program={displayProgram}
                sponsorName={sponsorName}
                activeRecruitTab={recruitSubTab}
                onRecruitTabChange={handleRecruitSubTabChange}
                showInstructorTab={showInstructorApplications}
                showVolunteerTab={showVolunteerApplications}
                canWrite={canWrite}
                isEditModeInstitutions={isEditModeInstitutions}
                institutionsForm={isEditModeInstitutions ? institutionsForm : undefined}
                registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
                isEditModeInstructors={isEditModeInstructors}
                instructorsForm={isEditModeInstructors ? instructorsForm : undefined}
                registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
                isEditModeVolunteers={isEditModeVolunteers}
                volunteersForm={isEditModeVolunteers ? volunteersForm : undefined}
                registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
                onEdit={handleRecruitmentEdit}
                onSave={handleRecruitmentSave}
              />
            ) : activeLnb === 'survey' ? (
              <GeneralSurveyManagementView program={displayProgram} activeTab={activeTab} />
            ) : activeLnb === 'managers' && displayProgram.id ? (
              <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                <ProgramManagersTab programId={displayProgram.id} />
              </div>
            ) : activeLnb === 'institution_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralParticipantApplicationsView
                  program={displayProgram}
                  listTitle={participantApplicationsLnbLabel}
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                  onApplicantDetailMetaChange={handleApplicantDetailMetaChange}
                />
              </div>
            ) : activeLnb === 'instructor_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralInstructorApplicationsView
                  program={displayProgram}
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                  onApplicantDetailMetaChange={handleApplicantDetailMetaChange}
                />
              </div>
            ) : (
              <div
                className="general-detail-fullpage-modal__main"
                aria-label={
                  generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems) ??
                  generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
                }
              />
            )}
          </>
        ) : (
          <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
        )}
      </DetailFullPageModal>
      <ProgramDetailSponsorDetailOverlay />
    </>
  )
}

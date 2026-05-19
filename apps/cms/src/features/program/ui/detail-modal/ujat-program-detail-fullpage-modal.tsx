/**
 * UJAT 프로그램 상세 풀페이지 모달 — `/programs/ujat?programId=…&lnb=…&tab=…`
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useSponsorService } from '@/features/sponsor/hooks/use-sponsor-service'
import { useProgramDetailEditForm } from '../../hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '../../hooks/use-program-detail-info-save'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { handleError } from '@/shared/utils/error-handler'
import { ProjectInfoDetailPanels } from '../../program-detail/ui/project-info/project-info-detail'
import { ProgramManagersTab } from '../program-managers-tab'
import { ApplicantList } from '../../program-detail/ui/applicant-list/applicant-list'
import { ParticipatingInstitutionsSection } from './program-status/participating-institutions-section'
import type { Program } from '@/types/domain'
import {
  isUjatVolunteerApplicantDetailTab,
  parseUjatDetailLnb,
  resolveUjatDetailLnbFromSearchParams,
  UJAT_APPLICANT_ID_PARAM,
  type UjatDetailLnbKey,
} from './ujat-program-detail-url'
import { isUjatVolunteerApplicantInTabList } from './ujat-volunteer-screening/ujat-volunteer-applicant-detail-url'
import {
  getUjatSurveyMenuItemsForProgram,
  getUjatVolunteerInterviewEnabled,
  UJAT_SURVEY_LEGACY_TAB_MAP,
} from './ujat-program-detail-meta'
import { UjatProgramDetailSidebar } from './ujat-program-detail-sidebar'
import { UjatProgramDetailCommonInfoView } from './ujat-program-detail-common-info-view'
import { canUjatProgramInfoEdit } from './ujat-program-info-edit'
import {
  defaultEducationProgressTabForHalf,
  educationProgressScreenTitle,
  EDU_PROGRESS_LEGACY_TAB_MAP,
  isValidEducationProgressTab,
} from './ujat-education-progress-tabs'
import {
  institutionAppScreenTitle,
  isValidUjatInstitutionAppTab,
} from './ujat-institution-application-tabs'
import { programDetailInstitutionsEditSchema } from '@/features/program/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
import {
  isUjatRecruitTab,
  normalizeUjatRecruitTab,
  type UjatRecruitTabKey,
} from './ujat-program-detail-recruitment-tabs'
import { UjatProgramRecruitmentPanels } from './ujat-program-recruitment-panels'
import { UjatProgramRecruitmentTabsRow } from './ujat-program-recruitment-tabs-row'
import { UjatVolunteerDocScreeningSection } from './ujat-volunteer-screening/ujat-volunteer-doc-screening-section'
import { UjatVolunteerDocPassedSection } from './ujat-volunteer-screening/ujat-volunteer-doc-passed-section'
import { UjatVolunteerInterview2Section } from './ujat-volunteer-screening/ujat-volunteer-interview2-section'
import '@toast-ui/editor/dist/toastui-editor.css'
import './program-detail-fullpage-modal.css'
import './ujat-program-detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'
const EDIT_PARAM = 'edit'

export interface UjatProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  /** 목록에서 선택된 프로그램(로딩 전 null 가능) */
  program: Program | null
  /** URL의 programId — 목록에 아직 없을 때 상세 fetch용 */
  programIdHint?: string | null
}

function defaultVolunteerTab(interview: boolean, half: 'h1' | 'h2'): string {
  const p = half === 'h1' ? 'vh1' : 'vh2'
  if (!interview) return `${p}_all`
  return `${p}_doc1`
}

function isVolunteerTabValidForLnb(
  lnb: 'volunteer_h1' | 'volunteer_h2',
  tab: string,
  interview: boolean
): boolean {
  const prefix = lnb === 'volunteer_h1' ? 'vh1' : 'vh2'
  if (!tab.startsWith(`${prefix}_`)) return false
  if (!interview) return tab === `${prefix}_all`
  return (
    tab === `${prefix}_doc1` ||
    tab === `${prefix}_doc_passed` ||
    tab === `${prefix}_interview2`
  )
}

function defaultVolunteerTabForLnb(lnb: 'volunteer_h1' | 'volunteer_h2', interview: boolean): string {
  return defaultVolunteerTab(interview, lnb === 'volunteer_h1' ? 'h1' : 'h2')
}

function normalizeUjatDetailParams(
  programId: string,
  searchParams: URLSearchParams,
  interview: boolean,
  surveyKeys: string[]
): URLSearchParams | null {
  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)
  const rawLnb = searchParams.get(LNB_PARAM) ?? ''
  let lnb: UjatDetailLnbKey =
    rawLnb === 'volunteer_applications'
      ? (() => {
          const t0 = searchParams.get(TAB_PARAM) ?? ''
          return t0.startsWith('vh2_') ? 'volunteer_h2' : 'volunteer_h1'
        })()
      : (parseUjatDetailLnb(searchParams) ?? 'info')
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const setInvalid = (l: UjatDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (lnb === 'info') {
    if (tab === 'info') {
      /* ok */
    } else if (isUjatRecruitTab(tab)) {
      tab = normalizeUjatRecruitTab(tab)
    } else {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (!isValidUjatInstitutionAppTab(tab)) {
      setInvalid('institution_applications', 'inst_all')
    }
  } else if (lnb === 'volunteer_h1' || lnb === 'volunteer_h2') {
    if (!isVolunteerTabValidForLnb(lnb, tab, interview)) {
      setInvalid(lnb, defaultVolunteerTabForLnb(lnb, interview))
    }
  } else if (lnb === 'education_progress') {
    tab = EDU_PROGRESS_LEGACY_TAB_MAP[tab] ?? tab
    if (!isValidEducationProgressTab(tab)) {
      setInvalid('education_progress', defaultEducationProgressTabForHalf('h1'))
    }
  } else if (lnb === 'survey') {
    tab = UJAT_SURVEY_LEGACY_TAB_MAP[tab] ?? tab
    if (!surveyKeys.includes(tab)) {
      setInvalid('survey', surveyKeys[0] ?? 'survey-poll')
    }
  } else if (lnb === 'managers') {
    if (tab !== 'main') setInvalid('managers', 'main')
  }

  if (next.get(LNB_PARAM) !== lnb) next.set(LNB_PARAM, lnb)
  if (next.get(TAB_PARAM) !== tab) next.set(TAB_PARAM, tab)

  const applicantId = next.get(UJAT_APPLICANT_ID_PARAM)
  if (applicantId) {
    if (!isUjatVolunteerApplicantDetailTab(tab)) {
      next.delete(UJAT_APPLICANT_ID_PARAM)
    } else if (!isUjatVolunteerApplicantInTabList(programId, tab, applicantId)) {
      next.delete(UJAT_APPLICANT_ID_PARAM)
    }
  }

  const before = searchParams.toString()
  const after = next.toString()
  if (before === after) return null
  return next
}

const VOLUNTEER_TAB_LABELS: Record<string, string> = {
  vh1_all: '상반기 봉사자 신청 — 신청자 목록',
  vh2_all: '하반기 봉사자 신청 — 신청자 목록',
  vh1_doc1: '상반기 — 1차 서류 심사 대상자',
  vh1_doc_passed: '상반기 — 1차 서류 합격자',
  vh1_interview2: '상반기 — 2차 면접 대상자',
  vh2_doc1: '하반기 — 1차 서류 심사 대상자',
  vh2_doc_passed: '하반기 — 1차 서류 합격자',
  vh2_interview2: '하반기 — 2차 면접 대상자',
}

function volunteerScreenTitle(tab: string): string {
  return VOLUNTEER_TAB_LABELS[tab] ?? tab
}

function UjatPlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-detail-modal__placeholder">
      <Typography.Title level={5}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
    </div>
  )
}

export function UjatProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
}: UjatProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? undefined

  const {
    program: detailProgram,
    loading,
    sponsorName,
    updateProgram,
  } = useProgramDetail(open ? programId : undefined)

  const displayProgram = useMemo(() => detailProgram ?? program ?? null, [detailProgram, program])

  const { getByIdSync: getSponsorByIdSync } = useSponsorService()
  const sponsorHomepageUrl = useMemo(() => {
    const sid = displayProgram?.sponsorId
    if (!sid) return undefined
    const sponsor = getSponsorByIdSync(sid) as { homepageUrl?: string } | undefined
    return sponsor?.homepageUrl
  }, [displayProgram?.sponsorId, getSponsorByIdSync])

  const interviewEnabled = programId ? getUjatVolunteerInterviewEnabled(programId) : true
  const surveyItems = useMemo(
    () => (programId ? getUjatSurveyMenuItemsForProgram(programId) : []),
    [programId]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])

  const activeLnb: UjatDetailLnbKey = open ? (resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info') : 'info'
  const rawTab = open ? (searchParams.get(TAB_PARAM) ?? 'info') : 'info'
  const activeTab = open && rawTab !== 'info' && isUjatRecruitTab(rawTab) ? normalizeUjatRecruitTab(rawTab) : rawTab
  const activeRecruitTab: UjatRecruitTabKey | null =
    activeLnb === 'info' && isUjatRecruitTab(activeTab) ? (activeTab as UjatRecruitTabKey) : null

  const surveyKeysJoined = surveyKeys.join('|')

  useEffect(() => {
    if (!open || !programId) return
    const normalized = normalizeUjatDetailParams(
      programId,
      searchParams,
      interviewEnabled,
      surveyKeys
    )
    if (normalized) setSearchParams(normalized, { replace: true })
  }, [open, programId, interviewEnabled, surveyKeysJoined, searchParams, setSearchParams, surveyKeys])

  const setLnbTab = useCallback(
    (lnb: UjatDetailLnbKey, tab: string) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(LNB_PARAM, lnb)
      next.set(TAB_PARAM, tab)
      next.delete(EDIT_PARAM)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const editTab = searchParams.get(EDIT_PARAM)
  const canEditInfo = useMemo(() => canUjatProgramInfoEdit(displayProgram), [displayProgram])
  const isEditModeInfo =
    open &&
    activeLnb === 'info' &&
    activeTab === 'info' &&
    editTab === 'info' &&
    !!displayProgram &&
    canEditInfo

  const infoForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { triggerSave: infoTriggerSave, resetToProgram: infoResetToProgram } =
    useProgramDetailInfoSave({
      form: infoForm,
      program: displayProgram ?? ({} as Program),
      onSaveEdit:
        displayProgram && updateProgram
          ? async draft => {
              try {
                const { id: _id, createdAt: _c, ...patch } = draft
                await updateProgram(draft.id, patch)
                const next = new URLSearchParams(searchParams)
                next.delete(EDIT_PARAM)
                if (programId) next.set('programId', programId)
                setSearchParams(next, { replace: true })
              } catch (error) {
                handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
              }
            }
          : undefined,
    })

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

  const handleInfoEdit = useCallback(() => {
    if (activeTab !== 'info' || !displayProgram) return
    if (!canUjatProgramInfoEdit(displayProgram)) {
      return
    }
    infoResetToProgram()
    setEditMode('info')
  }, [activeTab, displayProgram, infoResetToProgram, setEditMode])

  const handleInfoSave = useCallback(() => {
    setEditMode(null)
    if (displayProgram) void infoTriggerSave()
  }, [displayProgram, infoTriggerSave, setEditMode])

  const isEditModeRecruitParticipant =
    open &&
    activeRecruitTab === 'recruit_participant' &&
    editTab === 'recruit_participant' &&
    !!displayProgram &&
    canEditInfo

  const isEditModeRecruitVolunteer =
    open &&
    !!activeRecruitTab &&
    (activeRecruitTab === 'recruit_volunteer_h1' || activeRecruitTab === 'recruit_volunteer_h2') &&
    editTab === activeRecruitTab &&
    !!displayProgram &&
    canEditInfo

  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitParticipant,
    schema: programDetailInstitutionsEditSchema,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const volunteersForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitVolunteer,
  })
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const isRecruitEditMode = isEditModeRecruitParticipant || isEditModeRecruitVolunteer

  const selectRecruitTab = useCallback(
    (tab: UjatRecruitTabKey) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(LNB_PARAM, 'info')
      next.set(TAB_PARAM, tab)
      next.delete(EDIT_PARAM)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open || !displayProgram || !editTab) return
    if (editTab === 'info' && !canUjatProgramInfoEdit(displayProgram)) {
      const next = new URLSearchParams(searchParams)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    const recruitEditKeys = ['recruit_participant', 'recruit_volunteer_h1', 'recruit_volunteer_h2'] as const
    if ((recruitEditKeys as readonly string[]).includes(editTab) && !canUjatProgramInfoEdit(displayProgram)) {
      const next = new URLSearchParams(searchParams)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    }
  }, [open, editTab, displayProgram, programId, searchParams, setSearchParams])

  const handleRecruitmentEdit = useCallback(() => {
    if (!activeRecruitTab || !displayProgram) return
    if (!canUjatProgramInfoEdit(displayProgram)) {
      return
    }
    if (activeRecruitTab === 'recruit_participant') {
      institutionsResetToProgram()
    } else {
      volunteersResetToProgram()
    }
    setEditMode(activeRecruitTab)
  }, [
    activeRecruitTab,
    displayProgram,
    institutionsResetToProgram,
    volunteersResetToProgram,
    setEditMode,
  ])

  const handleRecruitmentSave = useCallback(() => {
    setEditMode(null)
    if (!activeRecruitTab) return
    if (activeRecruitTab === 'recruit_participant') {
      institutionsTriggerSave()
    } else {
      volunteersTriggerSave()
    }
  }, [activeRecruitTab, institutionsTriggerSave, volunteersTriggerSave, setEditMode])

  const volunteerApplicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const [volunteerApplicantDetailTitle, setVolunteerApplicantDetailTitle] = useState<string | null>(
    null
  )

  useEffect(() => {
    const isVolunteerDocScreening =
      activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2'
    const isVolunteerApplicantTab =
      activeTab === 'vh1_doc1' ||
      activeTab === 'vh2_doc1' ||
      activeTab === 'vh1_doc_passed' ||
      activeTab === 'vh2_doc_passed'
    if (!isVolunteerDocScreening || !isVolunteerApplicantTab) {
      setVolunteerApplicantDetailTitle(null)
    }
  }, [activeLnb, activeTab])

  const handleClose = useCallback(() => {
    onClose()
    const next = new URLSearchParams(searchParams)
    next.delete('programId')
    next.delete(LNB_PARAM)
    next.delete(TAB_PARAM)
    next.delete(EDIT_PARAM)
    next.delete(UJAT_APPLICANT_ID_PARAM)
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, {
      replace: true,
    })
  }, [location.pathname, navigate, onClose, searchParams])

  const handleHeaderCloseClick = useCallback(() => {
    const isVolunteerDocScreening =
      activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2'
    const isVolunteerApplicantTab =
      activeTab === 'vh1_doc1' ||
      activeTab === 'vh2_doc1' ||
      activeTab === 'vh1_doc_passed' ||
      activeTab === 'vh2_doc_passed'
    if (isVolunteerDocScreening && isVolunteerApplicantTab && volunteerApplicantCloseHandlerRef.current?.()) {
      return
    }
    handleClose()
  }, [activeLnb, activeTab, handleClose])

  if (!open) return null

  const title = volunteerApplicantDetailTitle ?? displayProgram?.title ?? '프로그램 상세'

  return (
    <DetailFullPageModal
      open={open}
      onClose={handleClose}
      onHeaderClose={handleHeaderCloseClick}
      title={title}
      className="program-detail-fullpage-modal ujat-program-detail-fullpage-modal"
      sidebar={
        programId ? (
          <UjatProgramDetailSidebar
            activeLnb={activeLnb}
            activeTab={activeTab}
            interviewEnabled={interviewEnabled}
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
          {activeLnb === 'info' && activeTab === 'info' && (
            <>
              {(canEditInfo || isEditModeInfo) && (
                <div className="ujat-detail-modal__info-header">
                  <div className="program-detail-fullpage-modal__header-actions">
                    <CmsButton onClick={isEditModeInfo ? handleInfoSave : handleInfoEdit}>
                      {isEditModeInfo ? '정보 저장' : '정보 수정'}
                    </CmsButton>
                  </div>
                </div>
              )}
              {isEditModeInfo ? (
                <ProjectInfoDetailPanels
                  program={displayProgram}
                  sponsorName={sponsorName}
                  isBodyLoading={loading && !displayProgram}
                  hideTabsRow
                  activeTab="info"
                  onSelectTab={() => undefined}
                  isEditModeInfo
                  infoForm={infoForm}
                  isEditModeInstitutions={false}
                  institutionsForm={undefined}
                  registerInstitutionsAdditionalHtml={() => {}}
                  isEditModeInstructors={false}
                  instructorsForm={undefined}
                  registerInstructorsAdditionalHtml={() => {}}
                  isEditModeVolunteers={false}
                  volunteersForm={undefined}
                  registerVolunteersAdditionalHtml={() => {}}
                  onInfoEdit={handleInfoEdit}
                  onInfoSave={handleInfoSave}
                  onInstitutionsSave={() => undefined}
                  onInstructorsSave={() => undefined}
                  onVolunteersSave={() => undefined}
                  onPreview={() => undefined}
                />
              ) : (
                <UjatProgramDetailCommonInfoView
                  program={displayProgram}
                  sponsorName={sponsorName}
                  sponsorHomepageUrl={sponsorHomepageUrl}
                />
              )}
            </>
          )}

          {activeLnb === 'info' && activeRecruitTab && (
            <div className="program-detail-fullpage-modal__info-tab ujat-detail-modal__recruitment-body">
              <UjatProgramRecruitmentTabsRow
                activeTab={activeRecruitTab}
                onSelectTab={selectRecruitTab}
                canEdit={canEditInfo}
                isEditMode={isRecruitEditMode}
                onEdit={handleRecruitmentEdit}
                onSave={handleRecruitmentSave}
              />
              <UjatProgramRecruitmentPanels
                program={displayProgram}
                sponsorName={sponsorName}
                activeRecruitTab={activeRecruitTab}
                isEditMode={isRecruitEditMode}
                institutionsForm={isEditModeRecruitParticipant ? institutionsForm : undefined}
                volunteersForm={isEditModeRecruitVolunteer ? volunteersForm : undefined}
                registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
                registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
              />
            </div>
          )}

          {activeLnb === 'institution_applications' && activeTab === 'inst_all' && (
            <ApplicantList menu="institutions" program={displayProgram} />
          )}
          {activeLnb === 'institution_applications' &&
            (activeTab === 'inst_schedule_confirm' || activeTab === 'inst_schedule_assign') && (
            <UjatPlaceholderSection
              title={institutionAppScreenTitle(activeTab)}
              description={
                activeTab === 'inst_schedule_assign'
                  ? '신청 기관에 대한 임시 교육 배정을 진행합니다.'
                  : '임시 배정이 완료된 기관을 대상으로 배정 내용을 확인합니다.'
              }
            />
          )}

          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_doc1' || activeTab === 'vh2_doc1') && (
              <UjatVolunteerDocScreeningSection
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailTitleChange={setVolunteerApplicantDetailTitle}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_doc_passed' || activeTab === 'vh2_doc_passed') && (
              <UjatVolunteerDocPassedSection
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailTitleChange={setVolunteerApplicantDetailTitle}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_interview2' || activeTab === 'vh2_interview2') && (
              <UjatVolunteerInterview2Section
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            activeTab !== 'vh1_doc1' &&
            activeTab !== 'vh2_doc1' &&
            activeTab !== 'vh1_doc_passed' &&
            activeTab !== 'vh2_doc_passed' &&
            activeTab !== 'vh1_interview2' &&
            activeTab !== 'vh2_interview2' && (
              <UjatPlaceholderSection
                title={volunteerScreenTitle(activeTab)}
                description="봉사자 신청·심사·면접 일정 배정 화면(상·하반기 동일 프로세스)입니다. 목 데이터 연동 후 테이블이 표시됩니다."
              />
            )}

          {activeLnb === 'education_progress' &&
            /^edu_h[12]_institutions$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <ParticipatingInstitutionsSection
                programId={displayProgram.id}
                program={displayProgram}
                schoolIdFromUrl={null}
                schoolTabFromUrl="application"
                onSchoolTabChange={() => undefined}
                onSchoolRowClick={() => window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)}
                onClearSchoolId={() => undefined}
                onSchoolDetailOpen={() => undefined}
                onSchoolDetailClose={() => undefined}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_volunteers$/.test(activeTab) && (
            <UjatPlaceholderSection
              title={educationProgressScreenTitle(activeTab)}
              description="최종 승인된 봉사자 목록이 표시됩니다."
            />
          )}
          {activeLnb === 'education_progress' &&
            /^edu_h[12]_(region|attendance|assignments)$/.test(activeTab) && (
              <UjatPlaceholderSection
                title={educationProgressScreenTitle(activeTab)}
                description="해당 기능 화면이 연결되면 이 영역에 표시됩니다."
              />
            )}
          {activeLnb === 'education_progress' && activeTab === 'edu_summary' && (
            <UjatPlaceholderSection
              title="교육 진행 요약"
              description="교육 진행 현황을 요약해 보여주는 화면입니다."
            />
          )}

          {activeLnb === 'survey' && (
            <UjatPlaceholderSection
              title={surveyItems.find(s => s.key === activeTab)?.label ?? '설문'}
              description="설문 관리 화면입니다. 목 데이터 연동 후 설문 항목별 콘텐츠가 표시됩니다."
            />
          )}

          {activeLnb === 'managers' && (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              <ProgramManagersTab programId={displayProgram.id} />
            </div>
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
    </DetailFullPageModal>
  )
}

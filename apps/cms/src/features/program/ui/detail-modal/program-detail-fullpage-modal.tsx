/**
 * 프로그램 상세 풀페이지 모달
 * 경제/일반 교육 프로그램 목록 테이블 행 클릭 시 노출.
 * 모달 내 LNB, 헤더 타이틀, 탭, 기본정보/커리큘럼/KPI 테이블 구성.
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography, message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useProgramDetailEditForm } from '../../hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '../../hooks/use-program-detail-info-save'
import { MESSAGES } from '@/shared/constants'
import { ParticipatingInstitutionsSection } from '../participating-institutions-section'
import { ParticipatingInstructorsSection } from '../participating-instructors-section'
import { ApplicantDetails } from './applicants/applicants-detail'
import { ProjectInfoDetailPanels } from './project-info/project-info-detail'
import { ProgramManagersTab } from '../program-managers-tab'
import type { Program } from '@/types/domain'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/lib/program-admin-detail-url'
import { DetailModalSidebar, TAB_KEYS, type TabKey, type LnbKey } from './detail-modal-sidebar'
import '@toast-ui/editor/dist/toastui-editor.css'
import './program-detail-fullpage-modal.css'

export interface ProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
}

const TAB_PARAM = 'tab'
const EDIT_PARAM = 'edit'
const LNB_PARAM = 'lnb'
const SCHOOL_ID_PARAM = 'schoolId'
const SCHOOL_TAB_PARAM = 'schoolTab'
const SUB_TAB_PARAM = 'subTab'

/** 프로그램 상세 모달 LNB 카테고리
 * info: 프로젝트 정보
 * applicants: 신청자 목록
 * progress: 프로그램 진행 현황
 * managers: 담당자 정보
 */
const LNB_KEYS_READONLY: readonly LnbKey[] = ['info', 'applicants', 'progress', 'managers']

/** 학교 상세 뷰 내 탭(신청 정보 | 학생 명단 | 강사 배정 현황 | 게시글) */
const SCHOOL_DETAIL_TAB_KEYS_READONLY = ['application', 'students', 'instructors', 'posts'] as const
type SchoolDetailTabKey = (typeof SCHOOL_DETAIL_TAB_KEYS_READONLY)[number]

function parseSchoolTabFromSearch(searchParams: URLSearchParams): SchoolDetailTabKey {
  const t = searchParams.get(SCHOOL_TAB_PARAM)
  if (t && SCHOOL_DETAIL_TAB_KEYS_READONLY.includes(t as SchoolDetailTabKey))
    return t as SchoolDetailTabKey
  return 'application'
}

function parseTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab && (TAB_KEYS as readonly string[]).includes(tab)) return tab as TabKey
  return 'info'
}

/** 신청자 목록 LNB: tab은 신청 기관/강사/봉사자만 유효 (info 등 공통정보 탭 값은 테이블이 비지 않도록 기본값) */
function parseApplicantsChildTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab === 'institutions' || tab === 'instructors' || tab === 'volunteers') return tab
  return 'institutions'
}

function parseLnbFromSearch(searchParams: URLSearchParams): LnbKey | null {
  const lnb = searchParams.get(LNB_PARAM)
  if (lnb && (LNB_KEYS_READONLY as readonly string[]).includes(lnb)) return lnb as LnbKey
  return null
}

/** 쿼리 파라미터에서 수정 모드 탭 파싱. edit=info 등 현재 탭과 일치할 때만 해당 탭이 수정 모드 */
function parseEditTabFromSearch(searchParams: URLSearchParams): TabKey | null {
  const edit = searchParams.get(EDIT_PARAM)
  if (edit && (TAB_KEYS as readonly string[]).includes(edit)) return edit as TabKey
  return null
}

export function ProgramDetailFullPageModal({
  open,
  onClose,
  program,
}: ProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id
  const {
    program: detailProgram,
    loading,
    sponsorName,
    updateProgram,
  } = useProgramDetail(open ? programId : undefined)
  const activeTab = open ? parseTabFromSearch(searchParams) : 'info'
  const editTab = open ? parseEditTabFromSearch(searchParams) : null
  const activeLnb = open ? (parseLnbFromSearch(searchParams) ?? 'info') : 'info'
  const applicantsExpanded = activeLnb === 'applicants'
  const activeChildMenu: TabKey | '' =
    activeLnb === 'applicants' ? parseApplicantsChildTabFromSearch(searchParams) : ''
  const progressExpanded = activeLnb === 'progress'
  const progressTab = parseTabFromSearch(searchParams)
  const activeProgressChild: TabKey | '' =
    activeLnb === 'progress' && ['institutions', 'instructors', 'volunteers'].includes(progressTab)
      ? progressTab
      : ''

  const APPLICANTS_TAB_KEYS: TabKey[] = ['institutions', 'instructors', 'volunteers']
  const PROGRESS_TAB_KEYS: TabKey[] = ['institutions', 'instructors', 'volunteers']

  const schoolIdFromUrl = searchParams.get(SCHOOL_ID_PARAM)
  const activeSchoolTab = schoolIdFromUrl ? parseSchoolTabFromSearch(searchParams) : 'application'

  // 모달이 열릴 때: URL에 유효한 lnb·tab이 있으면 유지(새로고침 복원), 없으면 info 또는 해당 카테고리 기본 탭으로 보정
  // programId는 모달이 열려 있는 동안 항상 유지(클릭/새로고침 타이밍 이슈 방지)
  useEffect(() => {
    if (!open) return
    const currentLnb = parseLnbFromSearch(searchParams)
    const currentTab = parseTabFromSearch(searchParams)
    // 공통 정보(lnb=info) 내 탭: info | institutions | instructors | volunteers
    if (currentLnb === 'info' && (TAB_KEYS as readonly string[]).includes(currentTab)) return
    // 신청자 목록(lnb=applicants) 내 탭 — 유효하면 유지
    if (currentLnb === 'applicants') {
      if (APPLICANTS_TAB_KEYS.includes(currentTab)) return
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'applicants')
      next.set(TAB_PARAM, 'institutions')
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    // 프로그램 진행현황(lnb=progress) 내 탭 — 유효하면 유지
    if (currentLnb === 'progress') {
      if (PROGRESS_TAB_KEYS.includes(currentTab)) return
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'progress')
      next.set(TAB_PARAM, 'institutions')
      next.delete(SUB_TAB_PARAM)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    // 담당자 정보
    if (currentLnb === 'managers') return
    // lnb 없음/비유효 시 공통 정보로 초기화
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, 'info')
    next.delete(EDIT_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, programId])

  // 진행현황 진입 시 tab=instructors면 subTab=instructors 보장(새로고침 시 세그먼트 복원)
  useEffect(() => {
    if (!open || activeLnb !== 'progress') return
    if (progressTab !== 'instructors') return
    if (searchParams.get(SUB_TAB_PARAM) === 'instructors') return
    const next = new URLSearchParams(searchParams)
    next.set(SUB_TAB_PARAM, 'instructors')
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, activeLnb, progressTab, searchParams, setSearchParams, programId])

  // 진행현황 내 세그먼트(subTab) 변경 시 tab 동기화 — LNB 활성 메뉴와 일치
  useEffect(() => {
    if (!open || activeLnb !== 'progress') return
    const subTab = searchParams.get(SUB_TAB_PARAM)
    const wantTab = subTab === 'instructors' ? 'instructors' : 'institutions'
    if (progressTab === wantTab) return
    const next = new URLSearchParams(searchParams)
    next.set(TAB_PARAM, wantTab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, activeLnb, progressTab, searchParams, setSearchParams, programId])

  // 학교 상세 뷰 탭(schoolTab) 유효성 — schoolId 있을 때만
  useEffect(() => {
    if (!open || !schoolIdFromUrl) return
    const raw = searchParams.get(SCHOOL_TAB_PARAM)
    if (raw && SCHOOL_DETAIL_TAB_KEYS_READONLY.includes(raw as SchoolDetailTabKey)) return
    const next = new URLSearchParams(searchParams)
    next.set(SCHOOL_TAB_PARAM, 'application')
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, schoolIdFromUrl, searchParams, setSearchParams, programId])

  const setLnb = (key: LnbKey, childTab?: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, key)
    if (key === 'info') {
      const tab = searchParams.get(TAB_PARAM)
      next.set(TAB_PARAM, tab && (TAB_KEYS as readonly string[]).includes(tab) ? tab : 'info')
    } else if (key === 'applicants') {
      const tab = childTab ?? searchParams.get(TAB_PARAM)
      next.set(
        TAB_PARAM,
        tab && ['institutions', 'instructors', 'volunteers'].includes(tab) ? tab : 'institutions'
      )
    } else if (key === 'progress') {
      const tab = childTab ?? searchParams.get(TAB_PARAM)
      const progressTabValue =
        tab && ['institutions', 'instructors', 'volunteers'].includes(tab) ? tab : 'institutions'
      next.set(TAB_PARAM, progressTabValue)
      if (progressTabValue === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
      else next.delete(SUB_TAB_PARAM)
    }
    setSearchParams(next, { replace: true })
  }

  const setApplicantsChild = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'applicants')
    next.set(TAB_PARAM, tab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }

  const setProgressChild = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'progress')
    next.set(TAB_PARAM, tab)
    if (tab === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
    else next.delete(SUB_TAB_PARAM)
    if (programId) next.set('programId', programId)
    next.delete(SCHOOL_ID_PARAM)
    setSearchParams(next, { replace: true })
  }

  const setSchoolId = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) {
      next.set(SCHOOL_ID_PARAM, id)
      next.set(SCHOOL_TAB_PARAM, 'application')
    } else {
      next.delete(SCHOOL_ID_PARAM)
      next.delete(SCHOOL_TAB_PARAM)
    }
    setSearchParams(next, { replace: true })
  }

  const setSchoolTab = (tab: SchoolDetailTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(SCHOOL_TAB_PARAM, tab)
    setSearchParams(next, { replace: true })
  }

  const applicantCloseHandlerRef = useRef<(() => boolean) | null>(null)

  const handleHeaderCloseClick = () => {
    if (schoolIdFromUrl) {
      setSchoolId(null)
      return
    }
    if (activeLnb === 'applicants' && applicantCloseHandlerRef.current?.()) {
      return
    }
    onClose()
  }

  const setActiveTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, key)
    next.delete(EDIT_PARAM)
    setSearchParams(next, { replace: true })
  }

  const setEditMode = (tab: TabKey | null) => {
    const next = new URLSearchParams(searchParams)
    if (tab) next.set(EDIT_PARAM, tab)
    else next.delete(EDIT_PARAM)
    setSearchParams(next, { replace: true })
  }

  const displayProgram = useMemo(() => detailProgram ?? program ?? null, [detailProgram, program])
  const [schoolDetailTitle, setSchoolDetailTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolIdFromUrl) setSchoolDetailTitle(null)
  }, [schoolIdFromUrl])

  const title =
    schoolDetailTitle != null && displayProgram
      ? `${displayProgram.title}_${schoolDetailTitle}`
      : (displayProgram?.title ?? '프로그램 상세')

  const isEditModeInfo = activeTab === 'info' && editTab === 'info' && !!displayProgram
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
                message.success(MESSAGES.success.programUpdated)
                setEditMode(null)
              } catch {
                message.error(MESSAGES.error.update)
              }
            }
          : undefined,
    })

  const isEditModeInstitutions =
    activeTab === 'institutions' && editTab === 'institutions' && !!displayProgram
  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstitutions,
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
              message.success(MESSAGES.success.programUpdated)
              setEditMode(null)
            } catch {
              message.error(MESSAGES.error.update)
            }
          }
        : undefined,
  })

  const isEditModeInstructors =
    activeTab === 'instructors' && editTab === 'instructors' && !!displayProgram
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
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              message.success(MESSAGES.success.programUpdated)
              setEditMode(null)
            } catch {
              message.error(MESSAGES.error.update)
            }
          }
        : undefined,
  })

  const handleInfoEdit = () => {
    if (activeTab === 'info' && displayProgram) {
      infoResetToProgram()
      setEditMode('info')
      return
    }
    if (activeTab === 'institutions' && displayProgram) {
      institutionsResetToProgram()
      setEditMode('institutions')
      return
    }
    if (activeTab === 'instructors' && displayProgram) {
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (activeTab === 'volunteers' && displayProgram) {
      volunteersResetToProgram()
      setEditMode('volunteers')
      return
    }
    if (displayProgram) {
      onClose()
      navigate(getProgramAdminDetailUrlFromPathname(displayProgram.id, location.pathname))
    }
  }

  const handleInfoCancelEdit = () => {
    infoResetToProgram()
    setEditMode(null)
  }

  const handleInfoSave = () => {
    if (displayProgram) infoTriggerSave()
  }

  const handleInstitutionsSave = () => {
    institutionsTriggerSave()
  }

  const handleInstitutionsCancelEdit = () => {
    institutionsResetToProgram()
    setEditMode(null)
  }

  const handleInstructorsCancelEdit = () => {
    instructorsResetToProgram()
    setEditMode(null)
  }

  const handleInstructorsSave = () => {
    instructorsTriggerSave()
  }

  const isEditModeVolunteers =
    activeTab === 'volunteers' && editTab === 'volunteers' && !!displayProgram
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
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              message.success(MESSAGES.success.programUpdated)
              setEditMode(null)
            } catch {
              message.error(MESSAGES.error.update)
            }
          }
        : undefined,
  })

  const handleVolunteersSave = () => {
    volunteersTriggerSave()
  }

  const handleVolunteersCancelEdit = () => {
    volunteersResetToProgram()
    setEditMode(null)
  }

  const handlePreview = () => {
    if (displayProgram) {
      window.open(
        getProgramAdminDetailUrlFromPathname(displayProgram.id, location.pathname),
        '_blank'
      )
    }
  }

  if (!open) return null

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="program-detail-fullpage-modal"
    >
      <div className="program-detail-fullpage-modal__layout">
        <DetailModalSidebar
          activeLnb={activeLnb}
          onSelectLnb={setLnb}
          applicantsExpanded={applicantsExpanded}
          onSelectApplicantsChild={setApplicantsChild}
          activeChildMenu={activeChildMenu}
          progressExpanded={progressExpanded}
          onSelectProgressChild={setProgressChild}
          activeProgressChild={activeProgressChild}
        />

        <div className="program-detail-fullpage-modal__main">
          <header className="program-detail-fullpage-modal__header">
            <h2 className="program-detail-fullpage-modal__title">{title}</h2>
            <button
              type="button"
              className="program-detail-fullpage-modal__close"
              onClick={handleHeaderCloseClick}
              aria-label={schoolIdFromUrl ? '목록으로' : '닫기'}
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="program-detail-fullpage-modal__content">
            {loading && !displayProgram ? (
              <div className="program-detail-fullpage-modal__loading">
                <Spin size="large" />
              </div>
            ) : displayProgram ? (
              <>
                {activeLnb === 'info' && (
                  <ProjectInfoDetailPanels
                    program={displayProgram}
                    sponsorName={sponsorName}
                    isBodyLoading={loading && !displayProgram}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    isEditModeInfo={isEditModeInfo}
                    infoForm={isEditModeInfo ? infoForm : undefined}
                    isEditModeInstitutions={isEditModeInstitutions}
                    institutionsForm={isEditModeInstitutions ? institutionsForm : undefined}
                    registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
                    isEditModeInstructors={isEditModeInstructors}
                    instructorsForm={isEditModeInstructors ? instructorsForm : undefined}
                    registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
                    isEditModeVolunteers={isEditModeVolunteers}
                    volunteersForm={isEditModeVolunteers ? volunteersForm : undefined}
                    registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
                    onInfoEdit={handleInfoEdit}
                    onInfoCancelEdit={handleInfoCancelEdit}
                    onInfoSave={handleInfoSave}
                    onInstitutionsSave={handleInstitutionsSave}
                    onInstitutionsCancelEdit={handleInstitutionsCancelEdit}
                    onInstructorsCancelEdit={handleInstructorsCancelEdit}
                    onInstructorsSave={handleInstructorsSave}
                    onVolunteersSave={handleVolunteersSave}
                    onVolunteersCancelEdit={handleVolunteersCancelEdit}
                    onPreview={handlePreview}
                  />
                )}

                {activeLnb === 'applicants' && (
                  <ApplicantDetails
                    menu={activeChildMenu}
                    onRegisterApplicantCloseHandler={fn => {
                      applicantCloseHandlerRef.current = fn
                    }}
                  />
                )}

                {activeLnb === 'managers' && displayProgram?.id && (
                  <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                    <ProgramManagersTab programId={displayProgram.id} />
                  </div>
                )}

                {activeLnb === 'progress' && (
                  <div className="program-detail-fullpage-modal__info-tab">
                    {activeProgressChild === 'institutions' && (
                      <ParticipatingInstitutionsSection
                        programId={displayProgram?.id}
                        program={displayProgram}
                        schoolIdFromUrl={schoolIdFromUrl}
                        schoolTabFromUrl={activeSchoolTab}
                        onSchoolTabChange={setSchoolTab}
                        onSchoolRowClick={row => setSchoolId(row.id)}
                        onClearSchoolId={() => setSchoolId(null)}
                        onSchoolDetailOpen={name => setSchoolDetailTitle(name)}
                        onSchoolDetailClose={() => setSchoolDetailTitle(null)}
                      />
                    )}
                    {activeProgressChild === 'instructors' && (
                      <ParticipatingInstructorsSection programId={displayProgram?.id} />
                    )}
                    {activeProgressChild === 'volunteers' && (
                      <div className="program-detail-fullpage-modal__progress-section">
                        <Typography.Title level={5}>참여 봉사자</Typography.Title>
                        <Typography.Text type="secondary">
                          참여 봉사자 목록 및 현황이 표시됩니다.
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}

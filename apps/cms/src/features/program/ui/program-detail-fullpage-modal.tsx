/**
 * 프로그램 상세 풀페이지 모달
 * 경제/일반 교육 프로그램 목록 테이블 행 클릭 시 노출.
 * 모달 내 LNB, 헤더 타이틀, 탭, 기본정보/커리큘럼/KPI 테이블 구성.
 */

import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography, message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useProgramDetailEditForm } from '../hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '../hooks/use-program-detail-info-save'
import { MESSAGES } from '@/shared/constants'
import { BasicInfoSection } from './basic-info-section'
import { CurriculumSection } from './curriculum-section'
import { ProgramKpiTargetSection } from './program-kpi-target-section'
import { ParticipantRecruitmentSection } from './participant-recruitment-section'
import { DetailInfoSection } from './detail-info-section'
import { InstructorRecruitmentSection } from './instructor-recruitment-section'
import { InstructorDetailInfoSection } from './instructor-detail-info-section'
import { VolunteerRecruitmentSection } from './volunteer-recruitment-section'
import { VolunteerDetailInfoSection } from './volunteer-detail-info-section'
import { ApplicantDetails } from './detail-modal/applicants-detail'
import type { Program } from '@/types/domain'
import {
  DetailModalSidebar,
  TAB_KEYS,
  TAB_LABELS,
  type TabKey,
  type LnbKey,
} from './detail-modal/detail-modal-sidebar'
import '@toast-ui/editor/dist/toastui-editor.css'
import './program-detail-info-tab.css'
import './program-detail-fullpage-modal.css'

export interface ProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
}

const TAB_PARAM = 'tab'
const EDIT_PARAM = 'edit'
const LNB_PARAM = 'lnb'

const LNB_KEYS_READONLY: readonly LnbKey[] = ['info', 'applicants', 'progress', 'managers']

function parseTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab && (TAB_KEYS as readonly string[]).includes(tab)) return tab as TabKey
  return 'info'
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
    activeLnb === 'applicants' ? parseTabFromSearch(searchParams) : ''

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
        tab && ['participants', 'instructors', 'volunteers'].includes(tab) ? tab : 'participants'
      )
    }
    setSearchParams(next, { replace: true })
  }

  const setApplicantsChild = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'applicants')
    next.set(TAB_PARAM, tab)
    setSearchParams(next, { replace: true })
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
  const title = displayProgram?.title ?? '프로그램 상세'

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

  const isEditModeParticipants =
    activeTab === 'participants' && editTab === 'participants' && !!displayProgram
  const participantsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeParticipants,
  })
  const {
    triggerSave: participantsTriggerSave,
    resetToProgram: participantsResetToProgram,
    registerGetAdditionalContentHtml: registerParticipantsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: participantsForm,
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
    if (activeTab === 'participants' && displayProgram) {
      participantsResetToProgram()
      setEditMode('participants')
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
      navigate(`/programs/${displayProgram.id}`)
    }
  }

  const handleInfoCancelEdit = () => {
    infoResetToProgram()
    setEditMode(null)
  }

  const handleInfoSave = () => {
    if (displayProgram) infoTriggerSave()
  }

  const handleParticipantsSave = () => {
    participantsTriggerSave()
  }

  const handleParticipantsCancelEdit = () => {
    participantsResetToProgram()
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
      window.open(`/programs/${displayProgram.id}`, '_blank')
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
        />

        <div className="program-detail-fullpage-modal__main">
          <header className="program-detail-fullpage-modal__header">
            <h2 className="program-detail-fullpage-modal__title">{title}</h2>
            <button
              type="button"
              className="program-detail-fullpage-modal__close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          {activeLnb === 'info' && (
            <div className="program-detail-fullpage-modal__tabs-row">
              <div className="program-detail-fullpage-modal__tabs">
                {TAB_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <span className="program-detail-fullpage-modal__tab-label">
                      {TAB_LABELS[key]}
                    </span>
                  </button>
                ))}
              </div>
              {displayProgram && (
                <div className="program-detail-fullpage-modal__header-actions">
                  {activeTab === 'info' ? (
                    <>
                      {isEditModeInfo && (
                        <AppButton variant="danger" size="large" onClick={handleInfoCancelEdit}>
                          수정 취소
                        </AppButton>
                      )}
                      <AppButton
                        variant="primary"
                        size="large"
                        onClick={isEditModeInfo ? handleInfoSave : handleInfoEdit}
                      >
                        {isEditModeInfo ? '수정사항 저장' : '정보 수정'}
                      </AppButton>
                    </>
                  ) : activeTab === 'participants' ? (
                    <>
                      {isEditModeParticipants && (
                        <AppButton
                          variant="danger"
                          size="large"
                          onClick={handleParticipantsCancelEdit}
                        >
                          수정 취소
                        </AppButton>
                      )}
                      <AppButton
                        variant="primary"
                        size="large"
                        onClick={isEditModeParticipants ? handleParticipantsSave : handleInfoEdit}
                      >
                        {isEditModeParticipants ? '수정사항 저장' : '정보 수정'}
                      </AppButton>
                    </>
                  ) : activeTab === 'volunteers' ? (
                    <>
                      {isEditModeVolunteers && (
                        <AppButton
                          variant="danger"
                          size="large"
                          onClick={handleVolunteersCancelEdit}
                        >
                          수정 취소
                        </AppButton>
                      )}
                      <AppButton
                        variant="primary"
                        size="large"
                        onClick={isEditModeVolunteers ? handleVolunteersSave : handleInfoEdit}
                      >
                        {isEditModeVolunteers ? '수정사항 저장' : '정보 수정'}
                      </AppButton>
                    </>
                  ) : activeTab === 'instructors' ? (
                    <>
                      {isEditModeInstructors && (
                        <AppButton
                          variant="danger"
                          size="large"
                          onClick={handleInstructorsCancelEdit}
                        >
                          수정 취소
                        </AppButton>
                      )}
                      <AppButton
                        variant="primary"
                        size="large"
                        onClick={isEditModeInstructors ? handleInstructorsSave : handleInfoEdit}
                      >
                        {isEditModeInstructors ? '수정사항 저장' : '정보 수정'}
                      </AppButton>
                    </>
                  ) : null}
                  <AppButton variant="primary" size="large" onClick={handlePreview}>
                    프로그램 상세 미리보기
                  </AppButton>
                </div>
              )}
            </div>
          )}

          <div className="program-detail-fullpage-modal__content">
            {loading && !displayProgram ? (
              <div className="program-detail-fullpage-modal__loading">
                <Spin size="large" />
              </div>
            ) : displayProgram ? (
              <>
                {activeLnb === 'info' && (
                  <>
                    {activeTab === 'info' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <BasicInfoSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                          createdByName={displayProgram.createdByName}
                          updatedByName={displayProgram.updatedByName}
                          lifecycleStatus={displayProgram.lifecycleStatus ?? undefined}
                          isEditMode={isEditModeInfo}
                          form={isEditModeInfo ? infoForm : undefined}
                          displayMode="commonInfo"
                        />
                        <CurriculumSection
                          program={displayProgram}
                          isEditMode={isEditModeInfo}
                          form={isEditModeInfo ? infoForm : undefined}
                        />
                        <ProgramKpiTargetSection
                          programId={displayProgram.id}
                          isEditMode={isEditModeInfo}
                          form={isEditModeInfo ? infoForm : undefined}
                        />
                      </div>
                    )}
                    {activeTab === 'participants' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <ParticipantRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                          isEditMode={isEditModeParticipants}
                          form={isEditModeParticipants ? participantsForm : undefined}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <DetailInfoSection
                            program={displayProgram}
                            isEditMode={isEditModeParticipants}
                            form={isEditModeParticipants ? participantsForm : undefined}
                            onRegisterGetAdditionalContentHtml={registerParticipantsAdditionalHtml}
                            showThumbnail
                          />
                        </div>
                      </div>
                    )}
                    {activeTab === 'instructors' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <InstructorRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                          isEditMode={isEditModeInstructors}
                          form={isEditModeInstructors ? instructorsForm : undefined}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <InstructorDetailInfoSection
                            program={displayProgram}
                            isEditMode={isEditModeInstructors}
                            form={isEditModeInstructors ? instructorsForm : undefined}
                            onRegisterGetAdditionalContentHtml={registerInstructorsAdditionalHtml}
                          />
                        </div>
                      </div>
                    )}
                    {activeTab === 'volunteers' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <VolunteerRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                          isEditMode={isEditModeVolunteers}
                          form={isEditModeVolunteers ? volunteersForm : undefined}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <VolunteerDetailInfoSection
                            program={displayProgram}
                            isEditMode={isEditModeVolunteers}
                            form={isEditModeVolunteers ? volunteersForm : undefined}
                            onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeLnb === 'applicants' && <ApplicantDetails menu={activeChildMenu} />}
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

import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { MESSAGES } from '@/shared/constants/messages'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  LnbIconManagers,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { ProgramManagersTab } from '@/features/program/general/ui/detail-modal/managers/program-managers-tab'
import { LnbIconGeminiInstitutionApplications } from './gemini-recruitment-detail-lnb-icons'
import { useGeminiRecruitmentInfoEdit } from '../../hooks/use-gemini-recruitment-info-edit'
import { useToday } from '../../hooks/use-today'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import { detailToAddFormSnapshot } from '../../model/recruitment/info-edit-draft'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  parseGeminiRecruitmentDetailLnb,
  type GeminiRecruitmentDetailLnbKey,
} from '../../lib/recruitment/detail-url'
import { GeminiRecruitmentAddPreviewModal } from '../recruitment/add-preview-modal'
import { GeminiRecruitmentInfoTab } from './recruitment-info-tab'
import { GeminiInstitutionApplicationTab } from './institution-application-tab'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './fullpage-modal.css'

const SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  { key: 'info', label: '프로그램 모집 정보', icon: <LnbIconProjectInfo /> },
  {
    key: 'institutions',
    label: '기관 신청 목록',
    icon: <LnbIconGeminiInstitutionApplications />,
  },
  { key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> },
]

export function GeminiRecruitmentDetailFullPageModal({
  recruitmentId,
  onClose,
}: {
  recruitmentId: string
  onClose: () => void
}) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayKey = useToday()
  const activeLnb = parseGeminiRecruitmentDetailLnb(searchParams.get(GEMINI_RECRUITMENT_LNB_PARAM))
  const [previewOpen, setPreviewOpen] = useState(false)

  const {
    detail,
    displayDetail: resolvedDetail,
    isEditMode: isEditModeInfo,
    draft: infoDraft,
    patchDraft,
    handleEdit: handleInfoEdit,
    handleSave: handleInfoSave,
    editor: infoEditor,
    editorMinHeight: infoEditorMinHeight,
  } = useGeminiRecruitmentInfoEdit(recruitmentId, todayKey)

  const previewSnapshot =
    resolvedDetail != null ? detailToAddFormSnapshot(resolvedDetail) : null

  const setActiveLnb = useCallback(
    (lnb: GeminiRecruitmentDetailLnbKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (lnb === 'info') {
            next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          } else {
            next.set(GEMINI_RECRUITMENT_LNB_PARAM, lnb)
            next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (key === 'info' || key === 'institutions' || key === 'managers') {
        setActiveLnb(key)
      }
    },
    [setActiveLnb]
  )

  const handlePreview = useCallback(() => {
    setPreviewOpen(true)
  }, [])

  const handleInfoSaveClick = useCallback(() => {
    if (!isEditModeInfo || infoDraft == null) return
    handleInfoSave()
    showAlert({
      title: '안내',
      content: MESSAGES.success.saved,
    })
  }, [handleInfoSave, infoDraft, isEditModeInfo, showAlert])

  const open = Boolean(recruitmentId)

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={resolvedDetail?.title ?? detail?.title ?? '모집 공고 상세'}
        className="program-detail-fullpage-modal gemini-recruitment-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="찾아가는 연수 상세 메뉴"
            items={SIDEBAR_ITEMS}
            activeKey={activeLnb}
            expandedGroupKeys={[]}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={() => undefined}
          />
        }
      >
        {!resolvedDetail ? (
          <Typography.Text type="secondary">모집 공고 정보를 찾을 수 없습니다.</Typography.Text>
        ) : (
          <>
            {activeLnb === 'info' ? (
              <>
                <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                  {canWrite ? (
                    <CmsButton
                      type="button"
                      variant="secondary"
                      size="large"
                      width={160}
                      onClick={resolveProgramEditInfoClick(isEditModeInfo, {
                        onEnterEdit: handleInfoEdit,
                        onSaveEdit: handleInfoSaveClick,
                      })}
                    >
                      {PROGRAM_EDIT_INFO_BUTTON_LABEL}
                    </CmsButton>
                  ) : null}
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="large"
                    className="program-detail-fullpage-modal__program-preview-btn"
                    onClick={handlePreview}
                  >
                    미리보기
                  </CmsButton>
                </div>
                <GeminiRecruitmentInfoTab
                  detail={resolvedDetail}
                  todayKey={todayKey}
                  isEditMode={isEditModeInfo}
                  draft={infoDraft}
                  onDraftChange={patchDraft}
                  editor={infoEditor}
                  editorMinHeight={infoEditorMinHeight}
                />
              </>
            ) : activeLnb === 'institutions' ? (
              <GeminiInstitutionApplicationTab />
            ) : (
              <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                <ProgramManagersTab programId={recruitmentId} />
              </div>
            )}
          </>
        )}
      </DetailFullPageModal>
      <GeminiRecruitmentAddPreviewModal
        open={previewOpen}
        snapshot={previewSnapshot}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

export function useGeminiRecruitmentDetailUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recruitmentId = searchParams.get(GEMINI_RECRUITMENT_ID_PARAM)?.trim() || null

  const openDetail = useCallback(
    (id: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(GEMINI_RECRUITMENT_ID_PARAM, id)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_RECRUITMENT_ID_PARAM)
        next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { recruitmentId, openDetail, closeDetail }
}

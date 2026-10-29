import { useCallback, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import {
  CmsButton,
  DeleteGuideModal,
  showDeleteCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'
import { ProgramDetailLnbDeleteButton } from '@/features/program/shared/ui/program-detail/lnb-delete-button'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  LnbIconManagers,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { ProgramManagersTab } from '@/features/program/general/ui/detail-modal/managers/program-managers-tab'
import { LnbIconGeminiInstitutionApplications } from './gemini-recruitment-detail-lnb-icons'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { geminiVisitingTrainingQueryKeys } from '../../api/visiting-training/query-keys'
import { useGeminiRecruitmentInfoEdit } from '../../hooks/use-gemini-recruitment-info-edit'
import {
  geminiRecruitmentDeleteBlocked,
  resolveGeminiDeleteBlockedModalCopy,
  resolveGeminiDeleteGuideModalCopy,
} from '../../lib/delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { useToday } from '../../hooks/use-today'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import {
  applyInfoEditDraft,
  detailToAddFormSnapshot,
} from '../../model/recruitment/info-edit-draft'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  parseGeminiRecruitmentDetailLnb,
  type GeminiRecruitmentDetailLnbKey,
} from '../../lib/recruitment/detail-url'
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
} from '../../lib/approved/detail-url'
import { formatGeminiRecruitmentSaveError } from '../../lib/recruitment/mutation-error'
import {
  canGeminiRecruitmentInfoEdit,
  getGeminiRecruitmentInfoEditBlockedAlertMessage,
  getGeminiRecruitmentInfoEditBlockedAlertTitle,
} from '../../lib/recruitment/info-edit-policy'
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

const VISITING_TRAINING_TAB_PARAM = 'tab'

const RECRUITMENT_DETAIL_QUERY_SWEEP = [
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  GEMINI_RECRUITMENT_ADD_PARAM,
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  VISITING_TRAINING_TAB_PARAM,
] as const

export function GeminiRecruitmentDetailFullPageModal({
  recruitmentId,
  onClose,
}: {
  recruitmentId: string
  onClose: () => void
}) {
  const location = useLocation()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayKey = useToday()
  const activeLnb = parseGeminiRecruitmentDetailLnb(searchParams.get(GEMINI_RECRUITMENT_LNB_PARAM))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedCopy, setDeleteBlockedCopy] = useState({ title: '', description: '' })
  const queryClient = useQueryClient()
  const activeLnbItem =
    SIDEBAR_ITEMS.find(item => item.key === activeLnb) ?? SIDEBAR_ITEMS[0]

  const {
    detail,
    isEditMode: isEditModeInfo,
    draft: infoDraft,
    patchDraft,
    handleEdit: handleInfoEdit,
    handleCancel: handleInfoCancel,
    handleSave: handleInfoSave,
    applyDevAutofill,
    registerRichTextGetter,
    overlayRichText,
    isDetailFetching,
  } = useGeminiRecruitmentInfoEdit(recruitmentId, todayKey)

  // 수정 중 타이핑으로 breadcrumb/title/preview 를 매 키마다 흔들지 않는다.
  // 공고명은 blur(defer commit) 후 draft에 반영되면 그때 갱신.
  const detailTitle = infoDraft?.title ?? detail?.title ?? '모집 공고 상세'

  const previewSnapshot = useMemo(() => {
    if (!previewOpen || detail == null) return null
    const source =
      isEditModeInfo && infoDraft != null
        ? applyInfoEditDraft(detail, overlayRichText(infoDraft))
        : detail
    return detailToAddFormSnapshot(source)
  }, [detail, infoDraft, isEditModeInfo, overlayRichText, previewOpen])

  const headerBreadcrumbItems = useMemo(() => {
    const listParams = buildSearchParams(searchParams, {
      delete: [...RECRUITMENT_DETAIL_QUERY_SWEEP],
    })
    const items = [makeBreadcrumbItem('모집 공고', location.pathname, listParams)]

    if (!detail) {
      items.push({ label: '모집 공고 상세' })
      return items
    }

    const detailParams = buildSearchParams(searchParams, {
      delete: [
        GEMINI_RECRUITMENT_LNB_PARAM,
        GEMINI_RECRUITMENT_EDIT_PARAM,
        GEMINI_APPROVED_TRAINING_ID_PARAM,
        GEMINI_APPROVED_TRAINING_LNB_PARAM,
        VISITING_TRAINING_TAB_PARAM,
      ],
      set: { [GEMINI_RECRUITMENT_ID_PARAM]: recruitmentId },
    })

    if (activeLnb === 'info') {
      items.push({ label: detailTitle })
      return items
    }

    items.push(makeBreadcrumbItem(detailTitle, location.pathname, detailParams))
    items.push({ label: activeLnbItem.label })
    return items
  }, [
    activeLnb,
    activeLnbItem.label,
    detail,
    detailTitle,
    location.pathname,
    recruitmentId,
    searchParams,
  ])

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
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setPreviewOpen(true)
  }, [])

  const handleInfoEditClick = useCallback(() => {
    if (!canGeminiRecruitmentInfoEdit(detail?.applicationPeriodStart)) {
      void showAlert({
        title: getGeminiRecruitmentInfoEditBlockedAlertTitle(),
        content: getGeminiRecruitmentInfoEditBlockedAlertMessage(),
      })
      return
    }
    handleInfoEdit()
  }, [detail?.applicationPeriodStart, handleInfoEdit, showAlert])

  const handleInfoSaveClick = useCallback(async () => {
    if (!isEditModeInfo || infoDraft == null) return
    if (!canGeminiRecruitmentInfoEdit(detail?.applicationPeriodStart)) {
      void showAlert({
        title: getGeminiRecruitmentInfoEditBlockedAlertTitle(),
        content: getGeminiRecruitmentInfoEditBlockedAlertMessage(),
      })
      handleInfoCancel()
      return
    }
    // deferred text commit flush — blur 전에 저장하면 마지막 키가 빠질 수 있음
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    try {
      await handleInfoSave()
      showUpdateCompletedAlert()
    } catch (error) {
      showAlert({
        title: '안내',
        content: formatGeminiRecruitmentSaveError(error),
      })
    }
  }, [
    detail?.applicationPeriodStart,
    handleInfoCancel,
    handleInfoSave,
    infoDraft,
    isEditModeInfo,
    showAlert,
  ])

  const handleDeleteClick = useCallback(() => {
    if (detail == null) return
    if (geminiRecruitmentDeleteBlocked(detail)) {
      setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('공고', 1))
      setDeleteBlockedOpen(true)
      return
    }
    setDeleteModalOpen(true)
  }, [detail])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await geminiRecruitmentService.delete([recruitmentId])
      setDeleteModalOpen(false)
      onClose()
      void queryClient.invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.recruitmentList(),
      })
      showDeleteCompletedAlert()
    } catch {
      setDeleteModalOpen(false)
      showAlert({
        title: '안내',
        content: '모집 공고 등록/삭제를 처리하지 못했습니다.\n잠시 후 다시 시도해 주세요.',
      })
    }
  }, [onClose, queryClient, recruitmentId, showAlert])

  const open = Boolean(recruitmentId)
  const deleteGuide = resolveGeminiDeleteGuideModalCopy('공고', 1)

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={detailTitle}
        loading={isDetailFetching && !detail}
        error={
          !isDetailFetching && !detail
            ? '모집 공고 정보를 찾을 수 없습니다.'
            : null
        }
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className="program-detail-fullpage-modal gemini-recruitment-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="찾아가는 연수 상세 메뉴"
            items={SIDEBAR_ITEMS}
            activeKey={activeLnb}
            expandedGroupKeys={[]}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={() => undefined}
            footer={
              canWrite && detail ? (
                <ProgramDetailLnbDeleteButton onClick={handleDeleteClick} />
              ) : null
            }
          />
        }
      >
        {detail ? (
          <>
            {activeLnb === 'info' ? (
              <>
                <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                  {canWrite && isEditModeInfo ? (
                    <RegistrationDevAutofillButton onClick={applyDevAutofill} />
                  ) : null}
                  {canWrite ? (
                    <ProgramEditInfoActions
                      isEditing={isEditModeInfo}
                      idleVariant="secondary"
                      onEdit={handleInfoEditClick}
                      onCancel={handleInfoCancel}
                      onSave={handleInfoSaveClick}
                    />
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
                <div className="program-detail-fullpage-modal__info-tab">
                  <GeminiRecruitmentInfoTab
                    detail={detail}
                    todayKey={todayKey}
                    isEditMode={isEditModeInfo}
                    draft={infoDraft}
                    onDraftChange={patchDraft}
                    registerRichTextGetter={registerRichTextGetter}
                  />
                </div>
              </>
            ) : activeLnb === 'institutions' ? (
              <GeminiInstitutionApplicationTab recruitmentId={recruitmentId} />
            ) : (
              <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                <ProgramManagersTab programId={recruitmentId} />
              </div>
            )}
          </>
        ) : null}
      </DetailFullPageModal>
      <GeminiRecruitmentAddPreviewModal
        open={previewOpen}
        snapshot={previewSnapshot}
        onClose={() => setPreviewOpen(false)}
      />
      <DeleteGuideModal
        open={deleteModalOpen}
        title={deleteGuide.title}
        lines={deleteGuide.lines}
        confirmText="삭제"
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
      <DeleteBlockedGuideModal
        open={deleteBlockedOpen}
        onClose={() => setDeleteBlockedOpen(false)}
        title={deleteBlockedCopy.title}
        description={deleteBlockedCopy.description}
      />
    </>
  )
}

export { useGeminiRecruitmentDetailUrl } from './recruitment-detail-url'

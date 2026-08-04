import { useCallback, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Typography } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
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
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
} from '../../lib/approved/detail-url'
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
  const activeLnbItem =
    SIDEBAR_ITEMS.find(item => item.key === activeLnb) ?? SIDEBAR_ITEMS[0]

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
    isDetailFetching,
  } = useGeminiRecruitmentInfoEdit(recruitmentId, todayKey)

  const previewSnapshot =
    resolvedDetail != null ? detailToAddFormSnapshot(resolvedDetail) : null

  const detailTitle = resolvedDetail?.title ?? detail?.title ?? '모집 공고 상세'

  const headerBreadcrumbItems = useMemo(() => {
    const listParams = buildSearchParams(searchParams, {
      delete: [...RECRUITMENT_DETAIL_QUERY_SWEEP],
    })
    const items = [makeBreadcrumbItem('모집 공고', location.pathname, listParams)]

    if (!resolvedDetail) {
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
    detailTitle,
    location.pathname,
    recruitmentId,
    resolvedDetail,
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
    setPreviewOpen(true)
  }, [])

  const handleInfoEditClick = useCallback(() => {
    handleInfoEdit()
  }, [handleInfoEdit])

  const handleInfoSaveClick = useCallback(async () => {
    if (!isEditModeInfo || infoDraft == null) return
    try {
      await handleInfoSave()
      showAlert({
        title: '안내',
        content: MESSAGES.success.saved,
      })
    } catch {
      showAlert({
        title: '안내',
        content: '모집 정보 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
      })
    }
  }, [handleInfoSave, infoDraft, isEditModeInfo, showAlert])

  const open = Boolean(recruitmentId)

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={detailTitle}
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
          />
        }
      >
        {isDetailFetching && !resolvedDetail ? (
          <Typography.Text type="secondary">모집 공고 정보를 불러오는 중…</Typography.Text>
        ) : !resolvedDetail ? (
          <Typography.Text type="secondary">모집 공고 정보를 찾을 수 없습니다.</Typography.Text>
        ) : (
          <>
            {activeLnb === 'info' ? (
              <>
                <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                  {canWrite ? (
                    <CmsButton
                      type="button"
                      {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
                      onClick={resolveProgramEditInfoClick(isEditModeInfo, {
                        onEnterEdit: handleInfoEditClick,
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
              <GeminiInstitutionApplicationTab recruitmentId={recruitmentId} />
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

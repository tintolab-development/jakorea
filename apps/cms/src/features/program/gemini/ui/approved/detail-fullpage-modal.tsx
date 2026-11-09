import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { nextSearchParamsIfChanged } from '@/shared/lib/search-params-diff'
import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { sanitizeProgramPrivacyOverlay } from '@/features/program/shared/lib/program-my-assignment'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  revealGeminiApprovedTrainingPersonalInfo,
  type GeminiApprovedTrainingPrivacyUnmasked,
} from '../../api/visiting-training/service'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DeleteGuideModal, showDeleteCompletedAlert, useCmsAlert } from '@/shared/ui'
import { ProgramDetailLnbDeleteButton } from '@/features/program/shared/ui/program-detail/lnb-delete-button'
import { useDeleteGeminiApprovedTrainingsMutation } from '../../api/visiting-training/hooks'
import {
  GEMINI_APPROVED_TRAINING_DELETE_BLOCKED_CODE,
  resolveGeminiDeleteBlockedModalCopy,
  resolveGeminiDeleteGuideModalCopy,
} from '../../lib/delete-guide'
import { formatGeminiApiError } from '../../lib/gemini-api-error'
import { getGeneralProgramApiErrorCode } from '@/features/program/general/api/get-general-program-api-error'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { ProgramManagersTab } from '@/features/program/general/ui/detail-modal/managers/program-managers-tab'
import {
  LnbIconApplicants,
  LnbIconManagers,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { useGeminiApprovedTrainingDetail } from '../../hooks/use-gemini-approved-training-detail'
import { buildGeminiApprovedTrainingBreadcrumbItems } from '../../lib/approved/detail-breadcrumb'
import {
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM,
  parseGeminiApprovedTrainingDetailLnb,
  type GeminiApprovedTrainingDetailLnbKey,
} from '../../lib/approved/detail-url'
import { formatApprovedTrainingDeleteDisplayName } from '../../lib/approved/format-display'
import { GeminiApprovedTrainingDetailInstructorApplicationTab } from './detail-instructor-application-tab'
import { GeminiApprovedTrainingDetailProgramInfoTab } from './detail-program-info-tab'
import { useGeminiInstructorApplicationDetail } from '../../hooks/use-gemini-instructor-application-detail'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import '../detail/fullpage-modal.css'
import { ProgramDetailActionGuard } from '@/features/program/shared/ui/program-detail-action-guard'

const SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  { key: 'info', label: '프로그램 정보', icon: <LnbIconProjectInfo /> },
  { key: 'instructors', label: '강사 신청 목록', icon: <LnbIconApplicants /> },
  { key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> },
]

function GeminiApprovedTrainingDetailFullPageModalContent({
  approvedTrainingId,
  onClose,
}: {
  approvedTrainingId: string
  onClose: () => void
}) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLnb = parseGeminiApprovedTrainingDetailLnb(
    searchParams.get(GEMINI_APPROVED_TRAINING_LNB_PARAM)
  )
  const selectedInstructorApplicationId =
    activeLnb === 'instructors'
      ? searchParams.get(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM)?.trim() || null
      : null
  const { detail, isLoading } = useGeminiApprovedTrainingDetail(approvedTrainingId)
  const selectedInstructorApplicationDetail = useGeminiInstructorApplicationDetail(
    approvedTrainingId,
    selectedInstructorApplicationId
  )
  const { showAlert } = useCmsAlert()
  const [unmasked, setUnmasked] = useState<GeminiApprovedTrainingPrivacyUnmasked | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedCopy, setDeleteBlockedCopy] = useState({ title: '', description: '' })
  const { mutateAsync: deleteApprovedTrainings } = useDeleteGeminiApprovedTrainingsMutation()

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: detail?.programId,
    resolveProgramRole: () => resolveSessionProgramRole(detail?.programId),
    resolveAccessItem: () => detail?.managerNameKo || detail?.institutionName || '승인 연수 정보',
    revealPersonalInfo: reason => {
      if (!detail) return Promise.reject(new Error('승인 연수 상세가 없습니다.'))
      return revealGeminiApprovedTrainingPersonalInfo(detail, reason)
    },
    onPrivacyUnmasked: payload =>
      setUnmasked(
        sanitizeProgramPrivacyOverlay(
          detail?.programId ?? '',
          payload as GeminiApprovedTrainingPrivacyUnmasked
        )
      ),
    resetDeps: [approvedTrainingId],
    controlMode: 'headerStickyNoop',
  })

  useEffect(() => {
    if (!personalInfoRevealed) setUnmasked(null)
  }, [personalInfoRevealed])

  const displayedDetail = useMemo(() => {
    if (!detail || !unmasked || !personalInfoRevealed) return detail
    return {
      ...detail,
      managerNameKo: unmasked.teacherName ?? detail.managerNameKo,
      managerGender: unmasked.teacherGender ?? detail.managerGender,
      managerBirthDate: unmasked.teacherBirthDate ?? detail.managerBirthDate,
      managerContact: unmasked.teacherPhone ?? detail.managerContact,
      managerEmail: unmasked.teacherEmail ?? detail.managerEmail,
      managerHomeAddress: unmasked.teacherHomeAddress ?? detail.managerHomeAddress,
      managerAccountNumber: unmasked.teacherAccountNumber ?? '',
      managerPosition: '',
      managerSubject: '',
      instructor:
        unmasked.instructor == null
          ? detail.instructor
          : {
              ...detail.instructor,
              contact: unmasked.instructor.phone ?? detail.instructor.contact,
              email: unmasked.instructor.email ?? detail.instructor.email,
              region: unmasked.instructor.homeAddress ?? detail.instructor.region,
            },
    }
  }, [detail, personalInfoRevealed, unmasked])

  const detailTitle = detail ? `승인 연수 상세 (${detail.institutionName})` : '승인 연수 상세'

  const resolvedDetailTitle = selectedInstructorApplicationDetail.row
    ? `강사 신청 상세 (${selectedInstructorApplicationDetail.row.instructorName})`
    : detailTitle

  const headerBreadcrumbItems = useMemo(() => {
    return buildGeminiApprovedTrainingBreadcrumbItems({
      pathname: location.pathname,
      searchParams,
      approvedTrainingId,
      recruitmentTitle: detail?.recruitmentTitle ?? '승인 연수 상세',
      activeLnb,
      instructorApplicationName: selectedInstructorApplicationDetail.row?.instructorName,
      institutionName: detail?.institutionName,
    })
  }, [
    activeLnb,
    approvedTrainingId,
    detail?.institutionName,
    detail?.recruitmentTitle,
    location.pathname,
    searchParams,
    selectedInstructorApplicationDetail.row?.instructorName,
  ])

  const setActiveLnb = useCallback(
    (lnb: GeminiApprovedTrainingDetailLnbKey) => {
      const nextParams = nextSearchParamsIfChanged(
        prev => {
          const next = new URLSearchParams(prev)
          if (lnb === 'info') {
            next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
          } else {
            next.set(GEMINI_APPROVED_TRAINING_LNB_PARAM, lnb)
          }
          next.delete(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM)
          return next
        }
      )
      // LNB = 브레드크럼 단계 → push (같은 메뉴 재선택은 엔트리를 만들지 않음)
      if (nextParams) setSearchParams(nextParams, { replace: false })
    },
    [setSearchParams]
  )

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (key === 'info' || key === 'instructors' || key === 'managers') {
        setActiveLnb(key)
      }
    },
    [setActiveLnb]
  )

  const { toSearch: navigateToAncestorSearch } = useNavigateToAncestor()

  /** 강사 신청 상세 닫기 — 지나온 강사 목록 엔트리로 뒤로, 없으면 replace */
  const closeInstructorApplicationDetail = useCallback(() => {
    navigateToAncestorSearch(prev => {
      const next = new URLSearchParams(prev)
      next.delete(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM)
      return next
    })
  }, [navigateToAncestorSearch])

  const handleHeaderClose = useCallback(() => {
    if (selectedInstructorApplicationId) {
      closeInstructorApplicationDetail()
      return
    }
    onClose()
  }, [closeInstructorApplicationDetail, onClose, selectedInstructorApplicationId])

  const handleDeleteClick = useCallback(() => {
    setDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setDeleteModalOpen(false)
    try {
      const result = await deleteApprovedTrainings([approvedTrainingId])
      if (result.failureCount > 0) {
        if (
          result.failures.some(
            failure => failure.code === GEMINI_APPROVED_TRAINING_DELETE_BLOCKED_CODE
          )
        ) {
          setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('연수', 1))
          setDeleteBlockedOpen(true)
        } else {
          showAlert({
            title: '삭제 실패 안내',
            content:
              result.failures
                .map(failure => failure.message || failure.code)
                .filter((message): message is string => Boolean(message))
                .join('\n') || '연수 삭제를 완료하지 못했습니다.',
          })
        }
        return
      }
      onClose()
      showDeleteCompletedAlert()
    } catch (error) {
      if (getGeneralProgramApiErrorCode(error) === GEMINI_APPROVED_TRAINING_DELETE_BLOCKED_CODE) {
        setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('연수', 1))
        setDeleteBlockedOpen(true)
        return
      }
      showAlert({
        title: '삭제 실패 안내',
        content: formatGeminiApiError(
          error,
          '연수 삭제를 완료하지 못했습니다.\n잠시 후 다시 시도해 주세요.'
        ),
      })
    }
  }, [approvedTrainingId, deleteApprovedTrainings, onClose, showAlert])

  const deleteGuide = resolveGeminiDeleteGuideModalCopy(
    '연수',
    1,
    detail ? [formatApprovedTrainingDeleteDisplayName(detail)] : []
  )

  const detailBodyError = isLoading || detail ? null : '승인 연수 정보를 찾을 수 없습니다.'

  return (
    <DetailFullPageModal
      open={Boolean(approvedTrainingId)}
      onClose={onClose}
      onHeaderClose={handleHeaderClose}
      title={resolvedDetailTitle}
      loading={isLoading}
      error={detailBodyError}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      className="program-detail-fullpage-modal gemini-recruitment-detail-fullpage-modal"
      sidebar={
        <DetailModalSidebar
          navAriaLabel="승인 연수 상세 메뉴"
          items={SIDEBAR_ITEMS}
          activeKey={activeLnb}
          expandedGroupKeys={[]}
          onSelectTop={handleSidebarSelectTop}
          onSelectChild={() => undefined}
          footer={
            detail ? <ProgramDetailLnbDeleteButton onClick={handleDeleteClick} /> : null
          }
        />
      }
    >
      {detail && displayedDetail ? (
        <>
          {activeLnb === 'info' ? (
            <>
              <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                <PersonalInfoRevealButton
                  disabled={programPrivacyPending}
                  labelMode="stickyReveal"
                  revealed={personalInfoRevealed}
                  cmsSize="large"
                  onClick={openPersonalInfoRevealConfirm}
                />
              </div>
              <div className="program-detail-fullpage-modal__info-tab">
                <GeminiApprovedTrainingDetailProgramInfoTab
                  detail={displayedDetail}
                  personalInfoRevealed={personalInfoRevealed}
                />
              </div>
            </>
          ) : activeLnb === 'instructors' ? (
            <GeminiApprovedTrainingDetailInstructorApplicationTab
              approvedTrainingId={approvedTrainingId}
              trainingDetail={detail}
              selectedApplicationId={selectedInstructorApplicationId}
              selectedApplicationDetail={selectedInstructorApplicationDetail.row}
              selectedApplicationDetailLoading={selectedInstructorApplicationDetail.isLoading}
              selectedApplicationDetailError={selectedInstructorApplicationDetail.error}
              onOpenApplicationDetail={applicationId => {
                setSearchParams(
                  prev => {
                    const next = new URLSearchParams(prev)
                    next.set(GEMINI_APPROVED_TRAINING_LNB_PARAM, 'instructors')
                    next.set(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM, applicationId)
                    return next
                  },
                  { replace: false }
                )
              }}
              onCloseApplicationDetail={closeInstructorApplicationDetail}
            />
          ) : detail.programId ? (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              <ProgramManagersTab programId={detail.programId} maskSensitive />
            </div>
          ) : (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              담당자 조회를 위한 모집 프로그램 ID가 없습니다.
            </div>
          )}
        </>
      ) : null}
      {personalInfoRevealModal}
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
    </DetailFullPageModal>
  )
}

export { useGeminiApprovedTrainingDetailUrl } from './approved-training-detail-url'

/** 권한 설정 V1.2 — 상세 안의 쓰기·다운로드·개인정보 버튼은 노출하고, 권한이 없으면 클릭 시 접근 불가 안내. */
export function GeminiApprovedTrainingDetailFullPageModal(props: Parameters<typeof GeminiApprovedTrainingDetailFullPageModalContent>[0]) {
  return (
    <ProgramDetailActionGuard>
      <GeminiApprovedTrainingDetailFullPageModalContent {...props} />
    </ProgramDetailActionGuard>
  )
}

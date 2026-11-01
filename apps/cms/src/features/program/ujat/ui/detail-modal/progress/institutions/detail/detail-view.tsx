import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import { CmsButton, showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import {
  PROGRAM_MANAGER_ADD_COMPLETE_BODY,
  PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
} from '@/features/program/general/lib/program-manager-action-result-messages'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import { parseOrganizationApplicationIdFromSchoolId } from '@/features/program/general/api/adapters/program-post-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { useGeneralProgramPosts } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  postUjatEducationClassRemappings,
  postUjatEducationClasses,
} from '@/features/program/ujat/api/education-classes-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import {
  isUjatClassRemapInlineFormErrorCode,
  UJAT_CLASS_REMAP_ERROR_TITLES,
} from '@/features/program/ujat/lib/ujat-class-remap-api-error'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import {
  getApiErrorCode,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import { useUjatInstitutionTeacherPrivacyReveal } from '../../../application-institution/shared/use-institution-teacher-privacy-reveal'
import type { UjatEducationProgressInstitutionDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS,
  type UjatEducationProgressInstitutionDetail,
} from './types'
import type {
  UjatInstitutionApplicationGradeBlockDetail,
  UjatInstitutionApplicationTeacherContact,
} from '../../../application-institution/detail/detail-types'
import { UjatEducationProgressInstitutionApplicationTab } from './application-tab'
import {
  UjatEducationProgressInstitutionAssignmentHeaderActions,
  UjatEducationProgressInstitutionAssignmentTab,
  useInstitutionAssignmentTabModel,
} from './assignment-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { UjatEducationProgressChangeClassModal } from './change-class-modal'
import {
  applyClassChangesToGradeBlocks,
  applyClassChangesToSchedules,
  buildEducationClassRemappingRequest,
  resolveRegionKeyForInstitution,
  type ChangeClassConfirmPayload,
} from './change-class'
import {
  buildEducationClassAddRequest,
  gradeBlocksFromEducationClasses,
} from './add-class'
import type { UjatEducationProgressAddClassConfirmPayload } from './add-class-modal'
import {
  mergePendingClassesIntoGradeBlocks,
  removeClassesFromGradeBlocks,
} from './grade-blocks'
import './detail.css'

const CLASS_ADD_ERROR_TITLES: Record<string, string> = {
  UJAT_CLASS_ADD_DUPLICATE: '이미 등록된 학급입니다',
  UJAT_EDUCATION_CLASS_DUPLICATE: '이미 등록된 학급입니다',
  UJAT_CLASS_ADD_REVISION_CONFLICT: '학급 정보가 변경되었습니다',
  UJAT_EDUCATION_CLASS_REVISION_CONFLICT: '학급 정보가 변경되었습니다',
  ORGANIZATION_APPLICATION_NOT_FOUND: '기관 신청을 찾을 수 없습니다',
}


export function UjatEducationProgressInstitutionDetailView({
  detail,
  program,
  activeTab,
  onSelectTab,
}: {
  detail: UjatEducationProgressInstitutionDetail
  program: Program
  activeTab: UjatEducationProgressInstitutionDetailTab
  onSelectTab: (tab: UjatEducationProgressInstitutionDetailTab) => void
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const canWrite = useUjatCanWrite()
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [changeClassModalOpen, setChangeClassModalOpen] = useState(false)
  const [changeClassConfirming, setChangeClassConfirming] = useState(false)
  const [addClassConfirming, setAddClassConfirming] = useState(false)
  const [activityWithdrawn, setActivityWithdrawn] = useState(false)
  const [isApplicationInfoEditing, setIsApplicationInfoEditing] = useState(false)
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [adminComment, setAdminComment] = useState(() => detail.adminComment)
  const [adminCommentDraft, setAdminCommentDraft] = useState(() => detail.adminComment)
  const remoteReady = shouldUseUjatApplicationsRemoteApi()
  const applicationNumericId = parseOrganizationApplicationIdFromSchoolId(detail.institutionId)
  const [addressDetail, setAddressDetail] = useState(() => detail.applicationDetail.addressDetail)
  const [addressDetailDraft, setAddressDetailDraft] = useState(
    () => detail.applicationDetail.addressDetail
  )
  const [teacherContact, setTeacherContact] = useState<UjatInstitutionApplicationTeacherContact>(
    () => detail.applicationDetail.teacherContact
  )
  const [teacherContactDraft, setTeacherContactDraft] =
    useState<UjatInstitutionApplicationTeacherContact>(() => detail.applicationDetail.teacherContact)
  const [assignmentDataRevision, setAssignmentDataRevision] = useState(0)
  const [gradeBlocks, setGradeBlocks] = useState<UjatInstitutionApplicationGradeBlockDetail[]>(
    () => detail.applicationDetail.gradeBlocks
  )

  useEffect(() => {
    setWithdrawConfirmOpen(false)
    setChangeClassModalOpen(false)
    setChangeClassConfirming(false)
    setAddClassConfirming(false)
    setActivityWithdrawn(false)
    setIsApplicationInfoEditing(false)
    setAdminCommentModalOpen(false)
    setAdminComment(detail.adminComment)
    setAdminCommentDraft(detail.adminComment)
    setAddressDetail(detail.applicationDetail.addressDetail)
    setAddressDetailDraft(detail.applicationDetail.addressDetail)
    setTeacherContact(detail.applicationDetail.teacherContact)
    setTeacherContactDraft(detail.applicationDetail.teacherContact)
    setAssignmentDataRevision(0)
    setGradeBlocks(detail.applicationDetail.gradeBlocks)
  }, [
    detail.adminComment,
    detail.institutionId,
    detail.half,
    detail.applicationDetail.addressDetail,
    detail.applicationDetail.gradeBlocks,
    detail.applicationDetail.teacherContact,
  ])

  const detailWithGradeBlocks = useMemo(
    (): UjatEducationProgressInstitutionDetail => ({
      ...detail,
      adminComment,
      applicationDetail: {
        ...detail.applicationDetail,
        addressDetail,
        teacherContact,
        gradeBlocks,
      },
    }),
    [addressDetail, adminComment, detail, gradeBlocks, teacherContact]
  )

  const assignmentTabModel = useInstitutionAssignmentTabModel({
    detail: detailWithGradeBlocks,
    programId: program.id,
    dataRevision: assignmentDataRevision,
  })

  const {
    posts: remotePosts,
    files: remotePostFiles,
    loading: postsLoading,
    isRemoteDataSource: postsRemote,
    invalidatePosts,
    removeDeletedPost,
  } = useGeneralProgramPosts(program.id)
  const postsForTab = useMemo(() => (postsRemote ? remotePosts : null), [postsRemote, remotePosts])
  const filesForTab = useMemo(
    () => (postsRemote ? remotePostFiles : null),
    [postsRemote, remotePostFiles]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = useUjatInstitutionTeacherPrivacyReveal({
    institutionId: detail.institutionId,
    programId: program.id,
    accessItemLabel: `${detail.institutionName} 참여 기관 신청 정보`,
  })

  const tabKeys = useMemo(
    () =>
      Object.keys(
        UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS
      ) as UjatEducationProgressInstitutionDetailTab[],
    []
  )

  const withdrawScheduleOptions = useMemo(
    () =>
      detail.confirmedScheduleRows.map(row => ({
        value: row.id,
        label: row.dateDisplay,
      })),
    [detail.confirmedScheduleRows]
  )

  const handleRequestWithdraw = useCallback(() => {
    if (activityWithdrawn) return
    setWithdrawConfirmOpen(true)
  }, [activityWithdrawn])

  const handleCancelWithdraw = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const handleConfirmWithdraw = useCallback(
    (_payload: UjatEducationProgressActivityWithdrawPayload) => {
      setActivityWithdrawn(true)
      setWithdrawConfirmOpen(false)
      showAlert({
        title: '활동 포기',
        content: `${detail.institutionName} 기관이 활동 포기 처리되었습니다.`,
      })
    },
    [detail.institutionName, showAlert]
  )

  const changeClassRemoteScheduleRows = useMemo(
    () =>
      assignmentTabModel.sections.map(section => ({
        id: section.scheduleId,
        dateDisplay: section.dateDisplay,
        isoDate: section.isoDate,
        numericScheduleId: section.numericScheduleId,
      })),
    [assignmentTabModel.sections]
  )

  const invalidateAfterClassRemap = useCallback(
    async (programId: string, institutionId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            ...ujatQueryKeys.execution(),
            'institution-assignment',
            programId,
            institutionId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.allocationMatrixRoot(programId),
        }),
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.partnerAssignmentsRoot(programId),
        }),
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.organizationDetail(programId, institutionId),
        }),
        queryClient.invalidateQueries({
          queryKey: [
            ...ujatQueryKeys.organizationDetail(programId, institutionId),
            'education-classes',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ujatQueryKeys.organizationTemporarySchedule(programId, institutionId),
        }),
      ])
    },
    [queryClient]
  )

  const handleConfirmAddClasses = useCallback(
    async (payload: UjatEducationProgressAddClassConfirmPayload) => {
      const programId = String(program.id)
      const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)

      if (!remoteEnabled) {
        setGradeBlocks(prev =>
          mergePendingClassesIntoGradeBlocks(
            removeClassesFromGradeBlocks(prev, payload.removed),
            payload.added
          )
        )
        showAlert({
          title: PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
          content: PROGRAM_MANAGER_ADD_COMPLETE_BODY,
        })
        return
      }

      const body = buildEducationClassAddRequest(payload.added, payload.expectedRevision)
      if (!body) {
        showAlert({
          title: '학급 추가 실패',
          content: '추가할 학급 정보를 확인해 주세요.',
        })
        throw new Error('empty education-class add payload')
      }

      setAddClassConfirming(true)
      try {
        const response = await postUjatEducationClasses(
          programId,
          detail.institutionId,
          body
        )
        const remoteClasses = response.classes ?? []
        // 응답 classes 가 SSOT. 비어 있으면 invent 금지 — invalidate 후 재조회에 맡김.
        if (remoteClasses.length > 0) {
          setGradeBlocks(gradeBlocksFromEducationClasses(remoteClasses))
        }
        setAssignmentDataRevision(revision => revision + 1)
        await invalidateAfterClassRemap(programId, detail.institutionId)
        showAlert({
          title: PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
          content:
            remoteClasses.length > 0
              ? PROGRAM_MANAGER_ADD_COMPLETE_BODY
              : '저장 요청은 완료되었습니다. 응답 classes가 비어 있어 목록을 다시 불러옵니다. 여전히 비면 서버 동기화를 확인해 주세요.',
        })
      } catch (error) {
        const code = getApiErrorCode(error)
        showAlert({
          title: (code && CLASS_ADD_ERROR_TITLES[code]) || '학급 추가 실패',
          content: readApiErrorAlertMessage(error, '교육 학급을 추가하지 못했습니다.'),
        })
        if (
          code === 'UJAT_CLASS_ADD_REVISION_CONFLICT' ||
          code === 'UJAT_EDUCATION_CLASS_REVISION_CONFLICT'
        ) {
          await invalidateAfterClassRemap(programId, detail.institutionId)
        }
        throw error
      } finally {
        setAddClassConfirming(false)
      }
    },
    [detail.institutionId, invalidateAfterClassRemap, program.id, showAlert]
  )

  const handleConfirmChangeClass = useCallback(
    async (payload: ChangeClassConfirmPayload) => {
      const programId = String(program.id)
      const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)

      if (remoteEnabled) {
        const body = buildEducationClassRemappingRequest(payload)
        if (!body) {
          showAlert({
            title: '학급 변경 실패',
            content: '교육 학급 버전 정보를 확인한 뒤 다시 시도해 주세요.',
          })
          return
        }
        if (body.applyFromScheduleId == null && !body.applyFromDate) {
          showAlert({
            title: '학급 변경 실패',
            content: '변경사항 적용 일정을 선택해 주세요.',
          })
          return
        }

        setChangeClassConfirming(true)
        try {
          const response = await postUjatEducationClassRemappings(
            programId,
            detail.institutionId,
            body
          )
          const remoteClasses = response.classes ?? []
          // 응답 classes 가 SSOT. 비면 invent 금지 — invalidate 재조회에 맡김.
          if (remoteClasses.length > 0) {
            setGradeBlocks(gradeBlocksFromEducationClasses(remoteClasses))
          }
          setAssignmentDataRevision(revision => revision + 1)
          setChangeClassModalOpen(false)
          await invalidateAfterClassRemap(programId, detail.institutionId)
          showAlert({
            title: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
            content: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
          })
        } catch (error) {
          const code = getApiErrorCode(error)
          if (code === 'UJAT_CLASS_REMAP_REVISION_CONFLICT') {
            await invalidateAfterClassRemap(programId, detail.institutionId)
            showAlert({
              title: UJAT_CLASS_REMAP_ERROR_TITLES.UJAT_CLASS_REMAP_REVISION_CONFLICT,
              content:
                '다른 작업으로 학급 정보가 변경되었습니다. 교육 학급 목록을 다시 불러왔습니다. 기존 학급을 다시 선택한 뒤 저장해 주세요.',
            })
          } else if (isUjatClassRemapInlineFormErrorCode(code)) {
            throw error
          } else {
            showAlert({
              title: (code && UJAT_CLASS_REMAP_ERROR_TITLES[code]) || '학급 변경 실패',
              content: readApiErrorAlertMessage(
                error,
                '교육 학년 및 학급 변경을 저장하지 못했습니다.'
              ),
            })
          }
        } finally {
          setChangeClassConfirming(false)
        }
        return
      }

      const regionKey = resolveRegionKeyForInstitution(detail.institutionId)
      if (regionKey) {
        applyClassChangesToSchedules(detail, regionKey, payload)
      }
      setGradeBlocks(prev => applyClassChangesToGradeBlocks(prev, payload.mappings))
      setAssignmentDataRevision(revision => revision + 1)
      setChangeClassModalOpen(false)
      showAlert({
        title: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
        content: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
      })
    },
    [detail, invalidateAfterClassRemap, program.id, showAlert]
  )

  const handleApplicationInfoButtonClick = useCallback(() => {
    if (!isApplicationInfoEditing) {
      setAddressDetailDraft(addressDetail)
      setTeacherContactDraft(teacherContact)
      setIsApplicationInfoEditing(true)
      return
    }

    setAddressDetail(addressDetailDraft)
    setTeacherContact(teacherContactDraft)
    setIsApplicationInfoEditing(false)
    showUpdateCompletedAlert()
  }, [
    addressDetail,
    addressDetailDraft,
    isApplicationInfoEditing,
    teacherContact,
    teacherContactDraft,
  ])

  const handleApplicationInfoCancel = useCallback(() => {
    setAddressDetailDraft(addressDetail)
    setTeacherContactDraft(teacherContact)
    setIsApplicationInfoEditing(false)
  }, [addressDetail, teacherContact])

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(adminComment)
    setAdminCommentModalOpen(true)
  }, [adminComment, isApplicationInfoEditing])

  const handleAdminCommentSave = useCallback(async () => {
    if (applicationNumericId == null || !remoteReady) {
      showAlert({
        title: '저장 실패',
        content: '기관 신청 API가 활성화되지 않았거나 신청 ID가 올바르지 않습니다.',
      })
      return
    }
    setSavingComment(true)
    try {
      const result = await upsertAdminCommentByTargetRemote({
        targetType: 'ORGANIZATION_APPLICATION',
        targetId: applicationNumericId,
        screenCode: 'ORGANIZATION_APPLICATION',
        comment: adminCommentDraft,
      })
      const nextComment = result.commentText ?? ''
      setAdminComment(nextComment)
      setAdminCommentDraft(nextComment)
      setAdminCommentModalOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationComments(
          String(program.id),
          detail.institutionId
        ),
      })
      showAlert({
        title: '코멘트 저장',
        content: '관리자 코멘트가 저장되었습니다.',
      })
    } catch (error) {
      showAlert({
        title: '저장 실패',
        content: getGeneralProgramApiErrorMessage(error, '관리자 코멘트를 저장하지 못했습니다.'),
      })
    } finally {
      setSavingComment(false)
    }
  }, [
    adminCommentDraft,
    applicationNumericId,
    detail.institutionId,
    program.id,
    queryClient,
    remoteReady,
    showAlert,
  ])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  return (
    <div className="ujat-education-progress-institution-detail">
      <div className="program-detail-fullpage-modal__tabs-row ujat-education-progress-institution-detail__tabs-row">
        <div className="program-detail-fullpage-modal__tabs">
          {tabKeys.map(key => (
            <button
              key={key}
              type="button"
              className={`program-detail-fullpage-modal__tab ${
                activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''
              }`}
              onClick={() => onSelectTab(key)}
            >
              <span className="program-detail-fullpage-modal__tab-label">
                {UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS[key]}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            {!isApplicationInfoEditing && canWrite ? (
              <CmsButton
                type="button"
                variant="delete"
                size="h40"
                disabled={activityWithdrawn}
                onClick={handleRequestWithdraw} >
                활동 포기
              </CmsButton>
            ) : null}
            <ProgramEditInfoActions
              canWrite={canWrite}
              size="h40"
              isEditing={isApplicationInfoEditing}
              onEdit={handleApplicationInfoButtonClick}
              onCancel={handleApplicationInfoCancel}
              onSave={handleApplicationInfoButtonClick} />
            {!isApplicationInfoEditing ? (
              <>
                {canWrite ? (
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="h40"
                    onClick={handleAdminCommentEditEnter} >
                    코멘트 작성
                  </CmsButton>
                ) : null}
                <PersonalInfoRevealButton disabled={programPrivacyPending}
                  labelMode="stickyReveal"
                  revealed={personalInfoRevealed}
                  cmsVariant="primary"
                  cmsSize="h40"
                  onClick={openPersonalInfoRevealConfirm} />
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'assignment' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            <UjatEducationProgressInstitutionAssignmentHeaderActions
              onChangeClass={() => setChangeClassModalOpen(true)}
              onExcelDownload={() => {
                void assignmentTabModel.exportExcel()
              }}
              isExcelExporting={assignmentTabModel.isExporting}
            />
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            {canWrite ? (
            <CmsButton
              type="button"
              variant="primary"
              size="medium" className="ujat-education-progress-institution-detail__posts-register-btn"
              onClick={() => setPostWriteModalOpen(true)} >
              게시글 등록
            </CmsButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="program-detail-fullpage-modal__content">
        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <UjatEducationProgressInstitutionApplicationTab
              detail={detailWithGradeBlocks}
              programId={String(program.id)}
              personalInfoRevealed={personalInfoRevealed}
              gradeBlocks={gradeBlocks}
              onGradeBlocksChange={setGradeBlocks}
              isApplicationInfoEditing={isApplicationInfoEditing}
              addressDetailDraft={addressDetailDraft}
              onAddressDetailDraftChange={setAddressDetailDraft}
              teacherContactDraft={teacherContactDraft}
              onTeacherContactDraftChange={setTeacherContactDraft}
              isAdminCommentEditing={false}
              adminCommentDraft=""
              onAdminCommentDraftChange={() => {}}
              addClassConfirming={addClassConfirming}
              onConfirmAddClasses={handleConfirmAddClasses}
            />
          </div>
        ) : null}

        {activeTab === 'assignment' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <UjatEducationProgressInstitutionAssignmentTab model={assignmentTabModel} />
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="program-detail-fullpage-modal__info-tab ujat-education-progress-institution-detail__posts-tab-wrap">
            {postsLoading ? (
              <div className="page-content-loading" role="status">
                <Spin size="large" />
              </div>
            ) : (
              <EnrollmentProgramDetailPostsTab
                program={program}
                schoolId={detail.institutionId}
                showWriteButtonInSection={false}
                writeModalOpen={postWriteModalOpen}
                onWriteModalOpenChange={setPostWriteModalOpen}
                postsOverride={postsForTab}
                filesOverride={filesForTab}
                onPostWriteSuccess={() => {
                  void invalidatePosts()
                }}
                onPostDeleted={postId => {
                  void removeDeletedPost(postId)
                }}
              />
            )}
          </div>
        ) : null}
      </div>

      {personalInfoRevealModal}

      <UjatEducationProgressActivityWithdrawModal
        open={withdrawConfirmOpen}
        participantName={detail.institutionName}
        subjectKind="institution"
        scheduleOptions={withdrawScheduleOptions}
        onCancel={handleCancelWithdraw}
        onConfirm={handleConfirmWithdraw}
      />

      <UjatEducationProgressChangeClassModal
        open={changeClassModalOpen}
        programId={String(program.id)}
        half={detail.half}
        detail={detail}
        gradeBlocks={gradeBlocks}
        remoteScheduleRows={changeClassRemoteScheduleRows}
        confirming={changeClassConfirming}
        onCancel={() => {
          if (changeClassConfirming) return
          setChangeClassModalOpen(false)
        }}
        onConfirm={handleConfirmChangeClass}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        loading={savingComment}
        onChange={setAdminCommentDraft}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={() => {
          void handleAdminCommentSave()
        }}
      />
    </div>
  )
}

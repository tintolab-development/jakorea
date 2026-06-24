import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { InstitutionTeacherEdit } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { UjatInstitutionTeacherInfoValue } from '../../../application-institution/detail/detail-display'
import {
  ClassTimeTable,
  PipeSeparatedValues,
  renderCriminalRecordCheckRequest,
} from '../../../application-institution/shared/institution-detail-shared'
import {
  calculateGradeTextbookSupply,
  formatGradeTextbookSupplyDisplay,
  UJAT_EDUCATION_PROGRESS_TEXTBOOK_STATUS_LABELS,
} from './textbook'
import type { UjatEducationProgressInstitutionDetail } from './types'
import type {
  UjatInstitutionApplicationGradeBlockDetail,
  UjatInstitutionApplicationTeacherContact,
} from '../../../application-institution/detail/detail-types'
import { UjatEducationProgressAddClassModal } from './add-class-modal'
import {
  computeTotalClassCount,
  mergePendingClassesIntoGradeBlocks,
  removeClassesFromGradeBlocks,
} from './grade-blocks'
import type { UjatEducationProgressAddClassConfirmPayload } from './add-class-modal'
import './detail.css'

export function UjatEducationProgressInstitutionApplicationTab({
  detail,
  personalInfoRevealed,
  gradeBlocks,
  onGradeBlocksChange,
  isApplicationInfoEditing,
  addressDetailDraft,
  onAddressDetailDraftChange,
  teacherContactDraft,
  onTeacherContactDraftChange,
  isAdminCommentEditing,
  adminCommentDraft,
  onAdminCommentDraftChange,
}: {
  detail: UjatEducationProgressInstitutionDetail
  personalInfoRevealed: boolean
  gradeBlocks: UjatInstitutionApplicationGradeBlockDetail[]
  onGradeBlocksChange: (next: UjatInstitutionApplicationGradeBlockDetail[]) => void
  isApplicationInfoEditing: boolean
  addressDetailDraft: string
  onAddressDetailDraftChange: (next: string) => void
  teacherContactDraft: UjatInstitutionApplicationTeacherContact
  onTeacherContactDraftChange: (next: UjatInstitutionApplicationTeacherContact) => void
  isAdminCommentEditing: boolean
  adminCommentDraft: string
  onAdminCommentDraftChange: (next: string) => void
}) {
  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { applicationDetail } = detail
  const [addClassModalOpen, setAddClassModalOpen] = useState(false)

  useEffect(() => {
    setAddClassModalOpen(false)
  }, [detail.institutionId, detail.half])

  const currentTotalClassCount = useMemo(() => computeTotalClassCount(gradeBlocks), [gradeBlocks])

  const handleConfirmAddClasses = useCallback(
    ({ added, removed }: UjatEducationProgressAddClassConfirmPayload) => {
      onGradeBlocksChange(
        mergePendingClassesIntoGradeBlocks(
          removeClassesFromGradeBlocks(gradeBlocks, removed),
          added
        )
      )
      setAddClassModalOpen(false)
    },
    [gradeBlocks, onGradeBlocksChange]
  )

  return (
    <div className="ujat-education-progress-institution-detail__content">
      {showAdminCommentSection ? (
        <ApplicantAdminCommentSection
          adminComment={detail.adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
        />
      ) : null}

      <DetailInfoForm title="기본 정보" mode={isApplicationInfoEditing ? 'edit' : 'view'}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="참여 기관명" view={detail.institutionName} readOnlyDisplay />
          <DetailInfoForm.Field label="교육 지역" view={detail.educationRegion} readOnlyDisplay />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="기관 소재지"
            view={applicationDetail.address}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="상세 주소"
            view={applicationDetail.addressDetail || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={addressDetailDraft}
                placeholder="상세 주소를 입력해 주세요"
                onChange={event => onAddressDetailDraftChange(event.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="담당 교사 정보"
            fullRow
            view={
              <UjatInstitutionTeacherInfoValue
                contact={applicationDetail.teacherContact}
                revealed={personalInfoRevealed}
              />
            }
            edit={
              <InstitutionTeacherEdit
                name={teacherContactDraft.teacherName}
                phone={teacherContactDraft.tel}
                mobile={teacherContactDraft.mobile}
                email={teacherContactDraft.email}
                onChange={patch =>
                  onTeacherContactDraftChange({
                    ...teacherContactDraft,
                    teacherName: patch.teacherName ?? teacherContactDraft.teacherName,
                    tel: patch.teacherPhone ?? teacherContactDraft.tel,
                    mobile: patch.teacherMobile ?? teacherContactDraft.mobile,
                    email: patch.teacherEmail ?? teacherContactDraft.email,
                  })
                }
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기타 요청사항"
            fullRow
            view={applicationDetail.otherRequests || '-'}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <section aria-labelledby="ujat-education-progress-institution-grade-info-heading">
        <header className="detail-info-form__header">
          <div className="detail-info-form__header-lead">
            <h2
              id="ujat-education-progress-institution-grade-info-heading"
              className="detail-info-form__title"
            >
              교육 학년 별 정보
            </h2>
          </div>
          <div className="detail-info-form__header-trailing">
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              onClick={() => setAddClassModalOpen(true)}
            >
              학급 추가
            </CmsButton>
          </div>
        </header>
        <div className="ujat-education-progress-institution-detail__grade-info-stack">
          {gradeBlocks.map((block, blockIndex) => {
            const textbook = calculateGradeTextbookSupply(block)
            return (
              <DetailInfoForm
                key={`${block.gradeLabel}-${blockIndex}`}
                title={`${block.gradeLabel} (${block.classCount}학급)`}
                hideHeader
                mode="view"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label={`${block.gradeLabel} (${block.classCount}학급)`}
                    fullRow
                    view={
                      <PipeSeparatedValues
                        parts={block.classes.map(classRow => (
                          <span key={classRow.classNo}>
                            {classRow.classNo}반 : {classRow.studentCount}명
                          </span>
                        ))}
                      />
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="교재 정보"
                    fullRow
                    view={
                      <span className="ujat-education-progress-institution-detail__textbook-row">
                        <span>{formatGradeTextbookSupplyDisplay(textbook)}</span>
                        <span
                          className={`ujat-education-progress-institution-detail__textbook-badge ujat-education-progress-institution-detail__textbook-badge--${textbook.status}`}
                        >
                          {UJAT_EDUCATION_PROGRESS_TEXTBOOK_STATUS_LABELS[textbook.status]}
                        </span>
                      </span>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            )
          })}
        </div>
      </section>

      <DetailInfoForm title="학년 별 수업 시간" mode="view">
        <DetailInfoForm.Row type="custom">
          <ClassTimeTable rows={applicationDetail.classTimeRows} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="진행 교육 일정" mode="view">
        {detail.confirmedScheduleRows.length === 0 ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="교육 진행 일정" fullRow view="-" />
          </DetailInfoForm.Row>
        ) : (
          detail.confirmedScheduleRows.map(row => (
            <DetailInfoForm.Row key={row.id} type="single">
              <DetailInfoForm.Field
                label={row.dateDisplay}
                fullRow
                view={
                  <div className="ujat-education-progress-institution-detail__schedule-classes ujat-education-progress-institution-detail__schedule-classes--wrap">
                    {withProgramDetailTdDivider(row.classLabels)}
                  </div>
                }
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>

      <DetailInfoForm title="안내 사항" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="검색 기기 사용 가능 여부 (6학년)"
            fullRow
            view={detail.guidance.deviceAvailability}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대기 장소 안내"
            fullRow
            view={detail.guidance.waitingAreaGuide}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="잔여교재 배출 장소"
            fullRow
            view={detail.guidance.leftoverTextbookDisposal}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기타 특이사항 (주차, 전달사항 등)"
            fullRow
            view={detail.guidance.parkingAndNotes}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="간식 제공 가능 여부 (ABC초콜릿)"
            fullRow
            view={detail.guidance.snackAvailability}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="성범죄 경력 조회서 요청"
            fullRow
            view={renderCriminalRecordCheckRequest(detail.guidance.criminalRecordCheckRequest)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <UjatEducationProgressAddClassModal
        open={addClassModalOpen}
        currentTotalClassCount={currentTotalClassCount}
        existingGradeBlocks={gradeBlocks}
        onCancel={() => setAddClassModalOpen(false)}
        onConfirm={handleConfirmAddClasses}
      />
    </div>
  )
}

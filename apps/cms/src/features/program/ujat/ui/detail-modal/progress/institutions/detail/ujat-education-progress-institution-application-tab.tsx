import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  UjatInstitutionTeacherInfoValue,
} from '../../../application-institution/detail/detail-display'
import {
  ClassTimeTable,
  PipeSeparatedValues,
} from '../../../application-institution/shared/institution-detail-shared'
import {
  calculateGradeTextbookSupply,
  formatGradeTextbookSupplyDisplay,
  UJAT_EDUCATION_PROGRESS_TEXTBOOK_STATUS_LABELS,
} from './ujat-education-progress-institution-textbook'
import type { UjatEducationProgressInstitutionDetail } from './types'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import { UjatEducationProgressAddClassModal } from './ujat-education-progress-add-class-modal'
import {
  computeTotalClassCount,
  mergePendingClassesIntoGradeBlocks,
  removeClassesFromGradeBlocks,
} from './ujat-education-progress-grade-blocks'
import type { UjatEducationProgressAddClassConfirmPayload } from './ujat-education-progress-add-class-modal'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-education-progress-institution-detail.css'

function toTableRows(
  items: Array<{ key: string; label: string; children: ReactNode; span?: number }>
) {
  const rows: ReactNode[] = []
  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (item.span === 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td colSpan={3}>{item.children}</td>
        </tr>
      )
      i += 1
      continue
    }

    const next = items[i + 1]
    if (next && next.span !== 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td>{item.children}</td>
          <th>{next.label}</th>
          <td>{next.children}</td>
        </tr>
      )
      i += 2
      continue
    }

    rows.push(
      <tr key={item.key}>
        <th>{item.label}</th>
        <td colSpan={3}>{item.children}</td>
      </tr>
    )
    i += 1
  }
  return rows
}

export function UjatEducationProgressInstitutionApplicationTab({
  detail,
  personalInfoRevealed,
  gradeBlocks,
  onGradeBlocksChange,
}: {
  detail: UjatEducationProgressInstitutionDetail
  personalInfoRevealed: boolean
  gradeBlocks: UjatInstitutionApplicationGradeBlockDetail[]
  onGradeBlocksChange: (next: UjatInstitutionApplicationGradeBlockDetail[]) => void
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
        mergePendingClassesIntoGradeBlocks(removeClassesFromGradeBlocks(gradeBlocks, removed), added)
      )
      setAddClassModalOpen(false)
    },
    [gradeBlocks, onGradeBlocksChange]
  )

  const basicInfoItems = [
    { key: 'institutionName', label: '참여 기관명', children: detail.institutionName },
    { key: 'educationRegion', label: '교육 지역', children: detail.educationRegion },
    { key: 'address', label: '기관 소재지', children: applicationDetail.address },
    { key: 'addressDetail', label: '상세 주소', children: applicationDetail.addressDetail },
    {
      key: 'teacher',
      label: '담당 교사 정보',
      children: (
        <UjatInstitutionTeacherInfoValue
          contact={applicationDetail.teacherContact}
          revealed={personalInfoRevealed}
        />
      ),
      span: 2 as const,
    },
    {
      key: 'otherRequests',
      label: '기타 요청사항',
      children: applicationDetail.otherRequests || '-',
      span: 2 as const,
    },
  ]

  const guidanceItems = [
    {
      key: 'deviceAvailability',
      label: '검색 기기 사용 가능 여부 (6학년)',
      children: detail.guidance.deviceAvailability,
    },
    {
      key: 'waitingAreaGuide',
      label: '대기 장소 안내',
      children: detail.guidance.waitingAreaGuide,
    },
    {
      key: 'leftoverTextbookDisposal',
      label: '잔여교재 배출 장소',
      children: detail.guidance.leftoverTextbookDisposal,
    },
    {
      key: 'parkingAndNotes',
      label: '기타 특이사항 (주차, 전달사항 등)',
      children: detail.guidance.parkingAndNotes,
    },
    {
      key: 'snackAvailability',
      label: '간식 제공 가능 여부 (ABC초콜릿)',
      children: detail.guidance.snackAvailability,
    },
    {
      key: 'criminalRecordCheckRequest',
      label: '성범죄 경력 조회서 요청',
      children: detail.guidance.criminalRecordCheckRequest,
    },
  ]

  return (
    <div className="ujat-education-progress-institution-detail__content">
      {showAdminCommentSection ? (
        <div className="program-detail-fullpage-modal__info-tab-block">
          <h3 className="program-detail-info-tab__section-title">관리자 코멘트</h3>
          <div
            className={`ujat-education-progress-institution-detail__admin-comment-box ${
              !detail.adminComment.trim()
                ? 'ujat-education-progress-institution-detail__admin-comment-box--empty'
                : ''
            }`}
            role="region"
            aria-label="관리자 코멘트"
          >
            {detail.adminComment.trim() ? detail.adminComment : '작성된 코멘트가 없습니다.'}
          </div>
        </div>
      ) : null}

      <div className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>{toTableRows(basicInfoItems)}</tbody>
          </table>
        </div>
      </div>

      <DetailInfoForm
        title="교육 학년 별 정보"
        mode="view"
        titleTrailing={
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            onClick={() => setAddClassModalOpen(true)}
          >
            학급 추가
          </CmsButton>
        }
      >
        {gradeBlocks.map((block, blockIndex) => {
          const textbook = calculateGradeTextbookSupply(block)
          return (
            <Fragment key={`${block.gradeLabel}-${blockIndex}`}>
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
            </Fragment>
          )
        })}
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 수업 시간" mode="view">
        <DetailInfoForm.Row type="custom">
          <ClassTimeTable rows={applicationDetail.classTimeRows} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">진행 교육 일정</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              {detail.confirmedScheduleRows.length === 0 ? (
                <tr>
                  <th>교육 진행 일정</th>
                  <td>-</td>
                </tr>
              ) : (
                detail.confirmedScheduleRows.map(row => (
                  <tr key={row.id}>
                    <th>{row.dateDisplay}</th>
                    <td>
                      <div className="ujat-education-progress-institution-detail__schedule-classes ujat-education-progress-institution-detail__schedule-classes--wrap">
                        {withProgramDetailTdDivider(row.classLabels)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">안내 사항</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              {guidanceItems.map(item => (
                <tr key={item.key}>
                  <th>{item.label}</th>
                  <td>{item.children}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

/**
 * 강의 신청 강사 목록 상세 모달
 * 강사 모집 페이지의 프로그램 목록 테이블 행 클릭 시 노출.
 * 섹션: 프로그램 정보(테이블), 강사 모집(테이블), 강의 신청 강사 목록(테이블).
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import {
  formatDateOnly,
  formatDateRange,
  getInstructorRecruitmentStatus,
} from '../../shared/lib/program-detail-info-constants'
import { RecruitmentStatusBadge } from '@/shared/ui/recruitment-status-badge'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  programTypes,
  businessAreaOptions,
  targetLevelOptions,
  categoryOptions,
} from './constants/program-list-constants'
import {
  getApplicantInstructorsByProgramId,
  updateApplicantInstructorApprovalStatus,
} from '@/data/mock/applicant-instructors'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorApprovalStatusKey,
} from '@/data/mock/applicant-instructors'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { ApplicantInstructorDetailModal } from './applicant-instructor-detail-modal'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
  renderDetailInfoPipeSeparated,
} from '@/features/program/shared/ui/program-detail-td-divider'
import './instructor-recruitment-detail-modal.css'

export interface InstructorRecruitmentDetailModalProps {
  open: boolean
  onCancel: () => void
  program: Program | null
}

const APPROVAL_STATUS_MAP: Record<ApplicantInstructorApprovalStatusKey, ApprovalStatusKey> = {
  pending: 'pending',
  rejected: 'rejected',
  approved: 'approved',
}

const APPROVAL_STATUS_KEYS: ApprovalStatusKey[] = ['pending', 'rejected', 'approved']

export function InstructorRecruitmentDetailModal({
  open,
  onCancel,
  program,
}: InstructorRecruitmentDetailModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<ApplicantInstructorRow | null>(null)
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)

  const sponsorName = useSponsorNameById(program?.sponsorId, open)
  const instructorCount = program?.instructors ?? 0
  const instructorCapacity = program?.instructorCapacity
  const instructorRecruitmentStatus = program ? getInstructorRecruitmentStatus(program) : null

  useEffect(() => {
    if (program?.id && open) {
      setInstructorList(getApplicantInstructorsByProgramId(program.id))
    }
  }, [program?.id, open])

  const handleGoToDetail = useCallback(() => {
    if (program?.id) {
      onCancel()
      navigate(getProgramAdminDetailUrlFromPathname(program.id, location.pathname))
    }
  }, [program?.id, onCancel, navigate, location.pathname])

  const handleInstructorApprovalStatusChange = useCallback(
    (instructorId: string, status: ApprovalStatusKey) => {
      const nextStatus = status as ApplicantInstructorApprovalStatusKey
      setInstructorList(prev =>
        prev.map(row => (row.id === instructorId ? { ...row, approvalStatus: nextStatus } : row))
      )
      updateApplicantInstructorApprovalStatus(instructorId, nextStatus)
      },
    []
  )

  const instructorColumns: ColumnsType<ApplicantInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 120,
        align: 'center',
        ellipsis: true,
        render: (name: string) => name ?? '-',
      },
      {
        title: '강의 경력',
        dataIndex: 'lectureExperienceYears',
        key: 'lectureExperienceYears',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}년` : '-'),
      },
      {
        title: '최종 학력',
        dataIndex: 'educationLevel',
        key: 'educationLevel',
        width: 120,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 120,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 160,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '주소',
        dataIndex: 'address',
        key: 'address',
        width: 180,
        ellipsis: true,
      },
      {
        title: '결재 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApplicantInstructorApprovalStatusKey, record: ApplicantInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={APPROVAL_STATUS_MAP[status]}
              statusOptions={APPROVAL_STATUS_KEYS}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleInstructorApprovalStatusChange(record.id, key)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
            />
          </div>
        ),
      },
    ],
    [handleInstructorApprovalStatusChange, openApprovalDropdownId]
  )

  if (!program) return null

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="교육 신청 강사 목록"
      size="large"
      width={1400}
      className="teal-header-modal--instructor-recruitment-detail"
      footer={
        <CmsButton variant="secondary" size="large" onClick={onCancel}>
          닫기
        </CmsButton>
      }
    >
      <div className="instructor-recruitment-detail-modal__body">
        {/* 섹션 1: 프로그램 정보 (포스터 336×336 + 테이블) */}
        <section className="instructor-recruitment-detail-modal__section instructor-recruitment-detail-modal__section--program">
          <div className="instructor-recruitment-detail-modal__section-header">
            <h3 className="instructor-recruitment-detail-modal__section-title">프로그램 정보</h3>
            <CmsButton
              variant="secondary"
              size="medium"
              onClick={handleGoToDetail}
              className="instructor-recruitment-detail-modal__detail-link"
            >
              프로그램 상세 바로가기
            </CmsButton>
          </div>
          <div className="instructor-recruitment-detail-modal__program-inner">
            <div className="instructor-recruitment-detail-modal__poster-wrap">
              {program.posterImage || program.keyVisualImage ? (
                <Image
                  src={program.keyVisualImage || program.posterImage}
                  alt={program.title}
                  width={336}
                  height={336}
                  style={{ objectFit: 'cover', aspectRatio: '1/1' }}
                  preview={{ mask: '확대 보기' }}
                />
              ) : (
                <div className="instructor-recruitment-detail-modal__poster-placeholder">
                  포스터 이미지 없음
                </div>
              )}
            </div>
            <div className="instructor-recruitment-detail-modal__program-fields">
              <div className="instructor-recruitment-detail-modal__table-wrap">
                <table className="instructor-recruitment-detail-modal__info-table">
                  <tbody>
                    <tr>
                      <th>프로그램명</th>
                      <td>{program.title || '-'}</td>
                      <th>프로그램 운영 기간</th>
                      <td>{formatDateRange(program.startDate, program.endDate)}</td>
                    </tr>
                    <tr>
                      <th>프로그램 진행 방식</th>
                      <td>
                        {program.type
                          ? (programTypes.find(t => t.value === program.type)?.label ??
                            program.type)
                          : '-'}
                      </td>
                      <th>프로그램 진행 상태</th>
                      <td>
                        {program.lifecycleStatus
                          ? getProgramLifecycleLabel(program.lifecycleStatus)
                          : '-'}
                      </td>
                    </tr>
                    <tr>
                      <th>수강자 유형</th>
                      <td>
                        {program.category
                          ? (categoryOptions.find(o => o.value === program.category)?.label ??
                            program.category)
                          : '-'}
                      </td>
                      <th>교육 분야</th>
                      <td>
                        {program.businessArea
                          ? (businessAreaOptions.find(o => o.value === program.businessArea)
                              ?.label ?? program.businessArea)
                          : '-'}
                      </td>
                    </tr>
                    <tr>
                      <th>교육 대상</th>
                      <td>
                        {program.targetLevel
                          ? (targetLevelOptions.find(o => o.value === program.targetLevel)?.label ??
                            program.targetLevel)
                          : '-'}
                      </td>
                      <th>교육 대상 상세</th>
                      <td>{program.district ?? '-'}</td>
                    </tr>
                    <tr>
                      <th>후원사</th>
                      <td>{sponsorName ?? '-'}</td>
                      <th>후원사 담당자</th>
                      <td>
                        {program.managerName ? (
                          <ProgramDetailTdSegmentWrap>
                            {withProgramDetailTdDivider([
                              program.managerName,
                              '010-1234-5678',
                            ])}
                          </ProgramDetailTdSegmentWrap>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                    <tr className="instructor-recruitment-detail-modal__info-table-row-full">
                      <th>문의처</th>
                      <td colSpan={3}>
                        {program.contactPhone || program.contactEmail
                          ? renderDetailInfoPipeSeparated(
                              `문의처 : JA Korea | Tel: ${program.contactPhone ?? '-'} | E-mail: ${program.contactEmail ?? '-'}`
                            )
                          : '-'}
                      </td>
                    </tr>
                    <tr className="instructor-recruitment-detail-modal__info-table-row-full">
                      <th>비고</th>
                      <td colSpan={3}>{program.recruitmentGuide ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 2: 강사 모집 (테이블) */}
        <section className="instructor-recruitment-detail-modal__section">
          <h3 className="instructor-recruitment-detail-modal__section-title">강사 모집</h3>
          <div className="instructor-recruitment-detail-modal__table-wrap">
            <table className="instructor-recruitment-detail-modal__recruitment-table">
              <tbody>
                <tr>
                  <th>강사 모집 인원</th>
                  <td>
                    {instructorCapacity != null ? (
                      <>
                        <span className="instructor-recruitment-detail-modal__recruitment-count">
                          {instructorCount} / {instructorCapacity}건
                        </span>
                        {' (신청자가 아닌 승인된 강사 기준)'}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <th>강사 모집 현황</th>
                  <td>
                    {instructorRecruitmentStatus ? (
                      <RecruitmentStatusBadge status={instructorRecruitmentStatus} size="fixed" />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
                <tr>
                  <th>강사 모집 기간</th>
                  <td>
                    {formatDateRange(
                      program.instructorApplicationStartDate,
                      program.instructorApplicationEndDate
                    )}
                  </td>
                  <th>1차 서류 합격자 발표</th>
                  <td>
                    {program.documentPassAnnouncementDate
                      ? renderDetailInfoPipeSeparated(
                          `${formatDateOnly(program.documentPassAnnouncementDate)} | ${program.documentPassAnnouncementMethod ?? '-'}`
                        )
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <th>2차 면접 심사</th>
                  <td>
                    {program.interviewStartDate && program.interviewEndDate
                      ? renderDetailInfoPipeSeparated(
                          `${formatDateRange(program.interviewStartDate, program.interviewEndDate)} | ${program.interviewMethod ?? '-'}`
                        )
                      : '-'}
                  </td>
                  <th>최종 합격자 발표</th>
                  <td>
                    {program.finalPassAnnouncementDate
                      ? renderDetailInfoPipeSeparated(
                          `${formatDateOnly(program.finalPassAnnouncementDate)} | ${program.finalPassAnnouncementMethod ?? '-'}`
                        )
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 섹션 3: 강의 신청 강사 목록 (테이블) */}
        <section className="instructor-recruitment-detail-modal__section instructor-recruitment-detail-modal__section--table">
          <div className="instructor-recruitment-detail-modal__table-header">
            <span className="instructor-recruitment-detail-modal__table-title">
              교육 신청 강사 목록
            </span>
            <span className="instructor-recruitment-detail-modal__table-description">
              총 {instructorList.length}건
            </span>
          </div>
          <div className="instructor-recruitment-detail-modal__table-wrap">
            <Table<ApplicantInstructorRow>
              className="instructor-recruitment-detail-modal__table instructor-recruitment-detail-modal__table--clickable cms-data-table"
              rowKey="id"
              dataSource={instructorList}
              columns={instructorColumns}
              pagination={false}
              size="middle"
              scroll={{ x: 1000 }}
              onRow={record => ({
                onClick: event => {
                  const target = event.target as HTMLElement
                  if (
                    target.closest('.status-dropdown-cell__cell-status') ||
                    target.closest('.status-dropdown-cell__status-trigger')
                  )
                    return
                  setSelectedInstructor(record)
                },
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        </section>
      </div>

      <ApplicantInstructorDetailModal
        open={!!selectedInstructor}
        onCancel={() => setSelectedInstructor(null)}
        instructor={selectedInstructor}
        showApprovalButtons={false}
      />
    </TealHeaderModal>
  )
}

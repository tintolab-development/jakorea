/**
 * 수강 신청 학교 목록 상세 모달
 * 수강자 모집 페이지의 프로그램 목록 테이블 행 클릭 시 노출.
 * 섹션: 프로그램 정보(포스터+상세), 수강자 모집, 수강 신청 학교 목록 테이블.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { Image } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { getCapacity } from '../lib/program-helpers'
import {
  getRecruitmentStatus,
  formatDateOnly,
  formatDateRange,
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
  getApplicantSchoolsByProgramId,
  updateApplicantSchoolApprovalStatus,
} from '@/data/mock/applicant-institutions'
import type {
  ApplicantSchoolRow,
  ApplicantApprovalStatusKey,
} from '@/data/mock/applicant-institutions'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { SchoolDetailModal } from './school-detail-modal'
import { getApplicantSchoolDetail } from '../lib/school-detail-mock'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import './enrollment-status-detail-modal.css'

export interface EnrollmentStatusDetailModalProps {
  open: boolean
  onCancel: () => void
  program: Program | null
}

const APPROVAL_STATUS_MAP: Record<ApplicantApprovalStatusKey, ApprovalStatusKey> = {
  pending: 'pending',
  rejected: 'rejected',
  approved: 'approved',
}

const APPROVAL_STATUS_KEYS: ApprovalStatusKey[] = ['pending', 'rejected', 'approved']

export function EnrollmentStatusDetailModal({
  open,
  onCancel,
  program,
}: EnrollmentStatusDetailModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [schoolList, setSchoolList] = useState<ApplicantSchoolRow[]>([])
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] = useState<ApplicantSchoolRow | null>(
    null
  )
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)
  const sponsorName = program?.sponsorId
    ? sponsorService.getByIdSync(program.sponsorId)?.name
    : undefined
  const totalCapacity = program ? getCapacity(program) : undefined
  const recruitmentStatus = program ? getRecruitmentStatus(program) : null

  useEffect(() => {
    if (program?.id && open) {
      setSchoolList(getApplicantSchoolsByProgramId(program.id))
    }
  }, [program?.id, open])

  const handleGoToDetail = () => {
    if (program?.id) {
      onCancel()
      navigate(getProgramAdminDetailUrlFromPathname(program.id, location.pathname))
    }
  }

  const schoolDetailForModal = useMemo(
    () => (selectedSchoolForDetail ? getApplicantSchoolDetail(selectedSchoolForDetail) : null),
    [selectedSchoolForDetail]
  )

  const handleSchoolApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const nextStatus = status as ApplicantApprovalStatusKey
      setSchoolList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: nextStatus } : row))
      )
      updateApplicantSchoolApprovalStatus(recordId, nextStatus)
      },
    []
  )

  const schoolColumns: ColumnsType<ApplicantSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: '6%', align: 'center' },
      {
        title: '참여 학교명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: '17%',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '지역',
        dataIndex: 'region',
        key: 'region',
        width: '11%',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '희망 교육 진행 기간',
        dataIndex: 'desiredEducationPeriod',
        key: 'desiredEducationPeriod',
        width: '17%',
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: '8%',
        align: 'center',
      },
      {
        title: '대상 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: '8%',
        align: 'center',
        render: (v: number) => (v != null ? `${v}개` : '-'),
      },
      {
        title: '총 학생 수',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: '8%',
        align: 'center',
        render: (v: number) => (v != null ? `${v}명` : '-'),
      },
      {
        title: '담당교사',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: '11%',
        align: 'center',
      },
      {
        title: '결재 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApplicantApprovalStatusKey, record: ApplicantSchoolRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={APPROVAL_STATUS_MAP[status]}
              statusOptions={APPROVAL_STATUS_KEYS}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleSchoolApprovalStatusChange(record.id, key)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
            />
          </div>
        ),
      },
    ],
    [handleSchoolApprovalStatusChange, openApprovalDropdownId]
  )

  if (!program) return null

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="수강 신청 학교 목록"
      size="large"
      width={1400}
      className="teal-header-modal--enrollment-detail"
      footer={
        <CmsButton variant="secondary" size="large" onClick={onCancel}>
          닫기
        </CmsButton>
      }
    >
      <div className="enrollment-status-detail-modal__body">
        {/* 섹션 1: 프로그램 정보 */}
        <section className="enrollment-status-detail-modal__section enrollment-status-detail-modal__section--program">
          <div className="enrollment-status-detail-modal__program-header">
            <h3 className="enrollment-status-detail-modal__section-title">프로그램 정보</h3>
            <CmsButton
              variant="secondary"
              size="medium"
              onClick={handleGoToDetail}
              className="enrollment-status-detail-modal__detail-link"
            >
              프로그램 상세 바로가기
            </CmsButton>
          </div>
          <div className="enrollment-status-detail-modal__program-inner">
            <div className="enrollment-status-detail-modal__poster-wrap">
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
                <div className="enrollment-status-detail-modal__poster-placeholder">
                  포스터 이미지 없음
                </div>
              )}
            </div>
            <div className="enrollment-status-detail-modal__program-fields">
              <div className="enrollment-status-detail-modal__info-table-wrap">
                <table className="enrollment-status-detail-modal__info-table">
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
                        {program.managerName ? `${program.managerName} | 010-1234-5678` : '-'}
                      </td>
                    </tr>
                    <tr className="enrollment-status-detail-modal__info-table-row-full">
                      <th>문의처</th>
                      <td colSpan={3}>
                        {program.contactPhone || program.contactEmail
                          ? `문의처 : JA Korea | Tel: ${program.contactPhone ?? '-'} | E-mail: ${program.contactEmail ?? '-'}`
                          : '-'}
                      </td>
                    </tr>
                    <tr className="enrollment-status-detail-modal__info-table-row-full">
                      <th>비고</th>
                      <td colSpan={3}>{program.recruitmentGuide ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 2: 수강자 모집 (테이블) */}
        <section className="enrollment-status-detail-modal__section">
          <h3 className="enrollment-status-detail-modal__section-title">수강자 모집</h3>
          <div className="enrollment-status-detail-modal__recruitment-wrap">
            <table className="enrollment-status-detail-modal__recruitment-table">
              <tbody>
                <tr>
                  <th>수강자 모집 인원</th>
                  <td>
                    {totalCapacity != null ? (
                      <>
                        {program.approvedStudentCount ?? 0} /{' '}
                        <span className="enrollment-status-detail-modal__recruitment-count">
                          {totalCapacity}건
                        </span>
                        {' (신청자가 아닌 승인된 수강자 기준)'}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <th>수강자 모집 현황</th>
                  <td>
                    {recruitmentStatus ? (
                      <RecruitmentStatusBadge status={recruitmentStatus} size="fixed" />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
                <tr>
                  <th>수강자 모집 기간</th>
                  <td>
                    {formatDateRange(program.applicationStartDate, program.applicationEndDate)}
                  </td>
                  <th>결과 발표일 및 방법</th>
                  <td>
                    {program.resultAnnouncementDate
                      ? `${formatDateOnly(program.resultAnnouncementDate)} | ${program.resultAnnouncementMethod ?? '-'}`
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 섹션 3: 수강 신청 학교 목록 */}
        <section className="enrollment-status-detail-modal__section enrollment-status-detail-modal__section--table">
          <div className="enrollment-status-detail-modal__table-header">
            <span className="enrollment-status-detail-modal__table-title">수강 신청 학교 목록</span>
            <span className="enrollment-status-detail-modal__table-description">
              총 {schoolList.length}건
            </span>
          </div>
          <div className="enrollment-status-detail-modal__table-wrap">
            <Table<ApplicantSchoolRow>
              className="enrollment-status-detail-modal__table cms-data-table"
              rowKey="id"
              dataSource={schoolList}
              columns={schoolColumns}
              pagination={false}
              size="middle"
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.status-dropdown-cell__cell-status') ||
                    target.closest('.status-dropdown-cell__status-trigger')
                  ) {
                    return
                  }
                  setSelectedSchoolForDetail(record)
                },
                style: { cursor: 'pointer' },
              })}
            />
            <SchoolDetailModal
              open={!!selectedSchoolForDetail}
              onCancel={() => setSelectedSchoolForDetail(null)}
              detail={schoolDetailForModal}
              title="수강 신청 학교 상세 정보"
              variant="applicant"
            />
          </div>
        </section>
      </div>
    </TealHeaderModal>
  )
}

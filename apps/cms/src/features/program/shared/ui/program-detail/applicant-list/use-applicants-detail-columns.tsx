import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  ApprovalStatusBadge,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import type { ApplicantSessionLineInput } from './applicants-detail-session-format'
import { GeneralDetailSessionLine } from './general-detail-session-line'
import type { InstitutionColumnPreset } from './applicant-list-menu'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  getInstitutionApplicationSessionsTableSlice,
  shouldShowInstitutionApplicationSessionsColumn,
} from '@/features/program/general/lib/institution-application-session-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'

const GENERAL_DETAIL_INSTITUTION_TEXT_COL_MIN_WIDTH = 185
/** legacy 기관 목록 일정 열 `480px`와 동일 — 한 줄 일정·디바이더·차시 말줄임 방지 */
const GENERAL_DETAIL_INSTITUTION_SESSIONS_COL_MIN_WIDTH = 480
/**
 * `2026.11.13(금) 07:10 ~ 08:15 | 12차시` 한 줄(Pretendard 16/500 + 디바이더 + 셀 패딩).
 * fluid 테이블이 이 열을 줄이지 않도록 column width·`--schedule` CSS와 쌍으로 둔다.
 */
const COMPANY_SCHOOL_INSTITUTION_SESSIONS_COL_MIN_WIDTH = 400
/** 헤더 16px/700 + 좌우 패딩 20px. fluid 테이블이 남는 폭을 나눠 먹지 않도록 max-width와 쌍으로 둔다. */
const COMPANY_SCHOOL_GRADE_COL_WIDTH = 128
const COMPANY_SCHOOL_CLASS_COUNT_COL_WIDTH = 148
const COMPANY_SCHOOL_STUDENT_COUNT_COL_WIDTH = 136
const COMPANY_SCHOOL_TEACHER_COL_WIDTH = 136

/** `duration: "N차시"`(1사1교·TT)가 차시 수 SoT. classNum은 교시 라벨이라 parseInt 금지. */
function resolveCompanySchoolSessionCount(
  session: NonNullable<ApplicantSchoolRow['sessions']>[number]
): number {
  const fromDuration = /^(\d+)\s*차시/.exec(session.duration?.trim() ?? '')
  if (fromDuration) return Math.max(1, Number.parseInt(fromDuration[1]!, 10))
  return 1
}

function formatCompanySchoolPreferredSchedule(sessions: ApplicantSchoolRow['sessions']): string {
  if (!sessions?.length) return '-'
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  const startTime = first.timeRange?.split('~')[0]?.trim()
  const endTime = last.timeRange?.split('~')[1]?.trim()
  const totalSessions = sessions.reduce(
    (sum, session) => sum + resolveCompanySchoolSessionCount(session),
    0
  )
  const dateLabel = [first.date, first.dayOfWeek ? `(${first.dayOfWeek})` : ''].join('')
  const timeLabel = startTime && endTime ? `${startTime} ~ ${endTime}` : (first.timeRange ?? '-')
  return formatCmsScheduleDisplayLabel(`${dateLabel} ${timeLabel} | ${totalSessions}차시`)
}

export function useInstitutionApplicantColumns(params: {
  setSelectedItem: (record: ApplicantSchoolRow) => void
  approvalStatusKeys: ApprovalStatusKey[]
  getSessionLineParts: (s: ApplicantSessionLineInput) => {
    datePart: string
    durationPart: string
    periodPart: string
  }
  handleInstitutionApprovalStatusChange: (recordId: string, status: ApprovalStatusKey) => void
  openApprovalDropdownId: string | null
  setOpenApprovalDropdownId: (id: string | null) => void
  preset?: InstitutionColumnPreset
  programBridge?: InstitutionApplicationProgramBridge | null
}): ColumnsType<ApplicantSchoolRow> {
  const {
    setSelectedItem,
    approvalStatusKeys,
    getSessionLineParts,
    handleInstitutionApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
    preset = 'legacy',
    programBridge = null,
  } = params
  const isGeneralDetail = preset === 'general-detail'
  const isCompanySchool = preset === 'company-school'
  const showSessionsColumn =
    (!isGeneralDetail && !isCompanySchool) ||
    programBridge == null ||
    shouldShowInstitutionApplicationSessionsColumn(programBridge)

  return useMemo(
    () => {
      if (isCompanySchool) {
        const maxClassCount = programBridge?.maxClassCount
        const columns: ColumnsType<ApplicantSchoolRow> = [
          { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
          {
            title: '신청 기관명',
            dataIndex: 'schoolName',
            key: 'schoolName',
            width: 150,
            align: 'center',
            ellipsis: true,
            render: (text: string, record) => (
              <a
                onClick={() => setSelectedItem(record)}
                style={{ color: 'var(--color-primary)', fontWeight: 500 }}
              >
                {text}
              </a>
            ),
          },
          {
            title: '기관 소재지',
            dataIndex: 'region',
            key: 'region',
            width: 140,
            align: 'center',
            ellipsis: true,
          },
          {
            title: '프로그램 승인 현황',
            dataIndex: 'approvalStatus',
            key: 'approvalStatus',
            width: 120,
            align: 'center',
            render: (status: ApprovalStatusKey) =>
              status ? <ApprovalStatusText status={status} /> : '-',
          },
          {
            title: '진행 희망 교육 일정',
            key: 'sessions',
            width: COMPANY_SCHOOL_INSTITUTION_SESSIONS_COL_MIN_WIDTH,
            minWidth: COMPANY_SCHOOL_INSTITUTION_SESSIONS_COL_MIN_WIDTH,
            align: 'center',
            className: 'applicant-details__th-sessions applicant-details__th-sessions--schedule',
            onHeaderCell: () => ({
              className: 'applicant-details__th-sessions applicant-details__th-sessions--schedule',
            }),
            onCell: () => ({
              className:
                'applicant-details__td-sessions applicant-details__td-sessions--center applicant-details__td-sessions--schedule',
            }),
            render: (_: unknown, record: ApplicantSchoolRow) => (
              <div className="applicant-details__sessions-cell">
                <div className="applicant-details__session-line applicant-details__session-line--nowrap">
                  {renderProgramDetailPipeSeparated(
                    formatCompanySchoolPreferredSchedule(record.sessions)
                  )}
                </div>
              </div>
            ),
          },
          {
            title: '신청 학년',
            dataIndex: 'educationGrade',
            key: 'educationGrade',
            width: COMPANY_SCHOOL_GRADE_COL_WIDTH,
            align: 'center',
            ellipsis: true,
            className: 'applicant-details__th-grade',
            onHeaderCell: () => ({ className: 'applicant-details__th-grade' }),
            onCell: () => ({ className: 'applicant-details__td-grade' }),
            render: (value: string) => formatInstitutionApplicationGradeDisplay(value ?? '') || '-',
          },
          {
            title: '신청 학급 수',
            dataIndex: 'classCount',
            key: 'classCount',
            width: COMPANY_SCHOOL_CLASS_COUNT_COL_WIDTH,
            align: 'center',
            className: 'applicant-details__th-class-count',
            onHeaderCell: () => ({ className: 'applicant-details__th-class-count' }),
            onCell: () => ({ className: 'applicant-details__td-class-count' }),
            render: (v: number) => {
              const next = maxClassCount != null ? Math.min(v, maxClassCount) : v
              return next != null ? `${next}개` : '-'
            },
          },
          {
            title: '총 학생 수',
            dataIndex: 'studentCount',
            key: 'studentCount',
            width: COMPANY_SCHOOL_STUDENT_COUNT_COL_WIDTH,
            align: 'center',
            className: 'applicant-details__th-student-count',
            onHeaderCell: () => ({ className: 'applicant-details__th-student-count' }),
            onCell: () => ({ className: 'applicant-details__td-student-count' }),
            render: (v: number) => (v != null ? `${v}명` : '-'),
          },
          {
            title: '신청 교사명',
            dataIndex: 'teacherName',
            key: 'teacherName',
            width: COMPANY_SCHOOL_TEACHER_COL_WIDTH,
            align: 'center',
            ellipsis: true,
            className: 'applicant-details__th-teacher',
            onHeaderCell: () => ({ className: 'applicant-details__th-teacher' }),
            onCell: () => ({ className: 'applicant-details__td-teacher' }),
          },
        ]

        return showSessionsColumn ? columns : columns.filter(column => column.key !== 'sessions')
      }

      const columns: ColumnsType<ApplicantSchoolRow> = [
      /* 화면 너비 대비 비율 분배(합 100%). 가로 스크롤은 scroll.x = max(최소, 래퍼 너비)로 처리 */
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: isGeneralDetail ? '신청 기관명' : '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        ...(isGeneralDetail
          ? {
              width: GENERAL_DETAIL_INSTITUTION_TEXT_COL_MIN_WIDTH,
              minWidth: GENERAL_DETAIL_INSTITUTION_TEXT_COL_MIN_WIDTH,
              className: 'applicant-details__th-school-name',
              onHeaderCell: () => ({ className: 'applicant-details__th-school-name' }),
              onCell: () => ({ className: 'applicant-details__td-school-name' }),
            }
          : {}),
        align: 'center',
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: isGeneralDetail ? '기관 소재지' : '기관 지역',
        dataIndex: 'region',
        key: 'region',
        ...(isGeneralDetail
          ? {
              width: GENERAL_DETAIL_INSTITUTION_TEXT_COL_MIN_WIDTH,
              minWidth: GENERAL_DETAIL_INSTITUTION_TEXT_COL_MIN_WIDTH,
              className: 'applicant-details__th-region',
              onHeaderCell: () => ({ className: 'applicant-details__th-region' }),
              onCell: () => ({ className: 'applicant-details__td-region' }),
            }
          : {}),
        align: 'center',
        ellipsis: true,
        render: isGeneralDetail
          ? (text: string) => {
              const short = text.split(/\s+/).slice(0, 2).join(' ')
              return short || text
            }
          : undefined,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: isGeneralDetail ? '180px' : '150px',
        align: 'center',
        ...(isGeneralDetail
          ? {}
          : {
              className: STATUS_DROPDOWN_CELL_CLASSNAME,
              onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
              onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
            }),
        render: (status: ApprovalStatusKey, record: ApplicantSchoolRow) =>
          isGeneralDetail ? (
            status ? <ApprovalStatusText status={status} /> : '-'
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
              <StatusDropdownCell<ApprovalStatusKey>
                status={status ?? null}
                statusOptions={approvalStatusKeys}
                renderBadge={s => <ApprovalStatusBadge status={s} />}
                isItemDisabled={(cur, opt) => cur === opt}
                onChange={newStatus => handleInstitutionApprovalStatusChange(record.id, newStatus)}
                isOpen={openApprovalDropdownId === record.id}
                onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
                emptyPlaceholder="-"
              />
            </div>
          ),
      },
      {
        title: isGeneralDetail ? '진행 희망 교육 일정' : '강의 회차 별 희망 교육 날짜 및 시간',
        key: 'sessions',
        ...(isGeneralDetail
          ? {
              width: GENERAL_DETAIL_INSTITUTION_SESSIONS_COL_MIN_WIDTH,
              minWidth: GENERAL_DETAIL_INSTITUTION_SESSIONS_COL_MIN_WIDTH,
            }
          : { width: '480px' }),
        align: 'center',
        className: isGeneralDetail
          ? 'applicant-details__th-sessions applicant-details__th-sessions--general-detail'
          : undefined,
        onHeaderCell: () =>
          isGeneralDetail
            ? { className: 'applicant-details__th-sessions applicant-details__th-sessions--general-detail' }
            : {},
        onCell: () => ({
          className: isGeneralDetail
            ? 'applicant-details__td-sessions applicant-details__td-sessions--general-detail applicant-details__td-sessions--center'
            : 'applicant-details__td-sessions',
        }),
        render: (_: unknown, record: ApplicantSchoolRow) => {
          const sessions = record.sessions ?? []
          if (sessions.length === 0) return '-'
          const { displaySessions, restCount } = getInstitutionApplicationSessionsTableSlice(sessions)
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => {
                if (isGeneralDetail) {
                  return (
                    <div key={s.round} className="applicant-details__session-line">
                      <GeneralDetailSessionLine session={s} bridge={programBridge} />
                    </div>
                  )
                }
                const { datePart, durationPart, periodPart } = getSessionLineParts(s)
                return (
                  <div key={s.round} className="applicant-details__session-line">
                    {datePart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {durationPart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {periodPart}
                  </div>
                )
              })}
              {restCount > 0 && (
                <div className="applicant-details__session-more">외 {restCount}개의 교육 일정</div>
              )}
            </div>
          )
        },
      },
      {
        title: isGeneralDetail ? '신청 학년' : '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        align: 'center',
        ...(isGeneralDetail
          ? {
              width: COMPANY_SCHOOL_GRADE_COL_WIDTH,
              minWidth: COMPANY_SCHOOL_GRADE_COL_WIDTH,
              className: 'applicant-details__th-grade',
              onHeaderCell: () => ({ className: 'applicant-details__th-grade' }),
              onCell: () => ({ className: 'applicant-details__td-grade' }),
            }
          : {}),
        render: (value: string) => formatInstitutionApplicationGradeDisplay(value ?? '') || '-',
      },
      {
        title: isGeneralDetail ? '신청 학급 수' : '대상 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        align: 'center',
        ...(isGeneralDetail
          ? {
              width: COMPANY_SCHOOL_CLASS_COUNT_COL_WIDTH,
              minWidth: COMPANY_SCHOOL_CLASS_COUNT_COL_WIDTH,
              className: 'applicant-details__th-class-count',
              onHeaderCell: () => ({ className: 'applicant-details__th-class-count' }),
              onCell: () => ({ className: 'applicant-details__td-class-count' }),
            }
          : {}),
        render: (v: number) => (v != null ? `${v}개` : '-'),
      },
      {
        title: '총 학생 수',
        dataIndex: 'studentCount',
        key: 'studentCount',
        align: 'center',
        ...(isGeneralDetail
          ? {
              width: COMPANY_SCHOOL_STUDENT_COUNT_COL_WIDTH,
              minWidth: COMPANY_SCHOOL_STUDENT_COUNT_COL_WIDTH,
              className: 'applicant-details__th-student-count',
              onHeaderCell: () => ({ className: 'applicant-details__th-student-count' }),
              onCell: () => ({ className: 'applicant-details__td-student-count' }),
            }
          : {}),
        render: (v: number) => (v != null ? `${v}명` : '-'),
      },
      {
        title: isGeneralDetail ? '신청 교사명' : '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        align: 'center',
        ...(isGeneralDetail
          ? {
              width: COMPANY_SCHOOL_TEACHER_COL_WIDTH,
              minWidth: COMPANY_SCHOOL_TEACHER_COL_WIDTH,
              className: 'applicant-details__th-teacher',
              onHeaderCell: () => ({ className: 'applicant-details__th-teacher' }),
              onCell: () => ({ className: 'applicant-details__td-teacher' }),
            }
          : {}),
      },
      ...(isGeneralDetail
        ? []
        : [
            {
              title: '담당 강사',
              dataIndex: 'assignedInstructorNames',
              key: 'assignedInstructorNames',

              align: 'center' as const,
              ellipsis: true,
              render: (v: string | undefined) => v ?? '-',
            },
          ]),
      ]

      return showSessionsColumn ? columns : columns.filter(column => column.key !== 'sessions')
    },
    [
      approvalStatusKeys,
      getSessionLineParts,
      handleInstitutionApprovalStatusChange,
      isCompanySchool,
      isGeneralDetail,
      openApprovalDropdownId,
      programBridge,
      setSelectedItem,
      showSessionsColumn,
    ]
  )
}

export function useInstructorApplicantColumns(params: {
  setSelectedItem: (record: ApplicantInstructorRow) => void
  approvalStatusKeys: ApprovalStatusKey[]
  handleInstructorApprovalStatusChange: (recordId: string, status: ApprovalStatusKey) => void
  openApprovalDropdownId: string | null
  setOpenApprovalDropdownId: (id: string | null) => void
}): ColumnsType<ApplicantInstructorRow> {
  const {
    setSelectedItem,
    approvalStatusKeys,
    handleInstructorApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  } = params

  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 110,
        align: 'center',
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: '거주 지역',
        dataIndex: 'address',
        key: 'address',
        width: 150,
        align: 'center',
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'teachingExperience',
        key: 'teachingExperience',
        width: 120,
        align: 'center',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'evaluationGrade',
        key: 'evaluationGrade',
        width: 110,
        align: 'center',
        render: (v: string | undefined) => formatJaEvaluationGradeCellDisplay(v),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 130,
        align: 'center',
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
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={status ?? null}
              statusOptions={approvalStatusKeys}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => handleInstructorApprovalStatusChange(record.id, newStatus)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          </div>
        ),
      },
    ],
    [approvalStatusKeys, handleInstructorApprovalStatusChange, openApprovalDropdownId]
  )
}

import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { getApprovalStatusTag, type ApprovalStatusKey } from '@/shared/lib/status-tag-specs'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import type { ApplicantSessionLineInput } from './applicants-detail-session-format'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import type { InstitutionColumnPreset } from './applicant-list-menu'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { shouldShowInstitutionApplicationSessionsColumn } from '@/features/program/general/lib/institution-application-session-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { prepareGeneralEducationScheduleSessions } from '@/features/program/general/lib/participating-school-session-display'
import {
  formatGeneralDetailSessionLine,
  generalEducationScheduleShapeFromBridge,
} from './applicants-detail-session-format'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  formatTrainedTeacherPreferredScheduleLines,
  trainedTeacherPreferredScheduleLineKey,
} from '@/features/program/trained-teachers/lib/preferred-schedule-display'

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

function formatCompanySchoolPreferredScheduleLine(
  session: NonNullable<ApplicantSchoolRow['sessions']>[number]
): string {
  const rank = session.classNum?.trim() || (session.round > 0 ? `${session.round}지망` : '')
  const dateLabel = [session.date, session.dayOfWeek ? `(${session.dayOfWeek})` : '']
    .filter(Boolean)
    .join('')
  const timeLabel = session.timeRange && session.timeRange !== '-' ? session.timeRange : ''
  return formatCmsScheduleDisplayLabel([rank, dateLabel, timeLabel].filter(Boolean).join(' '))
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
  detailScheduleTimeSpan?: string | null
  curriculumSessionLabels?: readonly string[] | null
  educationScheduleLines?: readonly string[] | null
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
    detailScheduleTimeSpan = null,
    curriculumSessionLabels = null,
    educationScheduleLines = null,
  } = params
  const isGeneralDetail = preset === 'general-detail'
  const isCompanySchool = preset === 'company-school'
  const scheduleLines =
    educationScheduleLines ?? programBridge?.educationScheduleLines ?? []
  const hasScheduleMultiLines =
    isGeneralDetail &&
    programBridge?.educationStructure === 'schedule' &&
    programBridge.sessionRound === 'multi' &&
    scheduleLines.length > 0
  const showSessionsColumn =
    hasScheduleMultiLines ||
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
            render: (_: unknown, record: ApplicantSchoolRow) => {
              if (Array.isArray(record.preferredScheduleBlocks)) {
                const hopeBlocks = record.preferredScheduleBlocks
                if (hopeBlocks.length === 0) {
                  return (
                    <div className="applicant-details__sessions-cell">
                      <div className="applicant-details__session-line applicant-details__session-line--nowrap">
                        -
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="applicant-details__sessions-cell">
                    {hopeBlocks.flatMap(block =>
                      formatTrainedTeacherPreferredScheduleLines(block).map((line, sessionIndex) => (
                        <div
                          key={`${record.id}-${trainedTeacherPreferredScheduleLineKey(block, sessionIndex)}`}
                          className="applicant-details__session-line applicant-details__session-line--nowrap"
                        >
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                )
              }
              const hopeSessions = record.sessions ?? []
              if (hopeSessions.length === 0) {
                return (
                  <div className="applicant-details__sessions-cell">
                    <div className="applicant-details__session-line applicant-details__session-line--nowrap">
                      -
                    </div>
                  </div>
                )
              }
              return (
                <div className="applicant-details__sessions-cell">
                  {hopeSessions.map((session, index) => (
                    <div
                      key={`${record.id}-${session.round}-${index}`}
                      className="applicant-details__session-line applicant-details__session-line--nowrap"
                    >
                      {formatCompanySchoolPreferredScheduleLine(session)}
                    </div>
                  ))}
                </div>
              )
            },
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
                getTag={getApprovalStatusTag}
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
          const sessions = isGeneralDetail
            ? prepareGeneralEducationScheduleSessions(
                record.sessions ?? [],
                generalEducationScheduleShapeFromBridge(programBridge),
                {
                  detailScheduleTimeSpan,
                  educationScheduleLines: scheduleLines,
                }
              )
            : (record.sessions ?? [])
          const lines = sessions.map(s => {
            if (isGeneralDetail) {
              return formatGeneralDetailSessionLine(s, programBridge, {
                detailScheduleTimeSpan,
                curriculumSessionLabels,
                preferFormOptionLabel: true,
              })
            }
            const { datePart, durationPart, periodPart } = getSessionLineParts(s)
            return [datePart, durationPart, periodPart].filter(Boolean).join(' | ')
          })
          return <ScheduleLinesCell lines={lines} />
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
      curriculumSessionLabels,
      educationScheduleLines,
      getSessionLineParts,
      handleInstitutionApprovalStatusChange,
      isCompanySchool,
      detailScheduleTimeSpan,
      isGeneralDetail,
      openApprovalDropdownId,
      programBridge,
      scheduleLines,
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
              getTag={getApprovalStatusTag}
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

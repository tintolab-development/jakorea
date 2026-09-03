import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'

export function useGeneralInstructorApplicantColumns(params: {
  setSelectedItem: (record: ApplicantInstructorRow) => void
}): ColumnsType<ApplicantInstructorRow> {
  const { setSelectedItem } = params

  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '신청 강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
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
        title: '자택 주소지',
        dataIndex: 'address',
        key: 'address',
        align: 'center',
        ellipsis: true,
        render: (text: string) => {
          const short = text.split(/\s+/).slice(0, 2).join(' ')
          return short || text
        },
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'lectureExperienceYears',
        key: 'lectureExperienceYears',
        align: 'center',
        render: (years: number) => (years != null ? `${years}년` : '-'),
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'evaluationGrade',
        key: 'evaluationGrade',
        align: 'center',
        render: (v: string | undefined) => formatJaEvaluationGradeCellDisplay(v),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: '180px',
        align: 'center',
        render: (status: ApprovalStatusKey) =>
          status ? <ApprovalStatusText status={status} /> : '-',
      },
    ],
    [setSelectedItem]
  )
}

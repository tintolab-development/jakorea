import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { AssignmentSubmissionCellActionButton } from '@/features/program/general/ui/assignment-submission-history-table'
import { resolveProgressAssignmentRemark } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import { GENERAL_SATISFACTION_NAV_TAB } from '@/features/program/general/lib/survey-audience'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSubmissionItem,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export type ProgressAssignmentSurveyNavTab = 'survey' | typeof GENERAL_SATISFACTION_NAV_TAB

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_TABLE_SCROLL_X = 1100

/** 링크 제출은 URL 대신 고정 문구로 표시한다(Figma 4515:64786). */
export const PROGRESS_ASSIGNMENT_SUBMISSION_LINK_LABEL = '제출 링크'

function SubmissionCell({
  row,
  onViewSurveyResponse,
}: {
  row: ParticipatingIndividualProgressAssignmentParticipantRow
  onViewSurveyResponse: (tab: ProgressAssignmentSurveyNavTab) => void
}) {
  const { showAlert } = useCmsAlert()
  const { submission } = row

  const downloadFile = async (fileObjectId?: number, fileName?: string, downloadable?: boolean) => {
    if (fileObjectId == null) {
      showAlert({
        title: '안내',
        content: '첨부 파일 ID가 없어 내려받을 수 없습니다.',
      })
      return
    }
    if (downloadable !== true) {
      showAlert({
        title: '안내',
        content: '이 과제는 다운로드할 수 없습니다.',
      })
      return
    }
    try {
      await downloadAdminFile({
        fileObjectId,
        fileName: fileName?.trim() || `과제_${fileObjectId}`,
      })
    } catch (error) {
      handleError(error, { context: 'downloadProgressAssignmentFile' })
    }
  }

  const hasSurveyActions = row.surveyResponse != null || row.satisfactionResponse != null
  const submissionItems: ParticipatingIndividualProgressAssignmentSubmissionItem[] =
    submission.kind === 'submitted'
      ? submission.items?.length
        ? submission.items
        : [
            {
              kind: 'file' as const,
              fileName: submission.fileName,
              href: submission.href,
              fileObjectId: submission.fileObjectId,
              downloadable: submission.downloadable,
            },
            ...(submission.secondaryFileName
              ? [
                  {
                    kind: 'file' as const,
                    fileName: submission.secondaryFileName,
                    href: submission.secondaryHref ?? '#',
                    fileObjectId: submission.secondaryFileObjectId,
                    downloadable: submission.secondaryDownloadable,
                  },
                ]
              : []),
          ]
      : []

  if (!hasSurveyActions && submission.kind === 'not_submitted') {
    return <span className="participating-individual-progress-assignment-table__not-submitted">미제출</span>
  }

  // 교육 미진행(SCHEDULED) — 제출 파일 칸에 교육 진행 현황 문구를 넣지 않는다.
  if (!hasSurveyActions && submission.kind === 'scheduled') {
    return '-'
  }

  return (
    <div className="participating-individual-progress-assignment-table__submission-links">
      {submission.kind === 'not_submitted' ? (
        <span className="participating-individual-progress-assignment-table__not-submitted">
          미제출
        </span>
      ) : null}
      {submissionItems.map((item, index) => (
        item.kind === 'link' ? (
          <a
            key={`${item.href}-${index}`}
            className="participating-individual-progress-assignment-table__submission-link"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PROGRESS_ASSIGNMENT_SUBMISSION_LINK_LABEL}
          </a>
        ) : (
          <button
            key={`${item.fileObjectId ?? item.fileName}-${index}`}
            type="button"
            className="participating-individual-progress-assignment-table__submission-link"
            onClick={() => void downloadFile(item.fileObjectId, item.fileName, item.downloadable)}
          >
            {item.fileName.trim() || '제출 파일'}
          </button>
        )
      ))}
      {row.surveyResponse ? (
        <AssignmentSubmissionCellActionButton onClick={() => onViewSurveyResponse('survey')}>
          설문조사 보기
        </AssignmentSubmissionCellActionButton>
      ) : null}
      {row.satisfactionResponse ? (
        <AssignmentSubmissionCellActionButton
          onClick={() => onViewSurveyResponse(GENERAL_SATISFACTION_NAV_TAB)}
        >
          만족도조사 보기
        </AssignmentSubmissionCellActionButton>
      ) : null}
    </div>
  )
}

export function ParticipatingIndividualProgressAssignmentTable({
  rows,
  onViewSurveyResponse,
}: {
  rows: ParticipatingIndividualProgressAssignmentParticipantRow[]
  onViewSurveyResponse: (tab: ProgressAssignmentSurveyNavTab) => void
}) {
  const tableData = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      no: index + 1,
    }))
  }, [rows])

  const columns: ColumnsType<
    ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }
  > = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '참여자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '성별 및 생년월일',
        dataIndex: 'genderBirthLabel',
        key: 'genderBirthLabel',
        width: 180,
        align: 'center',
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '소속 및 학년',
        dataIndex: 'affiliationGradeLabel',
        key: 'affiliationGradeLabel',
        width: 200,
        align: 'center',
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '제출 파일',
        key: 'submission',
        width: 260,
        align: 'center',
        className: 'participating-individual-progress-assignment-table__submission-column',
        render: (_value, record) => (
          <SubmissionCell row={record} onViewSurveyResponse={onViewSurveyResponse} />
        ),
      },
      {
        title: '비고',
        key: 'remark',
        width: 220,
        align: 'center',
        ellipsis: true,
        render: (_value, record) => resolveProgressAssignmentRemark(record),
      },
    ],
    [onViewSurveyResponse]
  )

  return (
    <CmsDataTable<ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }>
      rowKey="id"
      className="cms-data-table participating-individual-progress-assignment-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_TABLE_SCROLL_X }}
    />
  )
}

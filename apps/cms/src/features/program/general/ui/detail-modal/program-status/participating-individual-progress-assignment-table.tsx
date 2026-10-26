import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { AssignmentSubmissionCellActionButton } from '@/features/program/general/ui/assignment-submission-history-table'
import { resolveProgressAssignmentRemark } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import type { ParticipatingIndividualSurveyViewKey } from '@/features/program/general/model/participating-individual-participants'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSubmissionItem,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_TABLE_SCROLL_X = 1100

function SubmissionCell({
  row,
  onViewSurveyResponse,
  surveyViewLoading,
}: {
  row: ParticipatingIndividualProgressAssignmentParticipantRow
  onViewSurveyResponse: (
    title: string,
    response: ParticipatingIndividualSurveyViewKey
  ) => void
  surveyViewLoading: boolean
}) {
  const { showAlert } = useCmsAlert()
  const { submission } = row

  const downloadFile = async (fileObjectId?: number, fileName?: string, downloadable?: boolean) => {
    if (fileObjectId == null || downloadable !== true) {
      showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
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

  if (!hasSurveyActions && submission.kind === 'scheduled') {
    return (
      <span className="participating-individual-progress-assignment-table__scheduled">
        교육 진행 예정
      </span>
    )
  }

  return (
    <div className="participating-individual-progress-assignment-table__submission-links">
      {submission.kind === 'not_submitted' ? (
        <span className="participating-individual-progress-assignment-table__not-submitted">
          미제출
        </span>
      ) : null}
      {submission.kind === 'scheduled' ? (
        <span className="participating-individual-progress-assignment-table__scheduled">
          교육 진행 예정
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
            {item.fileName}
          </a>
        ) : (
          <button
            key={`${item.fileObjectId ?? item.fileName}-${index}`}
            type="button"
            className="participating-individual-progress-assignment-table__submission-link"
            onClick={() => void downloadFile(item.fileObjectId, item.fileName, item.downloadable)}
          >
            {item.fileName}
          </button>
        )
      ))}
      {row.surveyResponse ? (
        <AssignmentSubmissionCellActionButton
          loading={surveyViewLoading}
          onClick={() => onViewSurveyResponse('설문조사 보기', row.surveyResponse!)}
        >
          설문조사 보기
        </AssignmentSubmissionCellActionButton>
      ) : null}
      {row.satisfactionResponse ? (
        <AssignmentSubmissionCellActionButton
          loading={surveyViewLoading}
          onClick={() => onViewSurveyResponse('만족도조사 보기', row.satisfactionResponse!)}
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
  surveyViewLoading,
}: {
  rows: ParticipatingIndividualProgressAssignmentParticipantRow[]
  onViewSurveyResponse: (
    title: string,
    response: ParticipatingIndividualSurveyViewKey
  ) => void
  surveyViewLoading: boolean
}) {
  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
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
          <SubmissionCell
            row={record}
            onViewSurveyResponse={onViewSurveyResponse}
            surveyViewLoading={surveyViewLoading}
          />
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
    [onViewSurveyResponse, surveyViewLoading]
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

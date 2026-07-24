import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import './lecture-report-submission-history-modal.css'

interface LectureReportSubmissionHistoryModalProps {
  open: boolean
  application: Application | null
  onCancel: () => void
}

interface LectureReportSubmissionRow {
  id: string
  educationDateLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
}

function buildLectureReportSubmissionRows(): LectureReportSubmissionRow[] {
  return [
    {
      id: '1',
      educationDateLabel: '26. 01. 05 (월) | 1회차',
      submissionPeriodLabel: '26. 01. 05 (월) ~ 26. 01. 09(금)',
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      canViewReport: true,
    },
    {
      id: '2',
      educationDateLabel: '26. 01. 12 (월) | 2회차',
      submissionPeriodLabel: '26. 01. 12 (월) ~ 26. 01. 16(금)',
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      canViewReport: true,
    },
    {
      id: '3',
      educationDateLabel: '26. 01. 19 (월) | 3회차',
      submissionPeriodLabel: '26. 01. 19 (월) ~ 26. 01. 23(금)',
      lectureProgressLabel: '진행 예정',
      submissionStatusLabel: '미제출',
      canViewReport: false,
    },
    {
      id: '4',
      educationDateLabel: '26. 01. 26 (월) | 4회차',
      submissionPeriodLabel: '26. 01. 26 (월) ~ 26. 01. 30(금)',
      lectureProgressLabel: '진행 예정',
      submissionStatusLabel: '진행 예정',
      canViewReport: false,
    },
  ]
}

function lectureProgressClass(label: LectureReportSubmissionRow['lectureProgressLabel']): string {
  if (label === '진행 완료') return 'lecture-report-submission-history-modal__status-text'
  return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--scheduled'
}

function submissionStatusClass(label: LectureReportSubmissionRow['submissionStatusLabel']): string {
  if (label === '미제출') {
    return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--undone'
  }
  if (label === '진행 예정') {
    return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--scheduled'
  }
  return 'lecture-report-submission-history-modal__status-text'
}

export function LectureReportSubmissionHistoryModal({
  open,
  application,
  onCancel,
}: LectureReportSubmissionHistoryModalProps) {
  const rows = useMemo(() => buildLectureReportSubmissionRows(), [])
  const programTitle = useMemo(() => {
    if (!application) return '프로그램'
    return programService.getByIdSync(application.programId)?.title ?? '프로그램'
  }, [application])

  const columns = useMemo(
    (): ColumnsType<LectureReportSubmissionRow> => [
      {
        title: '교육 진행 일자 및 교육 차시',
        dataIndex: 'educationDateLabel',
        key: 'educationDateLabel',
        align: 'center',
        width: 300,
        render: (label: string) => renderProgramDetailPipeSeparated(label),
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 300,
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: LectureReportSubmissionRow['lectureProgressLabel']) => (
          <span className={lectureProgressClass(label)}>{label}</span>
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatusLabel',
        key: 'submissionStatusLabel',
        align: 'center',
        width: 120,
        render: (label: LectureReportSubmissionRow['submissionStatusLabel']) => (
          <span className={submissionStatusClass(label)}>{label}</span>
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 140,
        render: (_: unknown, record: LectureReportSubmissionRow) => (
          <CmsButton variant="default" size="large" disabled={!record.canViewReport}>
            강의보고서 보기
          </CmsButton>
        ),
      },
    ],
    []
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강의보고서 제출 내역"
      size="large"
      className="lecture-report-submission-history-modal"
      description={`**[${programTitle}]** 프로그램의 과제 및 실습 제출 내역입니다.`}
      footer={
        <>
          <CmsButton variant="secondary" size="large" width={160} onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large" style={{ minWidth: 180 }}
            icon={<DownloadOutlined />}
            onClick={() => {
              window.alert('준비 중입니다.')
            }}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="lecture-report-submission-history-modal__body">
        <div className="lecture-report-submission-history-modal__list-head">
          <span className="lecture-report-submission-history-modal__list-title">
            강의보고서 제출 목록
          </span>
          <span className="lecture-report-submission-history-modal__list-count">{rows.length}건</span>
        </div>
        <Table<LectureReportSubmissionRow>
          className="cms-data-table cms-data-table--fluid"
          rowKey="id"
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
      </div>
    </ContentModal>
  )
}

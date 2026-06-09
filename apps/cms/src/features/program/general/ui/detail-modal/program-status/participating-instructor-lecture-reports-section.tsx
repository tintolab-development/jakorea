/**
 * 참여 강사 상세 — 강의보고서 관리 탭
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import type { LectureReportPreviewContext } from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import { LectureReportIssuancePreviewModal } from './lecture-report-issuance-preview-modal'

interface ParticipatingInstructorLectureReportRow {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
}

function buildParticipatingInstructorLectureReportRows(): ParticipatingInstructorLectureReportRow[] {
  return [
    {
      id: '4',
      no: 4,
      schoolName: '강서초등학교',
      educationGrade: '3학년',
      educationScheduleLabel: '2026. 01. 05(월) ~ 2026. 01. 09(금) | 1회차',
      submissionPeriodLabel: '2026. 01. 05(월) ~ 2026. 01. 09(금)',
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      canViewReport: true,
    },
    {
      id: '3',
      no: 3,
      schoolName: '강서초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 12(월) ~ 2026. 01. 16(금) | 2회차',
      submissionPeriodLabel: '2026. 01. 12(월) ~ 2026. 01. 16(금)',
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      canViewReport: true,
    },
    {
      id: '2',
      no: 2,
      schoolName: '서울등현초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 19(월) ~ 2026. 01. 23(금) | 3회차',
      submissionPeriodLabel: '2026. 01. 19(월) ~ 2026. 01. 23(금)',
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '미제출',
      canViewReport: false,
    },
    {
      id: '1',
      no: 1,
      schoolName: '서울등현초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 26(월) ~ 2026. 01. 30(금) | 4회차',
      submissionPeriodLabel: '2026. 01. 26(월) ~ 2026. 01. 30(금)',
      lectureProgressLabel: '진행 예정',
      submissionStatusLabel: '진행 예정',
      canViewReport: false,
    },
  ]
}

const STATUS_ACCENT_DEFAULT = 'var(--default-BK, #3d3d3d)'
const STATUS_ACCENT_SCHEDULED = 'var(--color-green, #1e8c29)'
const STATUS_ACCENT_UNDONE = 'var(--color-red, #c32f4a)'

function lectureProgressAccent(
  label: ParticipatingInstructorLectureReportRow['lectureProgressLabel']
): string {
  return label === '진행 완료' ? STATUS_ACCENT_DEFAULT : STATUS_ACCENT_SCHEDULED
}

function submissionStatusAccent(
  label: ParticipatingInstructorLectureReportRow['submissionStatusLabel']
): string {
  if (label === '미제출') return STATUS_ACCENT_UNDONE
  if (label === '진행 예정') return STATUS_ACCENT_SCHEDULED
  return STATUS_ACCENT_DEFAULT
}

const lectureReportExportColumns: ColumnsType<ParticipatingInstructorLectureReportRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '교육 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
  { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
  {
    title: '강의보고서 제출 기간',
    dataIndex: 'submissionPeriodLabel',
    key: 'submissionPeriodLabel',
  },
  { title: '강의 진행 여부', dataIndex: 'lectureProgressLabel', key: 'lectureProgressLabel' },
  { title: '제출 현황', dataIndex: 'submissionStatusLabel', key: 'submissionStatusLabel' },
]

export interface ParticipatingInstructorLectureReportsSectionProps {
  instructor: ParticipatingInstructorRow
  program?: Program | null
}

export function ParticipatingInstructorLectureReportsSection({
  instructor,
  program,
}: ParticipatingInstructorLectureReportsSectionProps) {
  const rows = useMemo(() => buildParticipatingInstructorLectureReportRows(), [])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContext, setPreviewContext] = useState<LectureReportPreviewContext | null>(null)

  const handleOpenPreview = useCallback(
    (row: ParticipatingInstructorLectureReportRow) => {
      setPreviewContext({
        instructor,
        program,
        row: {
          id: row.id,
          no: row.no,
          schoolName: row.schoolName,
          educationGrade: row.educationGrade,
          educationScheduleLabel: row.educationScheduleLabel,
        },
      })
      setPreviewOpen(true)
    },
    [instructor, program]
  )

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false)
    setPreviewContext(null)
  }, [])

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: lectureReportExportColumns,
    data: rows,
    filename: '강의보고서 제출 현황',
  })

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorLectureReportRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140, align: 'center' },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 320,
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 280,
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorLectureReportRow['lectureProgressLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={lectureProgressAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatusLabel',
        key: 'submissionStatusLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorLectureReportRow['submissionStatusLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={submissionStatusAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 180,
        render: (_: unknown, record: ParticipatingInstructorLectureReportRow) => (
          <CmsButton
            variant="default"
            size="medium"
            width={140}
            disabled={!record.canViewReport}
            onClick={() => handleOpenPreview(record)}
          >
            강의보고서 보기
          </CmsButton>
        ),
      },
    ],
    [handleOpenPreview]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">강의보고서 제출 현황</span>
          <span className="table-description">{rows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="large"
            width={220}
            icon={<DownloadOutlined />}
            onClick={() => {
              window.alert('준비 중입니다.')
            }}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
        </div>
      </div>
      <div className="participating-institutions-section__table-wrap">
        <Table<ParticipatingInstructorLectureReportRow>
          className="participating-institutions-section__table cms-data-table"
          rowKey="id"
          size="middle"
          pagination={false}
          scroll={{ x: 1280 }}
          columns={columns}
          dataSource={rows}
        />
      </div>
      <LectureReportIssuancePreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        context={previewContext}
      />
    </div>
  )
}

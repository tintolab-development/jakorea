import type { ColumnsType } from 'antd/es/table'
import type { SponsorProgramHistoryRow } from '@/features/sponsor/model/sponsor-management.types'
import { StatusBadge } from '@/shared/components/status-badge'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { getEnrollmentDisplayStatusFromProgramLifecycle } from '@/shared/constants/status'

const EDUCATION_TARGET_LABEL: Record<SponsorProgramHistoryRow['educationTarget'], string> = {
  elementary: '초등학생',
  middle: '중학생',
  high: '고등학생',
  college: '대학생',
  adult: '성인',
}

function renderParticipantType(_: unknown, row: SponsorProgramHistoryRow): string {
  if (row.participantType === 'school') return '학교/기관'
  if (row.participantType === 'volunteer') return '봉사자'
  return '개인 학습자'
}

/**
 * 후원사 프로그램 진행 이력 테이블 컬럼 정의를 생성합니다.
 *
 * @param totalCount 필터 적용 후 표시 행 수(역순 No. 계산에 사용)
 */
export function buildProgramHistoryColumns(
  totalCount: number
): ColumnsType<SponsorProgramHistoryRow> {
  return [
    {
      title: 'No.',
      key: 'no',
      width: TABLE_COLUMN_WIDTHS.index,
      align: 'center',
      render: (_: unknown, __: SponsorProgramHistoryRow, index: number) => totalCount - index,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 360,
      ellipsis: true,
    },
    {
      title: '진행년도',
      dataIndex: 'year',
      key: 'year',
      width: 90,
      align: 'center',
      render: (year: number) => `${year}년`,
    },
    {
      title: '프로그램 진행 현황',
      key: 'lifecycleStatus',
      width: 160,
      align: 'center',
      render: (_: unknown, row: SponsorProgramHistoryRow) => (
        <StatusBadge
          domain="programEnrollment"
          status={getEnrollmentDisplayStatusFromProgramLifecycle(row.lifecycleStatus)}
          variant="text"
        />
      ),
    },
    {
      title: '담당자명',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 100,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '참여자 모집 인원',
      dataIndex: 'participantCount',
      key: 'participantCount',
      width: 130,
      align: 'center',
    },
    {
      title: '참여자 유형',
      key: 'participantType',
      width: 120,
      align: 'center',
      render: renderParticipantType,
    },
    {
      title: '교육 대상',
      key: 'educationTarget',
      width: 120,
      align: 'center',
      render: (_: unknown, row: SponsorProgramHistoryRow) => EDUCATION_TARGET_LABEL[row.educationTarget],
    },
  ]
}

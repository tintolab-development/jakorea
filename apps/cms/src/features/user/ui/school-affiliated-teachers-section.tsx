/**
 * 학교 상세 — 기본 정보 하단 소속 교사 목록
 */

import { useMemo, useState, useId } from 'react'
import { Flex, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SchoolAffiliatedTeacherRow } from '@/types/user'
import { AppButton } from '@/shared/ui/app-button'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS, TABLE_CONFIG } from '@/shared/constants/table'
import { formatDate } from '@/shared/utils'

const EMPLOYMENT_LABEL: Record<SchoolAffiliatedTeacherRow['employmentStatus'], string> = {
  ACTIVE: '재직 중',
  WITHDRAWN: '탈퇴',
  TRANSFERRED: '전근',
}

export interface SchoolAffiliatedTeachersSectionProps {
  rows: SchoolAffiliatedTeacherRow[]
  /** 선택 교사 일괄 탈퇴 — 미지정 시 안내만 표시 */
  onWithdrawSelected?: (teacherIds: string[]) => void
  /** `linkedUserId`가 있는 행 클릭 시 해당 CMS 회원 상세로 이동 */
  onLinkedUserClick?: (linkedUserId: string) => void
}

function isCheckboxClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.ant-checkbox-wrapper, .ant-checkbox'))
}

export function SchoolAffiliatedTeachersSection({
  rows,
  onWithdrawSelected,
  onLinkedUserClick,
}: SchoolAffiliatedTeachersSectionProps) {
  const titleId = useId()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  type Row = SchoolAffiliatedTeacherRow & { key: string }

  const dataSource = useMemo<Row[]>(() => rows.map(r => ({ ...r, key: r.id })), [rows])

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: Row, index: number) => rows.length - index,
      },
      {
        title: '교사명',
        dataIndex: 'name',
        key: 'name',
        width: TABLE_COLUMN_WIDTHS.name,
        align: 'center',
      },
      {
        title: '담당 학년',
        dataIndex: 'assignedGrade',
        key: 'assignedGrade',
        width: 100,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: TABLE_COLUMN_WIDTHS.phone,
        align: 'center',
        render: (phone: string) => MASKING_POLICY.phone(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: TABLE_COLUMN_WIDTHS.email,
        align: 'center',
        render: (email: string) => MASKING_POLICY.email(email),
      },
      {
        title: '재직 현황',
        dataIndex: 'employmentStatus',
        key: 'employmentStatus',
        width: TABLE_COLUMN_WIDTHS.status,
        align: 'center',
        render: (s: SchoolAffiliatedTeacherRow['employmentStatus']) => EMPLOYMENT_LABEL[s] ?? '-',
      },
      {
        title: '가입일',
        dataIndex: 'joinedAt',
        key: 'joinedAt',
        width: TABLE_COLUMN_WIDTHS.date,
        align: 'center',
        render: (d: Row['joinedAt']) => formatDate(d),
      },
    ],
    [rows]
  )

  const handleWithdraw = () => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) return
    if (onWithdrawSelected) {
      onWithdrawSelected(ids)
    } else {
      message.info('선택한 교사 회원 탈퇴는 추후 연결됩니다.')
    }
  }

  const handleRowClick = (record: Row) => {
    if (!record.linkedUserId) {
      message.info('연결된 회원 정보가 없습니다.')
      return
    }
    onLinkedUserClick?.(record.linkedUserId)
  }

  return (
    <section className="user-basic-info-section" aria-labelledby={titleId}>
      <Flex justify="space-between" align="center" wrap="wrap" style={{ width: '100%', marginBottom: 12 }}>
        <div className="user-detail-section__head" style={{ marginBottom: 0 }}>
          <div id={titleId} className="user-detail-section__title">
            소속 교사 목록
          </div>
          <p className="user-detail-section__caption">총 {rows.length}건</p>
        </div>
        <AppButton
          variant="danger"
          size="filter"
          dangerFillOnHover
          disabled={selectedRowKeys.length === 0}
          onClick={handleWithdraw}
        >
          회원 탈퇴
        </AppButton>
      </Flex>
      <Table
        className="cms-data-table cms-data-table--fluid"
        rowSelection={{
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size={TABLE_CONFIG.size}
        bordered={TABLE_CONFIG.bordered}
        scroll={TABLE_CONFIG.scroll}
        rowKey="id"
        onRow={record => ({
          onClick: e => {
            if (isCheckboxClickTarget(e.target)) return
            handleRowClick(record)
          },
          style:
            record.linkedUserId && onLinkedUserClick
              ? { cursor: 'pointer' }
              : undefined,
        })}
      />
    </section>
  )
}

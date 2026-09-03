import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { ColumnsType } from 'antd/es/table'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import { buildTableExportMatrix } from './table-export'

type LoginRow = {
  adminName: string
  loginId: string
  loggedAt: string
  ipAddress: string
}

type SponsorshipStatusRow = { sponsorshipStatus: 'active' | 'ended' }

describe('buildTableExportMatrix', () => {
  it('aligns No. (render-only) with dataIndex columns like member login history', () => {
    const data: LoginRow[] = [
      {
        adminName: '홍길동',
        loginId: 'helpdesk2023@gmail.com',
        loggedAt: '2026-08-24T07:09:43.438Z',
        ipAddress: '14.90.80.100',
      },
      {
        adminName: '김철수',
        loginId: 'admin.kim@jakorea.org',
        loggedAt: '2026-08-24T02:09:43.438Z',
        ipAddress: '14.91.81.101',
      },
    ]

    const columns: ColumnsType<LoginRow> = [
      {
        title: 'No.',
        key: 'no',
        render: (_value, _row, index) => data.length - index,
      },
      { title: '관리자명', dataIndex: 'adminName', key: 'adminName' },
      { title: '아이디', dataIndex: 'loginId', key: 'loginId' },
      {
        title: '로그인 일시',
        dataIndex: 'loggedAt',
        key: 'loggedAt',
        render: (iso: string) => iso.slice(0, 19).replace('T', ' '),
      },
      { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress' },
    ]

    const { headers, rows } = buildTableExportMatrix(columns, data)

    expect(headers).toEqual(['No.', '관리자명', '아이디', '로그인 일시', 'IP'])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual([
      '2',
      '홍길동',
      'helpdesk2023@gmail.com',
      '2026-08-24 07:09:43',
      '14.90.80.100',
    ])
    expect(rows[1]).toEqual([
      '1',
      '김철수',
      'admin.kim@jakorea.org',
      '2026-08-24 02:09:43',
      '14.91.81.101',
    ])
  })

  it('omits action columns from both headers and rows', () => {
    const columns: ColumnsType<{ name: string }> = [
      { title: '이름', dataIndex: 'name', key: 'name' },
      { title: '관리', key: 'action', render: () => '삭제' },
    ]

    const { headers, rows } = buildTableExportMatrix(columns, [{ name: '홍길동' }])

    expect(headers).toEqual(['이름'])
    expect(rows).toEqual([['홍길동']])
  })

  it('falls back to dataIndex when render returns a non-element object', () => {
    const columns: ColumnsType<{ status: string }> = [
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        render: () => ({ type: 'tag', children: '표시용' }),
      },
    ]

    const { rows } = buildTableExportMatrix(columns, [{ status: 'ACTIVE' }])

    expect(rows).toEqual([['ACTIVE']])
  })

  it('exports badge labels from StatusDropdownCell-style renderBadge', () => {
    function StatusBadge({ status }: { status: SponsorshipStatusRow['sponsorshipStatus'] }) {
      return createElement('span', {
        label: status === 'active' ? '후원 중' : '후원 종료',
      })
    }

    const columns: ColumnsType<SponsorshipStatusRow> = [
      {
        title: '후원 상태',
        key: 'sponsorshipStatus',
        render: (_value, row) =>
          createElement('div', {
            status: row.sponsorshipStatus,
            renderBadge: (s: SponsorshipStatusRow['sponsorshipStatus']) =>
              createElement(StatusBadge, { status: s }),
          }),
      },
    ]

    const statusRows: SponsorshipStatusRow[] = [
      { sponsorshipStatus: 'active' },
      { sponsorshipStatus: 'ended' },
    ]
    const { headers, rows } = buildTableExportMatrix(columns, statusRows)

    expect(headers).toEqual(['후원 상태'])
    expect(rows).toEqual([['후원 중'], ['후원 종료']])
  })

  it('exports Korean labels from SponsorSponsorshipStatusBadge', () => {
    const columns: ColumnsType<SponsorshipStatusRow> = [
      {
        title: '후원 상태',
        dataIndex: 'sponsorshipStatus',
        key: 'sponsorshipStatus',
        render: (_value, row) =>
          createElement(SponsorSponsorshipStatusBadge, { status: row.sponsorshipStatus }),
      },
    ]

    const statusRows: SponsorshipStatusRow[] = [
      { sponsorshipStatus: 'active' },
      { sponsorshipStatus: 'ended' },
    ]
    const { rows } = buildTableExportMatrix(columns, statusRows)

    expect(rows).toEqual([['후원 중'], ['후원 종료']])
  })

  it('exports labels from StatusDropdownCell wrapping a status badge', () => {
    const columns: ColumnsType<SponsorshipStatusRow> = [
      {
        title: '후원 상태',
        dataIndex: 'sponsorshipStatus',
        key: 'sponsorshipStatus',
        render: (_value, row) =>
          createElement(StatusDropdownCell, {
            status: row.sponsorshipStatus,
            statusOptions: ['active', 'ended'] as const,
            renderBadge: (s: string) =>
              createElement(SponsorSponsorshipStatusBadge, {
                status: s as SponsorshipStatusRow['sponsorshipStatus'],
              }),
            isOpen: false,
            onOpenChange: () => undefined,
          }),
      },
    ]

    const statusRows: SponsorshipStatusRow[] = [
      { sponsorshipStatus: 'active' },
      { sponsorshipStatus: 'ended' },
    ]
    const { rows } = buildTableExportMatrix(columns, statusRows)

    expect(rows).toEqual([['후원 중'], ['후원 종료']])
  })
})

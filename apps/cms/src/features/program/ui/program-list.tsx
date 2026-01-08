/**
 * 프로그램 목록 컴포넌트
 * Phase 2.1: 테이블 + 필터 (기획자 요청: 다양한 컴포넌트 활용)
 */

import { Table, Input, Select, Button, Space, Tag, Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useProgramTable } from '../model/use-program-table'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  getCommonStatusLabel,
  getCommonStatusColor,
  programLifecycleStatusConfig,
  getProgramLifecycleLabel,
  getProgramLifecycleColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'

const { Option } = Select

interface ProgramListProps {
  data: Program[]
  loading?: boolean
  onView: (program: Program) => void
  onEdit?: (program: Program) => void // 관리자만 사용
  onDelete?: (program: Program) => void // 관리자만 사용
  showActions?: boolean // 작업 컬럼 표시 여부 (기본값: false, 관리자만 true)
  onChangeStatus?: (program: Program, status: ProgramLifecycleStatus) => void
  showFavorite?: boolean // 찜하기 컬럼 표시 여부 (기본값: false, 강사/봉사자/학생용)
}

const programTypes = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '하이브리드' },
]

const programFormats = [
  { value: 'workshop', label: '워크샵' },
  { value: 'seminar', label: '세미나' },
  { value: 'course', label: '과정' },
  { value: 'lecture', label: '강의' },
  { value: 'other', label: '기타' },
]

const statusOptions = programLifecycleStatusConfig.order.map(status => ({
  value: status,
  label: getProgramLifecycleLabel(status),
}))

export function ProgramList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  onChangeStatus,
  showFavorite = false,
}: ProgramListProps) {
  const { user } = useAuthStore()
  const { table, resetFilters } = useProgramTable(data)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const sponsors = sponsorService.getAllSync()

  // 찜하기 상태 로드
  useEffect(() => {
    if (showFavorite && user?.id && data.length > 0) {
      loadFavorites()
    }
  }, [showFavorite, user?.id, data])

  const loadFavorites = async () => {
    if (!user?.id) return

    try {
      const favoriteStatuses = await Promise.all(
        data.map(p => isFavoriteProgram(user.id!, p.id))
      )
      const favoriteSet = new Set<string>()
      data.forEach((p, index) => {
        if (favoriteStatuses[index]) {
          favoriteSet.add(p.id)
        }
      })
      setFavorites(favoriteSet)
    } catch (error) {
      console.error('관심 프로그램 상태 로드 실패:', error)
    }
  }

  const handleToggleFavorite = async (programId: string) => {
    if (!user?.id) return

    const isFavorite = favorites.has(programId)

    try {
      if (isFavorite) {
        await removeFavoriteProgram(user.id, programId)
        message.success('관심 프로그램에서 제거되었습니다.')
      } else {
        await addFavoriteProgram(user.id, programId)
        message.success('관심 프로그램에 추가되었습니다.')
      }

      setFavorites(prev => {
        const newSet = new Set(prev)
        if (isFavorite) {
          newSet.delete(programId)
        } else {
          newSet.add(programId)
        }
        return newSet
      })
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
      message.error('관심 프로그램 처리 중 오류가 발생했습니다.')
    }
  }

  const getMenuItems = (program: Program): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: '상세 보기',
        icon: <EyeOutlined />,
        onClick: () => onView(program),
      },
    ]

    // 관리자만 수정/삭제 메뉴 표시
    if (showActions && onEdit && onDelete) {
      items.push(
        {
          key: 'edit',
          label: '수정',
          icon: <EditOutlined />,
          onClick: () => onEdit(program),
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          label: '삭제',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onDelete(program),
        }
      )
    }

    return items
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Input
          placeholder="프로그램명 검색"
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('title')?.setFilterValue(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="스폰서 선택"
          value={(table.getColumn('sponsorId')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('sponsorId')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.label as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {sponsors.map(sponsor => (
            <Option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="유형 선택"
          value={(table.getColumn('type')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('type')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 120 }}
        >
          {programTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          value={(table.getColumn('lifecycleStatus')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('lifecycleStatus')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 200 }}
        >
          {statusOptions.map(status => (
            <Option key={status.value} value={status.value}>
              {status.label}
            </Option>
          ))}
        </Select>
        <Button onClick={() => resetFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '프로그램명',
            dataIndex: 'title',
            key: 'title',
            width: 260,
            ellipsis: true,
            render: (text: string) => (
              <Tag
                color={domainColorsHex.program.primary}
                style={{
                  maxWidth: 230,
                  display: 'inline-block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                }}
              >
                {text}
              </Tag>
            ),
          },
          {
            title: '스폰서',
            dataIndex: 'sponsorId',
            key: 'sponsorId',
            render: (sponsorId: string) => {
              return sponsorService.getNameById(sponsorId)
            },
          },
          {
            title: '유형',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
              const typeLabel = programTypes.find(t => t.value === type)?.label || type
              return <Tag>{typeLabel}</Tag>
            },
          },
          {
            title: '형태',
            dataIndex: 'format',
            key: 'format',
            render: (format: string) => {
              const formatLabel = programFormats.find(f => f.value === format)?.label || format
              return formatLabel
            },
          },
          {
            title: '회차',
            dataIndex: 'rounds',
            key: 'rounds',
            render: (rounds: Program['rounds']) => `${rounds?.length || 0}회차`,
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (_status: string, record: Program) => {
              const lifecycle = record.lifecycleStatus
              const label = lifecycle
                ? getProgramLifecycleLabel(lifecycle)
                : getCommonStatusLabel(_status)
              const color = lifecycle
                ? getProgramLifecycleColor(lifecycle)
                : getCommonStatusColor(record.status)
              const tag = <Tag color={color}>{label}</Tag>

              // 상태 변경 핸들러가 없으면 단순 뱃지로 표시
              if (!onChangeStatus) {
                return tag
              }

              const items: MenuProps['items'] = programLifecycleStatusConfig.order.map(
                status => {
                  const optionLabel = getProgramLifecycleLabel(status)
                  const optionColor = getProgramLifecycleColor(status)
                  return {
                    key: status,
                    label: (
                      <Tag color={optionColor} style={{ margin: 0 }}>
                        {optionLabel}
                      </Tag>
                    ),
                    onClick: (e) => {
                      e?.domEvent?.stopPropagation()
                      onChangeStatus(record, status)
                    },
                  }
                }
              )

              return (
                <div onClick={e => e.stopPropagation()}>
                  <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <span
                      className="program-status-dropdown-trigger"
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      {tag}
                    </span>
                  </Dropdown>
                </div>
              )
            },
          },
          // 찜하기 컬럼 (강사/봉사자/학생용)
          ...(showFavorite
            ? [
                {
                  title: '찜하기',
                  key: 'favorite',
                  width: 100,
                  fixed: showActions ? undefined : ('right' as const),
                  render: (_: unknown, record: Program) => (
                    <div onClick={e => e.stopPropagation()}>
                      <Button
                        type="text"
                        icon={favorites.has(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                        onClick={() => handleToggleFavorite(record.id)}
                      />
                    </div>
                  ),
                },
              ]
            : []),
          // 관리자만 작업 컬럼 표시
          ...(showActions
            ? [
                {
                  title: '작업',
                  key: 'action',
                  fixed: 'right' as const,
                  width: 80,
                  render: (_: unknown, record: Program) => (
                    <div onClick={e => e.stopPropagation()}>
                      <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          onClick={e => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rowKey="id"
        loading={loading}
        tableLayout="fixed"
        onRow={record => ({
          onClick: event => {
            const target = event.target as HTMLElement
            if (target.closest('.program-status-dropdown-trigger')) {
              return
            }
            onView(record)
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}

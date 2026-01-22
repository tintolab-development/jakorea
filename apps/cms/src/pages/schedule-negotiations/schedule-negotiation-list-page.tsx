/**
 * 일정 협의 관리 목록 페이지
 * V3 Phase 8
 */
import { useEffect, useMemo, useState } from 'react'
import { Button, Space, Modal, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useScheduleNegotiationStore } from '@/features/schedule-negotiation/model/schedule-negotiation-store'
import { ScheduleNegotiationList } from '@/features/schedule-negotiation/ui/schedule-negotiation-list'
import { ScheduleNegotiationForm, type ScheduleNegotiationFormData } from '@/features/schedule-negotiation/ui/schedule-negotiation-form'
import { ScheduleNegotiationDetailDrawer } from '@/features/schedule-negotiation/ui/schedule-negotiation-detail-drawer'
import type { ScheduleNegotiation } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'

const { Option } = Select

interface NegotiationQueryParams extends Record<string, string | undefined> {
  programId?: string
  schoolId?: string
  status?: ScheduleNegotiation['status']
}

export default function ScheduleNegotiationListPage() {
  const { items, loading, fetchAll, create, update, delete: remove } = useScheduleNegotiationStore()
  const { params, setParams, clearParams } = useQueryParams<NegotiationQueryParams>()
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduleNegotiation | null>(null)
  const [viewing, setViewing] = useState<ScheduleNegotiation | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const selectedProgramId = params.programId
  const selectedSchoolId = params.schoolId
  const selectedStatus = params.status

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (selectedProgramId && item.programId !== selectedProgramId) return false
      if (selectedSchoolId && item.schoolId !== selectedSchoolId) return false
      if (selectedStatus && item.status !== selectedStatus) return false
      return true
    })
  }, [items, selectedProgramId, selectedSchoolId, selectedStatus])

  const programs = programService.getAllSync()
  const schools = schoolService.getAllSync()

  const handleCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleView = (item: ScheduleNegotiation) => {
    setViewing(item)
    setDetailOpen(true)
  }

  const handleEdit = (item: ScheduleNegotiation) => {
    setEditing(item)
    setOpen(true)
  }

  const handleDelete = async (item: ScheduleNegotiation) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await remove(item.id)
      showSuccessMessage('삭제되었습니다.')
    } catch (error) {
      handleError(error, { context: 'ScheduleNegotiationListPage -> handleDelete' })
    }
  }

  const handleFormSubmit = async (data: ScheduleNegotiationFormData) => {
    setFormLoading(true)
    try {
      if (editing) {
        await update(editing.id, {
          programId: editing.programId,
          schoolId: data.schoolId,
          proposals: [
            {
              id: editing.proposals[0]?.id || `prop-${editing.id}-1`,
              date: data.proposals[0]?.date || new Date().toISOString(),
              startTime: data.proposals[0]?.startTime,
              endTime: data.proposals[0]?.endTime,
              status: data.proposals[0]?.status || 'pending',
              note: data.proposals[0]?.note,
            },
          ],
          status: data.status,
        })
        showSuccessMessage('수정되었습니다.')
      } else {
        await create({
          programId: data.programId,
          schoolId: data.schoolId,
          proposals: [
            {
              id: 'prop-temp-1',
              date: data.proposals[0]?.date || new Date().toISOString(),
              startTime: data.proposals[0]?.startTime,
              endTime: data.proposals[0]?.endTime,
              status: data.proposals[0]?.status || 'pending',
              note: data.proposals[0]?.note,
            },
          ],
          status: data.status,
        })
        showSuccessMessage('등록되었습니다.')
      }
      setOpen(false)
      setEditing(null)
    } catch (error) {
      handleError(error, { context: 'ScheduleNegotiationListPage -> handleFormSubmit' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setOpen(false)
    setEditing(null)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
        {/* <h1 style={{ margin: 0 }}>일정 협의 관리</h1> */}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          일정 협의 등록
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Select
          placeholder="프로그램 선택"
          value={selectedProgramId}
          onChange={value => setParams({ programId: value || undefined })}
          allowClear
          style={{ width: 220 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.children as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {programs.map(p => (
            <Option key={p.id} value={p.id}>
              {p.title}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="학교 선택"
          value={selectedSchoolId}
          onChange={value => setParams({ schoolId: value || undefined })}
          allowClear
          style={{ width: 220 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.children as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {schools.map(s => (
            <Option key={s.id} value={s.id}>
              {s.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태"
          value={selectedStatus}
          onChange={value => setParams({ status: (value as any) || undefined })}
          allowClear
          style={{ width: 160 }}
        >
          <Option value="proposed">제안</Option>
          <Option value="accepted">합의</Option>
          <Option value="rejected">거절</Option>
          <Option value="revised">재제안</Option>
        </Select>
        <Button onClick={() => clearParams()}>필터 초기화</Button>
      </Space>

      <ScheduleNegotiationList
        data={filtered}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={open}
        title={editing ? '일정 협의 수정' : '일정 협의 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <ScheduleNegotiationForm
          initial={editing || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
          fixedProgramId={selectedProgramId}
        />
      </Modal>

      <ScheduleNegotiationDetailDrawer
        open={detailOpen}
        negotiation={viewing}
        onClose={() => {
          setDetailOpen(false)
          setViewing(null)
        }}
        onEdit={() => {
          if (viewing) {
            setDetailOpen(false)
            setEditing(viewing)
            setOpen(true)
          }
        }}
        onDelete={async () => {
          if (viewing) {
            await handleDelete(viewing)
            setDetailOpen(false)
            setViewing(null)
          }
        }}
        onAccept={async () => {
          if (viewing) {
            try {
              await update(viewing.id, { status: 'accepted' })
              showSuccessMessage('합의 처리되었습니다.')
              setDetailOpen(false)
              setViewing(null)
            } catch (error) {
              handleError(error, { context: 'ScheduleNegotiationListPage -> onAccept' })
            }
          }
        }}
        onReject={async () => {
          if (viewing) {
            try {
              await update(viewing.id, { status: 'rejected' })
              showSuccessMessage('거절 처리되었습니다.')
              setDetailOpen(false)
              setViewing(null)
            } catch (error) {
              handleError(error, { context: 'ScheduleNegotiationListPage -> onReject' })
            }
          }
        }}
        loading={loading}
      />
    </div>
  )
}



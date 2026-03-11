/**
 * 일정 협의 관리 목록 페이지
 * V3 Phase 8
 */
import { useEffect, useMemo, useState } from 'react'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useScheduleNegotiationStore } from '@/features/schedule-negotiation/model/schedule-negotiation-store'
import { ScheduleNegotiationList } from '@/features/schedule-negotiation/ui/schedule-negotiation-list'
import {
  ScheduleNegotiationForm,
  type ScheduleNegotiationFormData,
} from '@/features/schedule-negotiation/ui/schedule-negotiation-form'
import { ScheduleNegotiationDetailDrawer } from '@/features/schedule-negotiation/ui/schedule-negotiation-detail-drawer'
import type { ScheduleNegotiation } from '@/types/domain'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { ListPageFilters } from '@/shared/ui/list-page-filters'

interface NegotiationQueryParams extends Record<string, string | undefined> {
  programId?: string
  schoolId?: string
  status?: ScheduleNegotiation['status']
}

export default function ScheduleNegotiationListPage() {
  const {
    items,
    loading,
    fetchAll,
    create,
    update,
    delete: remove,
    selectedNegotiation: storeSelectedNegotiation,
    setSelectedNegotiation,
    clearSelectedNegotiation,
  } = useScheduleNegotiationStore()
  const { params, setParams } = useQueryParams<NegotiationQueryParams>()
  const { getAllSync: getAllProgramsSync } = useProgramService()
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

  const programs = getAllProgramsSync()
  const schools = schoolService.getAllSync()

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof NegotiationQueryParams, value: any) => {
    setParams({ [key]: value || undefined })
  }

  // 필터 옵션
  const programOptions = useMemo(() => {
    return programs.map(p => ({ label: p.title, value: p.id }))
  }, [programs])

  const schoolOptions = useMemo(() => {
    return schools.map(s => ({ label: s.name, value: s.id }))
  }, [schools])

  const statusOptions = [
    { label: '제안', value: 'proposed' },
    { label: '합의', value: 'accepted' },
    { label: '거절', value: 'rejected' },
    { label: '재제안', value: 'revised' },
  ]

  const handleCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleView = (item: ScheduleNegotiation) => {
    setViewing(item)
    setSelectedNegotiation(item) // store에도 동기화
    setDetailOpen(true)
  }

  const handleEdit = (item: ScheduleNegotiation) => {
    setEditing(item)
    setOpen(true)
  }

  const handleDelete = async (item: ScheduleNegotiation) => {
    if (!confirm(MESSAGES.confirm.delete)) return
    try {
      await remove(item.id)
      showSuccessMessage(MESSAGES.success.deleted)
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
        showSuccessMessage(MESSAGES.success.updated)
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
        showSuccessMessage(MESSAGES.success.created)
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
      <Space style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, width: '100%', justifyContent: 'flex-end' }}>
        {/* <h1 style={{ margin: 0 }}>일정 협의 관리</h1> */}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          일정 협의 등록
        </Button>
      </Space>

      <ListPageFilters
        filters={{
          programId: selectedProgramId,
          schoolId: selectedSchoolId,
          status: selectedStatus,
        }}
        onFilterChange={handleFilterChange}
        filterConfig={[
          {
            key: 'programId',
            type: 'select',
            options: programOptions,
            placeholder: '프로그램 선택',
            style: { width: LAYOUT_CONSTANTS.widths.search },
          },
          {
            key: 'schoolId',
            type: 'select',
            options: schoolOptions,
            placeholder: '학교 선택',
            style: { width: LAYOUT_CONSTANTS.widths.search },
          },
          {
            key: 'status',
            type: 'select',
            options: statusOptions,
            placeholder: '상태',
            style: { width: LAYOUT_CONSTANTS.widths.filter },
          },
        ]}
        showReset={!!(selectedProgramId || selectedSchoolId || selectedStatus)}
      />

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
          clearSelectedNegotiation() // store도 초기화
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
              showSuccessMessage(MESSAGES.success.negotiationAgreed)
              // store의 update가 이미 selectedNegotiation을 업데이트하므로 로컬 상태도 동기화
              if (storeSelectedNegotiation) {
                setViewing(storeSelectedNegotiation)
              }
            } catch (error) {
              handleError(error, { context: 'ScheduleNegotiationListPage -> onAccept' })
            }
          }
        }}
        onReject={async () => {
          if (viewing) {
            try {
              await update(viewing.id, { status: 'rejected' })
              showSuccessMessage(MESSAGES.success.negotiationRejected)
              // store의 update가 이미 selectedNegotiation을 업데이트하므로 로컬 상태도 동기화
              if (storeSelectedNegotiation) {
                setViewing(storeSelectedNegotiation)
              }
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

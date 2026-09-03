/**
 * 담당자 등록 모달
 * 프로그램 상세 > 담당자 정보 탭 > 등록 버튼
 * ContentModal 레이아웃(패딩 28/30/34) · 권한 설정 Radio · 담당자명 Select
 */

import { useEffect, useMemo, useState } from 'react'
import { Form, Select, Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton, CmsRadio } from '@/shared/ui'
import type { ProgramRole } from '@/types/user'
import {
  PROGRAM_ROLE_LABELS,
  getAssignableManagerCandidates,
  type ProgramManagerRow,
} from '@/data/mock/program-managers'
import {
  canAddProgramPmFromPmCount,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import type { AssignableManagerCandidate } from '@/features/program/general/hooks/use-program-managers'
import './add-manager-modal.css'

const ROLE_OPTIONS: { label: string; value: ProgramRole }[] = [
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

type AddManagerModalFormValues = {
  managerPreset: string
  role: ProgramRole
}

export interface AddManagerFormValues {
  name: string
  email: string
  phone: string
  role: ProgramRole
  /** remote POST용 admin account id */
  adminId?: number
}

interface AddManagerModalProps {
  open: boolean
  onCancel: () => void
  /** PM(ProgramRole.OWNER) 인원 — 프로그램당 상한 검증용 */
  currentOwnerCount: number
  /** 이미 해당 프로그램 담당자로 등록된 이름 — 선택 목록에서 제외 */
  excludeManagerNames?: string[]
  /** remote 후보 목록 — 미지정 시 mock 후보 사용 */
  candidates?: AssignableManagerCandidate[]
  candidatesLoading?: boolean
  confirmLoading?: boolean
  /** false 반환 시 모달을 닫지 않음 (API 실패 등) */
  onAdd: (values: AddManagerFormValues) => boolean | void | Promise<boolean | void>
}

export function AddManagerModal({
  open,
  onCancel,
  currentOwnerCount,
  excludeManagerNames = [],
  candidates,
  candidatesLoading = false,
  confirmLoading = false,
  onAdd,
}: AddManagerModalProps) {
  const [form] = Form.useForm<AddManagerModalFormValues>()
  const [showOwnerLimitModal, setShowOwnerLimitModal] = useState(false)

  const assignablePool = useMemo((): AssignableManagerCandidate[] => {
    if (candidates) return candidates
    // mock 후보는 adminId 없음 — remote 후보와 동일 shape로 맞춤
    return getAssignableManagerCandidates(excludeManagerNames).map(c => ({ ...c }))
  }, [candidates, excludeManagerNames])

  useEffect(() => {
    if (!open) return
    form.resetFields()
    if (!canAddProgramPmFromPmCount(currentOwnerCount)) {
      form.setFieldsValue({ role: 'PARTNER' })
    }
  }, [open, form, currentOwnerCount])

  useEffect(() => {
    if (!open) setShowOwnerLimitModal(false)
  }, [open])

  const handleSubmit = async (values: AddManagerModalFormValues) => {
    const picked = assignablePool.find(m => m.id === values.managerPreset)
    if (!picked) return

    if (values.role === 'OWNER' && !canAddProgramPmFromPmCount(currentOwnerCount)) {
      setShowOwnerLimitModal(true)
      return
    }

    const result = await onAdd({
      name: picked.name,
      email: picked.email,
      phone: picked.phone,
      role: values.role,
      adminId: picked.adminId,
    })
    if (result === false) return
    form.resetFields()
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleCancel} disabled={confirmLoading}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        loading={confirmLoading}
        onClick={() => form.submit()}
      >
        담당자 등록
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="담당자 등록"
        width={600}
        footer={footer}
        className="add-manager-modal"
      >
        <div className="add-manager-modal__body">
          <Form<AddManagerModalFormValues>
            form={form}
            layout="vertical"
            className="add-manager-modal__form"
            onFinish={values => {
              void handleSubmit(values)
            }}
            initialValues={{ managerPreset: undefined, role: 'OWNER' }}
            requiredMark={false}
          >
            <Form.Item name="role" label="권한 설정" className="add-manager-modal__field">
              <CmsRadio.Group className="add-manager-modal__role-radios" size="large">
                {ROLE_OPTIONS.map(opt => (
                  <CmsRadio
                    key={opt.value}
                    value={opt.value}
                    disabled={
                      opt.value === 'OWNER' && !canAddProgramPmFromPmCount(currentOwnerCount)
                    }
                  >
                    {opt.label}
                  </CmsRadio>
                ))}
              </CmsRadio.Group>
            </Form.Item>

            <Form.Item name="managerPreset" label="담당자명" className="add-manager-modal__field">
              <Select
                placeholder="담당자를 선택하세요"
                size="large"
                allowClear
                loading={candidatesLoading}
                className="add-manager-modal__select"
                options={assignablePool.map(m => ({
                  value: m.id,
                  label: m.name,
                }))}
                notFoundContent={
                  candidatesLoading ? (
                    <Spin size="small" />
                  ) : assignablePool.length === 0 ? (
                    '등록 가능한 담당자가 없습니다'
                  ) : undefined
                }
                getPopupContainer={() => document.body}
              />
            </Form.Item>
          </Form>
        </div>
      </ContentModal>

      <ActionResultModal
        open={showOwnerLimitModal}
        onClose={() => setShowOwnerLimitModal(false)}
        title="설정 불가"
        body={PROGRAM_PM_ROLE_LIMIT_MESSAGE}
        zIndex={2010}
      />
    </>
  )
}

/** 등록일시 포맷: YYYY.MM.DD HH:mm */
function formatRegisteredAt(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${h}:${min}`
}

/** 폼 값으로 새 담당자 행 생성 (목록 추가용) */
export function buildManagerRowFromForm(
  values: AddManagerFormValues,
  nextNo: number,
  nextId: string
): ProgramManagerRow {
  return {
    id: nextId,
    no: nextNo,
    name: values.name,
    role: values.role,
    phone: values.phone,
    email: values.email,
    registeredAt: formatRegisteredAt(new Date()),
    adminId: values.adminId,
  }
}

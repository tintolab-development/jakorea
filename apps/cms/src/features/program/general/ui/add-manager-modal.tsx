/**
 * 담당자 추가 등록 모달
 * 프로그램 상세 > 담당자 정보 탭 > 담당자 등록
 * ContentModal · 권한 설정 CmsRadio · 담당자 CmsSelect
 */

import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { RefSelectProps } from 'antd/es/select'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton, CmsRadio, CmsSelect, type CmsSelectProps } from '@/shared/ui'
import { FieldSearchIcon } from '@/shared/ui/icons'
import type { ProgramRole } from '@/types/user'
import {
  formatAddProgramManagerRegistrationHint,
  PROGRAM_ROLE_LABELS,
  type ProgramManagerRow,
} from '@/features/program/general/model/program-managers'
import {
  canAddProgramPmFromPmCount,
  canAssignProgramRoleToCmsAdmin,
  CMS_MASTER_CANNOT_BE_PROGRAM_OWNER_MESSAGE,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import type { AssignableManagerCandidate } from '@/features/program/general/hooks/use-program-managers'
import './add-manager-modal.css'

/** Form.Item 연동 + 좌측 돋보기 — 키워드는 서버 검색(onSearch), 로컬 필터 미사용 */
const ManagerPresetSelect = forwardRef<RefSelectProps, CmsSelectProps>(
  function ManagerPresetSelect(props, ref) {
    return (
      <div className="add-manager-modal__manager-select-shell">
        <span className="add-manager-modal__leading-icon cms-field__icon" aria-hidden>
          <FieldSearchIcon />
        </span>
        <CmsSelect ref={ref} allowClear={false} showSearch={false} {...props} />
      </div>
    )
  }
)

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
  cmsRoleCode?: string
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
  /** 담당자 키워드 입력 — GET /admin-accounts?keyword=… 서버 검색 트리거 */
  onCandidateSearch?: (keyword: string) => void
  confirmLoading?: boolean
  afterOpenChange?: (open: boolean) => void
  /** false 반환 시 모달을 닫지 않음 (API 실패 등) */
  onAdd: (values: AddManagerFormValues) => boolean | void | Promise<boolean | void>
  /**
   * 열릴 때 기본 선택 권한. 생략 시 기존처럼 Program Owner(UJAT·1사1교·Gemini),
   * `null`이면 미선택으로 연다(일반 프로그램 시안).
   */
  defaultRole?: ProgramRole | null
}

export function AddManagerModal({
  open,
  onCancel,
  currentOwnerCount,
  excludeManagerNames: _excludeManagerNames = [],
  candidates,
  candidatesLoading = false,
  onCandidateSearch,
  confirmLoading = false,
  afterOpenChange,
  onAdd,
  defaultRole = 'OWNER',
}: AddManagerModalProps) {
  const [form] = Form.useForm<AddManagerModalFormValues>()
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const selectedRole = Form.useWatch('role', form)
  const ownerSlotAvailable = canAddProgramPmFromPmCount(currentOwnerCount)
  const assignablePool = useMemo((): AssignableManagerCandidate[] => {
    const pool = candidates ?? []
    if (!selectedRole) return pool
    return pool.filter(m => canAssignProgramRoleToCmsAdmin(m.cmsRoleCode, selectedRole))
  }, [candidates, selectedRole])
  const selectedManagerId = Form.useWatch('managerPreset', form)
  /** 검색 키워드가 바뀌어 후보 목록이 갱신돼도 선택한 담당자를 유지한다. */
  const [pickedCandidate, setPickedCandidate] = useState<AssignableManagerCandidate | null>(null)
  const selectedCandidate = useMemo((): AssignableManagerCandidate | null => {
    if (!selectedManagerId) return null
    const fromPool = assignablePool.find(m => m.id === selectedManagerId)
    if (fromPool) return fromPool
    if (pickedCandidate?.id !== selectedManagerId) return null
    if (
      selectedRole &&
      !canAssignProgramRoleToCmsAdmin(pickedCandidate.cmsRoleCode, selectedRole)
    ) {
      return null
    }
    return pickedCandidate
  }, [assignablePool, pickedCandidate, selectedManagerId, selectedRole])
  const managerSelectOptions = useMemo(() => {
    const options = assignablePool.map(m => ({
      value: m.id,
      label: m.name,
    }))
    if (selectedCandidate && !assignablePool.some(m => m.id === selectedCandidate.id)) {
      options.unshift({ value: selectedCandidate.id, label: selectedCandidate.name })
    }
    return options
  }, [assignablePool, selectedCandidate])

  useEffect(() => {
    if (!open) return
    form.resetFields()
    if (defaultRole !== null && !ownerSlotAvailable) {
      form.setFieldsValue({ role: 'PARTNER' })
    }
  }, [open, form, ownerSlotAvailable, defaultRole])

  useEffect(() => {
    if (!open) setBlockMessage(null)
  }, [open])

  useEffect(() => {
    if (!open || !selectedManagerId || selectedCandidate) return
    form.setFieldsValue({ managerPreset: undefined })
  }, [form, open, selectedCandidate, selectedManagerId])

  const handleManagerSelect = (value: unknown) => {
    setPickedCandidate(assignablePool.find(m => m.id === String(value)) ?? null)
  }

  const handleSubmit = async (values: AddManagerModalFormValues) => {
    const picked = selectedCandidate?.id === values.managerPreset ? selectedCandidate : null
    if (!picked) return

    if (values.role === 'OWNER' && !ownerSlotAvailable) {
      setBlockMessage(PROGRAM_PM_ROLE_LIMIT_MESSAGE)
      return
    }
    if (!canAssignProgramRoleToCmsAdmin(picked.cmsRoleCode, values.role)) {
      const allowedRole = ROLE_OPTIONS.map(opt => opt.value).find(role =>
        canAssignProgramRoleToCmsAdmin(picked.cmsRoleCode, role)
      )
      setBlockMessage(
        allowedRole
          ? formatAddProgramManagerRegistrationHint(allowedRole)
          : CMS_MASTER_CANNOT_BE_PROGRAM_OWNER_MESSAGE
      )
      return
    }

    const result = await onAdd({
      name: picked.name,
      email: picked.email,
      phone: picked.phone,
      role: values.role,
      adminId: picked.adminId,
      cmsRoleCode: picked.cmsRoleCode,
    })
    if (result === false) return
    form.resetFields()
    setPickedCandidate(null)
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    setPickedCandidate(null)
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
        추가 등록
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="담당자 추가 등록"
        width={600}
        footer={footer}
        className="add-manager-modal"
        titleBodyGap="list-settings"
        afterOpenChange={afterOpenChange}
      >
        <div className="add-manager-modal__body">
          <Form<AddManagerModalFormValues>
            form={form}
            layout="vertical"
            className="add-manager-modal__form"
            colon={false}
            requiredMark={false}
            onFinish={values => {
              void handleSubmit(values)
            }}
            initialValues={{ managerPreset: undefined, role: defaultRole ?? undefined }}
          >
            <Form.Item
              name="role"
              rules={[{ required: true, message: '권한을 선택해 주세요' }]}
              className="add-manager-modal__field"
            >
              <CmsRadio.Group label="권한 설정" required size="medium">
                {ROLE_OPTIONS.map(opt => (
                  <CmsRadio
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.value === 'OWNER' && !ownerSlotAvailable}
                  >
                    {opt.label}
                  </CmsRadio>
                ))}
              </CmsRadio.Group>
            </Form.Item>

            <Form.Item
              name="managerPreset"
              rules={[{ required: true, message: '추가 등록할 담당자를 선택해 주세요' }]}
              className="add-manager-modal__field add-manager-modal__field--manager-select"
            >
              <ManagerPresetSelect
                label="담당자 추가"
                required
                inputSize="medium"
                placeholder="추가 등록할 담당자를 선택해 주세요"
                width="100%"
                withAllOption={false}
                showSearch
                filterOption={false}
                onSearch={onCandidateSearch}
                onSelect={handleManagerSelect}
                loading={candidatesLoading}
                options={managerSelectOptions}
                notFoundContent={
                  assignablePool.length === 0 && !candidatesLoading
                    ? '등록 가능한 담당자가 없습니다'
                    : undefined
                }
                getPopupContainer={() => document.body}
              />
            </Form.Item>
          </Form>
        </div>
      </ContentModal>

      <ActionResultModal
        open={Boolean(blockMessage)}
        onClose={() => setBlockMessage(null)}
        title="설정 불가"
        body={blockMessage ?? ''}
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
    cmsRoleCode: values.cmsRoleCode,
  }
}

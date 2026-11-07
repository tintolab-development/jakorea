/**
 * 일반 프로그램「추가 배정」모달 공통 UI — Figma CMS 9760:8214
 * - 강사 추가 배정 안내(기관 상세) · 기관 추가 배정 안내(기관형 회원 상세) · 추가 배정 안내(개인형)
 * - 셸: ContentModal 600 · 제목 24 · 설명 16 · 필수 * · 취소/배정(우측)
 * - 필드: [대표 강사 지정] → [강사명|기관명] → 교육·봉사 배정일(칩 리스트)
 * 배정 API·정책은 호출부(섹션/훅)가 가진다. 이 파일은 표시·선택 상태만 다룬다.
 */

import { useEffect, type ReactNode } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsRadio, CmsSelect } from '@/shared/ui'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import {
  pruneAddAssignSessionSelection,
  toggleAddAssignSessionSelection,
  type AddAssignSelectionMode,
} from '@/features/program/general/lib/general-add-assign-session-chips'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import './school-detail-add-instructor-assign-modal.css'

export const GENERAL_ADD_ASSIGN_MODAL_WIDTH = 600
export const GENERAL_ADD_ASSIGN_MODAL_CLASS_NAME = 'school-detail-add-instructor-assign-modal'

export function AddAssignRequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <span className="school-detail-add-instructor-assign-modal__required" aria-hidden>
        *
      </span>
    </>
  )
}

export interface AddAssignSessionChipListProps {
  value?: string[]
  onChange?: (ids: string[]) => void
  options: InstructorAssignSessionOption[]
  selectionMode?: AddAssignSelectionMode
  ariaLabel?: string
  emptyText?: string
}

/** 교육·봉사 배정일 칩 리스트 — 선택/미선택/선택 불가 (선택 불가는 button disabled → 클릭·키보드 불가) */
export function AddAssignSessionChipList({
  value,
  onChange,
  options,
  selectionMode = 'multiple',
  ariaLabel = '교육 배정일 선택',
  emptyText = '선택 가능한 교육 일정이 없습니다.',
}: AddAssignSessionChipListProps) {
  const selectedIds = value ?? []

  // 기관·강사 변경으로 옵션이 바뀌면 남아 있는 무효 선택을 정리한다
  useEffect(() => {
    if (!onChange || selectedIds.length === 0) return
    const pruned = pruneAddAssignSessionSelection(selectedIds, options)
    if (pruned.length !== selectedIds.length) onChange(pruned)
  }, [options, selectedIds, onChange])

  if (options.length === 0) {
    return <p className="school-detail-add-instructor-assign-modal__session-empty">{emptyText}</p>
  }
  return (
    <div
      className="school-detail-add-instructor-assign-modal__session-grid"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map(opt => {
        const disabled = Boolean(opt.disabled)
        return (
          <InstructorAssignSessionSlotChip
            key={opt.id}
            scheduleLabel={opt.scheduleLabel}
            sessionRoundLabel={opt.sessionRoundLabel}
            capacityLabel={opt.capacityLabel}
            selected={selectedIds.includes(opt.id)}
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              onChange?.(toggleAddAssignSessionSelection(selectedIds, opt.id, selectionMode))
            }}
          />
        )
      })}
    </div>
  )
}

export function AddAssignRoleRadios({
  value,
  onChange,
}: {
  value?: InstructorRoleKey
  onChange?: (role: InstructorRoleKey) => void
}) {
  return (
    <CmsRadio.Group
      className="school-detail-add-instructor-assign-modal__role-radios"
      size="medium"
      value={value}
      onChange={e => onChange?.(e.target.value as InstructorRoleKey)}
      options={[
        { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
        { label: INSTRUCTOR_ROLE_LABELS.assistant, value: 'assistant' as InstructorRoleKey },
      ]}
    />
  )
}

export interface GeneralParticipantAddAssignModalProps {
  open: boolean
  onCancel: () => void
  title: string
  /** `**[이름]** 님을 …` 형식 (ContentModal description 마크다운) */
  description: string
  confirmLabel?: string
  onConfirm: () => void
  confirmLoading?: boolean
  /** 강사만: 대표 강사 지정 (봉사자는 null) */
  role?: { value: InstructorRoleKey; onChange: (role: InstructorRoleKey) => void } | null
  /** 기관형만: 강사명 또는 기관명 선택 (개인형은 null) */
  target?: {
    label: string
    placeholder: string
    options: { value: string; label: string }[]
    value: string | null
    onChange: (value: string | null) => void
    notFoundContent?: ReactNode
  } | null
  sessions: {
    label: string
    options: InstructorAssignSessionOption[]
    value: string[]
    onChange: (ids: string[]) => void
    selectionMode: AddAssignSelectionMode
    emptyText?: string
  }
}

export function GeneralParticipantAddAssignModal({
  open,
  onCancel,
  title,
  description,
  confirmLabel = '배정',
  onConfirm,
  confirmLoading = false,
  role = null,
  target = null,
  sessions,
}: GeneralParticipantAddAssignModalProps) {
  const handleCancel = () => {
    if (confirmLoading) return
    onCancel()
  }
  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title={title}
      width={GENERAL_ADD_ASSIGN_MODAL_WIDTH}
      description={description}
      className={GENERAL_ADD_ASSIGN_MODAL_CLASS_NAME}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            onClick={handleCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            onClick={() => {
              if (confirmLoading) return
              onConfirm()
            }}
            loading={confirmLoading}
            disabled={confirmLoading}
          >
            {confirmLabel}
          </CmsButton>
        </>
      }
    >
      <div className="school-detail-add-instructor-assign-modal__body">
        <div className="school-detail-add-instructor-assign-modal__fields">
          {role ? (
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                <AddAssignRequiredLabel>대표 강사 지정</AddAssignRequiredLabel>
              </div>
              <AddAssignRoleRadios value={role.value} onChange={role.onChange} />
            </div>
          ) : null}
          {target ? (
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                <AddAssignRequiredLabel>{target.label}</AddAssignRequiredLabel>
              </div>
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                className="school-detail-add-instructor-assign-modal__select"
                placeholder={target.placeholder}
                options={target.options}
                value={target.value ?? undefined}
                onChange={value => target.onChange(value ? String(value) : null)}
                getPopupContainer={() => document.body}
                notFoundContent={target.notFoundContent}
              />
            </div>
          ) : null}
          <div className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions">
            <div className="school-detail-add-instructor-assign-modal__field-label">
              <AddAssignRequiredLabel>{sessions.label}</AddAssignRequiredLabel>
            </div>
            <AddAssignSessionChipList
              value={sessions.value}
              onChange={sessions.onChange}
              options={sessions.options}
              selectionMode={sessions.selectionMode}
              ariaLabel={sessions.label}
              emptyText={sessions.emptyText}
            />
          </div>
        </div>
      </div>
    </ContentModal>
  )
}

/**
 * 삭제 안내 모달 (재확인) — 담당자/학교 등 공통
 * 헤더 없음. 타이틀 22px 700, 본문 16px 500, [이름] 볼드 700
 */

import { Modal } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import './manager-delete-guide-modal.css'

/** 공통 삭제 안내 모달: title + lines + 확인 버튼 문구/스타일 */
export interface DeleteGuideModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  lines: string[]
  /** 확인 버튼 문구 (기본: 삭제) */
  confirmText?: string
  /** 확인 버튼 스타일 (기본: danger) */
  confirmVariant?: 'danger' | 'primary'
}

/** 담당자 삭제 전용 props (기존 호환) */
export interface ManagerDeleteGuideModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 삭제할 담당자 이름 목록 */
  managerNames: string[]
}

/** 담당자 삭제 문구 생성 */
export function buildManagerMessageLines(names: string[]): string[] {
  if (names.length === 0) return []
  if (names.length === 1) {
    const name = names[0]
    return [
      `[${name}] 매니저를 해당 프로젝트 담당자 목록에서 삭제하시겠습니까?`,
      `삭제 시 [${name}] 매니저님은 해당 프로젝트의 권한을 모두 잃게됩니다.`,
      '정말로 삭제하시겠습니까?',
    ]
  }
  const count = names.length
  const nameList = names.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}명의 담당자(${nameList})를 해당 프로젝트 담당자 목록에서 삭제하시겠습니까?`,
    `삭제 시 해당 담당자들은 프로젝트의 권한을 모두 잃게 됩니다.`,
    '정말로 삭제하시겠습니까?',
  ]
}

/** 학교 삭제 문구 생성 */
export function buildSchoolMessageLines(names: string[]): string[] {
  if (names.length === 0) return []
  if (names.length === 1) {
    const name = names[0]
    return [
      `[${name}] 학교를 해당 프로그램 참여 학교 목록에서 삭제하시겠습니까?`,
      `삭제 시 [${name}] 학교는 해당 프로그램 참여가 해제됩니다.`,
      '정말로 삭제하시겠습니까?',
    ]
  }
  const count = names.length
  const nameList = names.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}건의 학교(${nameList})를 해당 프로그램 참여 학교 목록에서 삭제하시겠습니까?`,
    `삭제 시 해당 학교들은 프로그램 참여가 해제됩니다.`,
    '정말로 삭제하시겠습니까?',
  ]
}

/** 학교 신청 선택 반려 문구 생성 (신청자 목록 탭 - 수강 신청 학교) */
export function buildSchoolRejectMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 학교 신청을 반려하시겠습니까?`,
    '반려 시 해당 학교들의 신청 상태가 [신청 반려]로 변경됩니다.',
    '정말로 반려하시겠습니까?',
  ]
}

/** 학교 신청 선택 승인 문구 생성 (신청자 목록 탭 - 수강 신청 학교) */
export function buildSchoolApproveMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 학교 신청을 승인하시겠습니까?`,
    '승인 시 해당 학교들의 신청 상태가 [승인 완료]로 변경됩니다.',
    '정말로 승인하시겠습니까?',
  ]
}

/** 참여기관 학교 상세 - 승인 취소 확인 문구 생성 */
export function buildSchoolCancelApprovalMessageLines(schoolName: string): string[] {
  return [
    `[${schoolName}] 기관의 참여 승인을 취소하시겠습니까?`,
    '취소 시 프로그램 승인 현황이 [승인 취소]로 변경됩니다.',
    '정말로 취소하시겠습니까?',
  ]
}

/** 강사 삭제 문구 생성 */
export function buildInstructorMessageLines(names: string[]): string[] {
  if (names.length === 0) return []
  if (names.length === 1) {
    const name = names[0]
    return [
      `[${name}] 강사를 해당 프로그램 참여 강사 목록에서 삭제하시겠습니까?`,
      `삭제 시 [${name}] 강사님은 해당 프로그램 참여가 해제됩니다.`,
      '정말로 삭제하시겠습니까?',
    ]
  }
  const count = names.length
  const nameList = names.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}명의 강사(${nameList})를 해당 프로그램 참여 강사 목록에서 삭제하시겠습니까?`,
    `삭제 시 해당 강사들은 프로그램 참여가 해제됩니다.`,
    '정말로 삭제하시겠습니까?',
  ]
}

/** 강사 신청 선택 반려 문구 생성 (신청자 목록 탭) */
export function buildInstructorRejectMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 강사 신청을 반려하시겠습니까?`,
    '반려 시 해당 강사들의 신청 상태가 [신청 반려]로 변경됩니다.',
    '정말로 반려하시겠습니까?',
  ]
}

/** 강사 신청 선택 승인 문구 생성 (신청자 목록 탭) */
export function buildInstructorApproveMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 강사 신청을 승인하시겠습니까?`,
    '승인 시 해당 강사들의 신청 상태가 [승인 완료]로 변경됩니다.',
    '정말로 승인하시겠습니까?',
  ]
}

/** 회원 삭제 안내 문구 생성 (회원관리 > 전체 회원) */
export function buildMemberDeleteMessageLines(
  singleUser: { name: string; email: string } | null,
  bulkCount: number
): string[] {
  if (bulkCount > 1) {
    return [
      `선택한 ${bulkCount}명의 회원을 삭제하시겠습니까?`,
      '삭제된 회원은 복구할 수 없습니다.',
      '정말로 삭제하시겠습니까?',
    ]
  }
  if (singleUser) {
    return [
      `[${singleUser.name}] (${singleUser.email}) 회원을 삭제하시겠습니까?`,
      '삭제된 회원은 복구할 수 없습니다.',
      '정말로 삭제하시겠습니까?',
    ]
  }
  return []
}

/** 회원 탈퇴 안내 문구 생성 (회원 상세 모달 > 탈퇴 버튼) */
export function buildMemberWithdrawMessageLines(singleUser: {
  name: string
  email: string
} | null): string[] {
  if (!singleUser) return []
  return [
    `[${singleUser.name}] (${singleUser.email}) 회원을 탈퇴 처리하시겠습니까?`,
    '탈퇴된 회원은 복구할 수 없습니다.',
    '정말로 탈퇴하시겠습니까?',
  ]
}

/** 문장에서 [xxx] 부분을 볼드(700)로 감싸서 React 노드로 반환 */
function renderLineWithBoldBrackets(line: string) {
  const parts = line.split(/(\[[^\]]+\])/g)
  return parts.map((part, i) =>
    /^\[.+\]$/.test(part) ? (
      <strong key={i} className="manager-delete-guide-modal__bold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

/** 공통 삭제 안내 모달 (제목·본문 라인·확인 버튼 문구/스타일) */
export function DeleteGuideModal({
  open,
  onCancel,
  onConfirm,
  title,
  lines,
  confirmText = '삭제',
  confirmVariant = 'danger',
}: DeleteGuideModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      closable={false}
      footer={null}
      width={600}
      className="manager-delete-guide-modal__root"
      centered
      maskClosable
      destroyOnClose
    >
      <div className="manager-delete-guide-modal__content">
        <button
          type="button"
          className="manager-delete-guide-modal__close"
          onClick={onCancel}
          aria-label="닫기"
        >
          <CloseOutlined />
        </button>

        <h2 className="manager-delete-guide-modal__title">{title}</h2>

        <div className="manager-delete-guide-modal__body">
          {lines.map((line, i) => (
            <p key={i} className="manager-delete-guide-modal__line">
              {renderLineWithBoldBrackets(line)}
            </p>
          ))}
        </div>

        <div className="manager-delete-guide-modal__footer">
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton
            variant={confirmVariant}
            size="large"
            {...(confirmVariant === 'danger' ? { dangerFillOnHover: true } : {})}
            onClick={onConfirm}
          >
            {confirmText}
          </AppButton>
        </div>
      </div>
    </Modal>
  )
}

/** 담당자 삭제 안내 모달 (기존 호환) */
export function ManagerDeleteGuideModal({
  open,
  onCancel,
  onConfirm,
  managerNames,
}: ManagerDeleteGuideModalProps) {
  const lines = buildManagerMessageLines(managerNames)
  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="담당자 삭제 안내"
      lines={lines}
    />
  )
}

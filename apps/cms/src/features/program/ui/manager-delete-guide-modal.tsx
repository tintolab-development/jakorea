/**
 * 삭제 안내 문구 조합 및 담당자 삭제 모달
 * 모달 UI는 `@/shared/ui/delete-guide-modal` (공통)
 */

export { DeleteGuideModal, type DeleteGuideModalProps } from '@/shared/ui/delete-guide-modal'

import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'

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
      `삭제 시 [${name}] 매니저님은 해당 프로젝트의 권한을 모두 잃게 됩니다.`,
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

/** 프로그램 진행 현황 > 참여 기관 — 선택 삭제 확인 본문 */
export function buildParticipatingInstitutionDeleteMessageLines(schoolNames: string[]): string[] {
  if (schoolNames.length === 0) return []
  const line2 = '삭제 시 승인 철회 처리되며, 등록된 정보는 모두 삭제됩니다.'
  const line3 = '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'
  if (schoolNames.length === 1) {
    const name = schoolNames[0]
    return [`[${name}]를 참여 기관 목록에서 삭제하시겠습니까?`, line2, line3]
  }
  const count = schoolNames.length
  const nameList = schoolNames.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}건의 참여 기관(${nameList})을 참여 기관 목록에서 삭제하시겠습니까?`,
    line2,
    line3,
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
export function buildMemberWithdrawMessageLines(
  singleUser: {
    name: string
    email: string
  } | null
): string[] {
  if (!singleUser) return []
  return [
    `[${singleUser.name}] (${singleUser.email}) 회원을 탈퇴 처리하시겠습니까?`,
    '탈퇴된 회원은 복구할 수 없습니다.',
    '정말로 탈퇴하시겠습니까?',
  ]
}

/** 학교(기관) 상세 > 학교 삭제 확인 문구 */
export function buildSchoolDeleteMessageLines(
  singleUser: {
    name: string
    email: string
  } | null
): string[] {
  if (!singleUser) return []
  return [
    `[${singleUser.name}] (${singleUser.email}) 학교(기관) 계정을 삭제하시겠습니까?`,
    '삭제된 계정은 복구할 수 없습니다.',
    '정말로 삭제하시겠습니까?',
  ]
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
      confirmText="담당자 삭제"
    />
  )
}

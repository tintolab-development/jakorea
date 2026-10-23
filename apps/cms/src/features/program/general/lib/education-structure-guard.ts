export const EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE = '교육구조 변경 안내'

export const EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE =
  '교육구조를 변경하면 이전 교육구조에 입력한 회차 또는 일정 정보가 삭제됩니다.\n변경하시겠습니까?'

export const PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES = {
  PROGRAM_EDUCATION_STRUCTURE_RESET_REQUIRED:
    '교육구조를 변경하려면 이전 교육구조의 회차 또는 일정 정보를 비워야 합니다.',
  PROGRAM_EDUCATION_STRUCTURE_PAYLOAD_REQUIRED:
    '변경할 교육구조의 회차 또는 일정 정보를 입력해 주세요.',
  PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED:
    '이미 신청·배정 또는 교육 운영 이력이 있는 프로그램은 교육구조를 변경할 수 없습니다.',
  PROGRAM_EDUCATION_STRUCTURE_CHANGE_CONCURRENT:
    '다른 관리자가 프로그램 정보를 변경했습니다. 최신 정보를 확인한 후 다시 시도해 주세요.',
  GENERAL_CURRICULUM_SESSION_IN_USE:
    '설문에 연결된 교육 회차가 있어 교육구조를 변경할 수 없습니다.',
} as const

export type ProgramEducationStructureGuardCode =
  keyof typeof PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES

export function isProgramEducationStructureGuardCode(
  code: string | undefined
): code is ProgramEducationStructureGuardCode {
  return Boolean(code && code in PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES)
}

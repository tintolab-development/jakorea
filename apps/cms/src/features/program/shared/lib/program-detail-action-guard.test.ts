import { describe, expect, it } from 'vitest'
import {
  classifyProgramDetailActionLabel,
  resolveProgramDetailActionPermissions,
} from './program-detail-action-guard'

const viewerAssignment = {
  assigned: true,
  assignmentRole: 'VIEWER',
  masterBypass: false,
  capabilities: ['PROGRAM_VIEW'],
}
const partnerAssignment = {
  assigned: true,
  assignmentRole: 'PARTNER',
  masterBypass: false,
  capabilities: ['PROGRAM_VIEW', 'PROGRAM_EDIT', 'FILE_DOWNLOAD'],
}
const ownerAssignment = {
  assigned: true,
  assignmentRole: 'PM',
  masterBypass: false,
  capabilities: [
    'PROGRAM_VIEW',
    'PROGRAM_EDIT',
    'FILE_DOWNLOAD',
    'SENSITIVE_PII_READ',
    'PROGRAM_ADMIN_MANAGE',
  ],
}

describe('classifyProgramDetailActionLabel', () => {
  it.each([
    '정보 수정',
    '선택 반려',
    '선택 임시 배정',
    '승인 취소',
    '활동 포기',
    '코멘트 작성',
    '출결 정정',
    '알림 재발송',
    '만족도조사 등록',
    '설문조사 공유',
    '강의평가 제출하기',
    '강사 변경',
    '담당자 삭제',
    '임시 교육 일정표 확인',
  ])('「%s」은 쓰기 버튼이다', label => {
    expect(classifyProgramDetailActionLabel(label)).toBe('write')
  })

  it.each(['엑셀 다운로드', '파일 다운로드', '강의 평가 결과 다운로드', '1365 봉사시간 등록 양식'])(
    '「%s」은 다운로드 버튼이다',
    label => {
      expect(classifyProgramDetailActionLabel(label)).toBe('download')
    }
  )

  it('개인정보 상세보기는 개인정보 열람 버튼이다', () => {
    expect(classifyProgramDetailActionLabel('  개인정보\n 상세보기 ')).toBe('pii')
  })

  it.each([
    '미리보기',
    '지급조서 보기',
    '강의보고서 보기',
    '상세 보기',
    '피드백 보기',
    '설문 양식 보기',
    '닫기',
    '취소',
    '확인',
    '조회',
    '목록으로',
    '1365 바로가기',
    '배정 현황',
    '등록일시',
  ])('「%s」은 조회·닫기 버튼이라 막지 않는다', label => {
    expect(classifyProgramDetailActionLabel(label)).toBeNull()
  })
})

describe('resolveProgramDetailActionPermissions', () => {
  it('Program Viewer(프로그램 상세)는 쓰기·다운로드·개인정보 열람이 모두 막힌다', () => {
    expect(
      resolveProgramDetailActionPermissions({
        roleCode: 'PROGRAM_MANAGER',
        assignment: viewerAssignment,
      })
    ).toEqual({ write: false, download: false, pii: false })
  })

  it('전역 Program Viewer는 PM으로 배정돼도 조회만 가능하다', () => {
    expect(
      resolveProgramDetailActionPermissions({
        roleCode: 'PROGRAM_VIEWER',
        assignment: { ...ownerAssignment, capabilities: ['PROGRAM_VIEW'] },
      })
    ).toEqual({ write: false, download: false, pii: false })
  })

  it('Program Assistant는 수정·다운로드·일반 개인정보 열람이 가능하다', () => {
    expect(
      resolveProgramDetailActionPermissions({
        roleCode: 'PROGRAM_MANAGER',
        assignment: partnerAssignment,
      })
    ).toEqual({ write: true, download: true, pii: true })
  })

  it('Master는 배정 응답과 무관하게 모두 허용한다', () => {
    expect(
      resolveProgramDetailActionPermissions({ roleCode: 'MASTER', assignment: viewerAssignment })
    ).toEqual({ write: true, download: true, pii: true })
  })

  it('배정 응답이 없으면 전역 역할로 판정한다', () => {
    expect(resolveProgramDetailActionPermissions({ roleCode: 'PROGRAM_VIEWER' })).toEqual({
      write: false,
      download: false,
      pii: false,
    })
    expect(resolveProgramDetailActionPermissions({ roleCode: 'PROGRAM_MANAGER' })).toEqual({
      write: true,
      download: true,
      pii: true,
    })
  })
})

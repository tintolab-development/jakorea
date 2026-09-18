/**
 * 프로그램 카탈로그 mock — 시드 제거.
 * 프로그램 관리 화면은 Admin programs API만 사용한다.
 * 타 도메인(정산·회원 등)이 `mockPrograms`를 참조하면 빈 배열이다.
 */

import type { Program } from '../../types/domain'

export const mockPrograms: Program[] = []

export const mockProgramsMap = new Map<string, Program>()

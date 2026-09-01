/**
 * 프로그램 상세 정보 수정 폼 인스턴스·동기화
 * - 비즈니스: program 변경 시 폼 동기화, 수정 모드 진입 시 최신 program으로 reset
 * - useEffect(program, reset): program 변경 시 폼 값 동기화 (다른 수정 폼과 동일 패턴)
 * - useLayoutEffect(isEditMode, program, reset): 수정 모드 진입 시 한 번 더 reset으로 "정보 수정" 클릭 시점 program 기준 채움 (빈 값 노출 방지)
 * - 수정 모드 진입 전 부모에서 resetToProgram() 호출 후 isEditMode 전환 권장
 *
 * ─── RHF + Zod (병합 시 건드리지 말 것) ────────────────────────────────────
 * - `zodResolver(schema)` 와 `useForm<ProgramDetailEditFormValues>` 쌍을 유지 (기본 `programDetailEditSchema`).
 *   참여자 정보 탭은 `programDetailInstitutionsEditSchema` 로 모집 안내 필수 검증 완화.
 * - `defaultValues` 는 `programToDetailEditValues` 와 동일 구조를 유지해야 reset 시 누락 필드가 없음.
 * - 풀페이지 모달은 탭별로 이 훅을 **여러 번** 호출하되, 모두 동일 스키마를 공유 (인스턴스만 분리).
 */

import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import type { Program } from '@/types/domain'
import {
  programDetailEditSchema,
  type ProgramDetailEditFormValues,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'

export interface UseProgramDetailEditFormOptions {
  program: Program | null
  isEditMode: boolean
  /** 기본: `programDetailEditSchema` — 참여자 정보 탭은 `programDetailInstitutionsEditSchema` */
  schema?: z.ZodType<ProgramDetailEditFormValues>
}

export function useProgramDetailEditForm({
  program,
  isEditMode,
  schema = programDetailEditSchema,
}: UseProgramDetailEditFormOptions): UseFormReturn<ProgramDetailEditFormValues> {
  const defaultValues = useMemo<ProgramDetailEditFormValues>(() => {
    if (program) return programToDetailEditValues(program)
    return {
      title: '',
      category: 'school',
      type: 'offline',
      rounds: [],
      sponsorId: '',
      managerName: '',
      description: '',
      learningSupportContent: '',
      applicationStartDate: '',
      applicationEndDate: '',
      resultAnnouncementDate: '',
      resultAnnouncementMethod: '',
    }
  }, [program])

  const form = useForm<ProgramDetailEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  // program 변경 시 폼 값 동기화 (defaultValues까지 갱신해 디폴트 누락 방지)
  useEffect(() => {
    if (program) {
      reset(programToDetailEditValues(program), { keepDefaultValues: false })
    }
  }, [program, reset])

  // 수정 모드 진입 시 폼을 최신 program 값으로 채움 (useLayoutEffect로 페인트 전 실행)
  useLayoutEffect(() => {
    if (isEditMode && program) {
      reset(programToDetailEditValues(program), { keepDefaultValues: false })
    }
  }, [isEditMode, program, reset])

  return form
}

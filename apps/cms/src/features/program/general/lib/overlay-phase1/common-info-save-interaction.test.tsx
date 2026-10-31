/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import {
  EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE,
  EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE,
} from '@/features/program/general/lib/education-structure-guard'
import {
  GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX,
  GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX,
  PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX,
} from '@/features/program/general/lib/general-program-modal-z-index'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { isEducationStructureChanged } from './independent-session-authoring'
import { GENERAL_COMMON_INFO_SAVE_INTERACTION_STATUS } from './general-detail-rhf-save-path'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { isProgramTypeSettingsSaveBlocked } from '@/features/program/shared/lib/program-edit-window'
import {
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
} from '@/shared/lib/program-edit-window-error-message'
import type { Program } from '@/types/domain'

vi.mock('@/shared/ui/cms-button', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/ui/cms-button')>()
  return actual
})

afterEach(cleanup)

function wrapZIndex(container: HTMLElement): string {
  const wrap = container.ownerDocument.querySelector('.ant-modal-wrap') as HTMLElement | null
  return wrap?.style.zIndex || getComputedStyle(wrap ?? container).zIndex
}

describe('GENERAL_COMMON_INFO_SAVE_INTERACTION', () => {
  it('판정 상수는 PARTIAL 이다', () => {
    expect(GENERAL_COMMON_INFO_SAVE_INTERACTION_STATUS).toBe(
      'GENERAL_COMMON_INFO_SAVE_INTERACTION_PARTIAL'
    )
  })

  it('교육구조 변경 ConfirmModal z-index는 상세 풀페이지보다 위, Alert·미리보기보다 아래다', () => {
    expect(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX).toBe(
      GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX + 200
    )
    expect(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX).toBeGreaterThan(
      GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX
    )
    expect(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX).toBeLessThan(
      PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX
    )
    expect(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX).toBeLessThan(CMS_ALERT_MODAL_Z_INDEX)
    expect(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX).toBeGreaterThan(1001)
  })

  it('SAVE-01 커리큘럼형 baseline + 일정형 RHF 는 확인 분기다', () => {
    expect(
      isEducationStructureChanged({ generalProgramEducationStructure: 'curriculum' }, 'schedule')
    ).toBe(true)
  })

  it('SAVE-06 교육구조 미변경이면 확인 분기를 건너뛴다', () => {
    expect(
      isEducationStructureChanged({ generalProgramEducationStructure: 'curriculum' }, 'curriculum')
    ).toBe(false)
    expect(
      isEducationStructureChanged({ generalProgramEducationStructure: 'schedule' }, 'schedule')
    ).toBe(false)
  })

  it('편집 중 정보 수정 클릭은 onSave에 도달한다', () => {
    const onSave = vi.fn()
    render(
      <ProgramEditInfoActions
        isEditing
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSave={onSave} />
    )
    fireEvent.click(screen.getByRole('button', { name: '정보 수정' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('SAVE-02 ConfirmModal wrap z-index는 상세 풀페이지보다 높다', () => {
    const { baseElement } = render(
      <ConfirmModal
        open
        title={EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE}
        content={EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE}
        zIndex={GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    )
    expect(screen.getByText(EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE)).toBeTruthy()
    expect(wrapZIndex(baseElement)).toBe(String(GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX))
  })

  it('SAVE-03 확인 팝업 취소는 저장 콜백을 호출하지 않고 입력을 유지한다', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmModal
        open
        title={EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE}
        content={EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE}
        zIndex={GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('잠긴 뒤 유형 변경은 확인 분기가 아니라 안내 Alert다', () => {
    const program = {
      id: '1',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      programRecruitments: [
        { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      ],
    } as Program
    const now = new Date('2026-09-28T12:00:00+09:00')
    expect(
      isProgramTypeSettingsSaveBlocked(
        program,
        { educationStructure: 'schedule', sessionRound: 'single' },
        now
      )
    ).toBe(true)
    expect(PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE).toBe('프로그램 유형 변경 불가 안내')
    expect(PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE).toContain(
      '모집이 시작된 프로그램은 유형을 변경할 수 없습니다.'
    )
    expect(PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE).toContain(
      '변경 전 유형으로 되돌린 후 다시 저장해 주세요.'
    )
  })

  it('잠긴 뒤 교육 형태·IPS만 바꾸면 유형 저장을 막지 않는다', () => {
    const program = {
      id: '1',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      programRecruitments: [
        { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      ],
    } as Program
    expect(
      isProgramTypeSettingsSaveBlocked(
        program,
        { educationStructure: 'curriculum', sessionRound: 'single' },
        new Date('2026-09-28T12:00:00+09:00')
      )
    ).toBe(false)
  })

  it('잠긴 뒤 참여 방식만 바꿔도 유형 저장을 막는다', () => {
    const program = {
      id: '1',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: { participationMethod: 'individual' },
      programRecruitments: [
        { id: 1, recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
      ],
    } as Program
    expect(
      isProgramTypeSettingsSaveBlocked(
        program,
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          participationMethod: 'team',
        },
        new Date('2026-09-28T12:00:00+09:00')
      )
    ).toBe(true)
  })

  it('확인 버튼은 runInfoSave 경로인 onConfirm만 호출한다', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmModal
        open
        title={EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE}
        content={EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE}
        zIndex={GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

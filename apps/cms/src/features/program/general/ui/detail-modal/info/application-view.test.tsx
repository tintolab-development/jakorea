/** @vitest-environment jsdom */
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { queryClient } from '@/shared/lib/query-client'
import { PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE } from '@/shared/lib/program-edit-window-error-message'
import { resolveGeneralApplicationEditorVariant } from '@/features/program/general/lib/application-tabs'
import { programForApplicationFormEditor } from '@/features/program/general/lib/operational-form-bindings'
import { assertProgramApplicationFormWritable } from '@/features/program/general/lib/sync-registration-form-bindings'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'

const showAlert = vi.fn()
const fetchGeneralProgramFormBindings = vi.fn()
const fetchProgramApplicationCountsRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  shouldUseFormsSurveysRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/ujat/api/capabilities', () => ({
  shouldUseRemoteApi: () => false,
}))

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) =>
    fetchGeneralProgramFormBindings(...args),
}))

vi.mock('@/features/program/general/api/application-counts-api-client', () => ({
  fetchProgramApplicationCountsRemote: (...args: unknown[]) =>
    fetchProgramApplicationCountsRemote(...args),
}))

const program = {
  id: '186100',
  backendProgramType: 'GENERAL',
  generalParticipantTypes: ['school_institution'],
  programRecruitments: [
    {
      id: 31,
      recruitmentType: 'PARTICIPANT',
      applicationType: 'ORGANIZATION',
      applicationFormBindingId: 7,
    },
  ],
} as Program

function ApplicationEditFormHarness() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const onEditForm = () => {
    if (loading) return
    const variant = resolveGeneralApplicationEditorVariant(program, 'institutions')
    const templateCode = getTemplateIdForParticipantApplicationVariant(variant)
    const scopedProgram = programForApplicationFormEditor(program, variant)
    setLoading(true)
    void assertProgramApplicationFormWritable(scopedProgram, templateCode)
      .then(() => setEditorOpen(true))
      .catch(error => {
        void showAlert({
          title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
          content:
            error instanceof Error && error.message.trim() !== ''
              ? error.message
              : '신청서 현황을 확인하지 못해 양식을 수정할 수 없습니다. 다시 시도해 주세요.',
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <>
      <button type="button" onClick={onEditForm} disabled={loading}>
        양식 수정
      </button>
      {editorOpen ? <div>application-form-editor</div> : null}
    </>
  )
}

describe('신청 양식 수정 진입 preflight', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    queryClient.clear()
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 7,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 31,
        templateId: 55,
        templateVersionId: 501,
        templateName: '기관 신청',
      },
    ])
  })

  it('신청서가 있는 모집에서 양식 수정을 누르면 counts GET 후 편집기를 열지 않는다', async () => {
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 1 },
    ])

    render(<ApplicationEditFormHarness />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186100')
    })
    expect(showAlert).toHaveBeenCalledWith({
      title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
      content: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
    })
    expect(screen.queryByText('application-form-editor')).toBeNull()
  })

  it('신청 0건 모집은 양식 수정 편집기에 진입한다', async () => {
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 0 },
    ])

    render(<ApplicationEditFormHarness />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(screen.getByText('application-form-editor')).toBeTruthy()
    })
    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186100')
    expect(showAlert).not.toHaveBeenCalled()
  })
})

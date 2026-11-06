import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { Ujat1365RegistrationFormResponse } from '@/shared/api/generated/program-progress/schemas/ujat1365RegistrationFormResponse'

export type Participant1365RegistrationMode = 'PREVIEW' | 'DOWNLOAD'

export type Participant1365RegistrationFormResponse = Ujat1365RegistrationFormResponse

export async function fetchParticipant1365RegistrationFormRemote(input: {
  programId: string | number
  participantId: number
  mode: Participant1365RegistrationMode
}): Promise<Participant1365RegistrationFormResponse> {
  return unwrapApiBody(
    await customInstance<Participant1365RegistrationFormResponse>({
      url: `/api/admin/programs/${encodeURIComponent(String(input.programId))}/participants/${encodeURIComponent(String(input.participantId))}/1365-registration-form`,
      method: 'POST',
      params: { mode: input.mode },
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

export function downloadParticipant1365RegistrationJson(
  payload: Participant1365RegistrationFormResponse,
): void {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '1365-registration.json'
  link.click()
  URL.revokeObjectURL(url)
}

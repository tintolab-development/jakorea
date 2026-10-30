import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

export type Ujat1365RegistrationMode = 'PREVIEW' | 'DOWNLOAD'

export type Ujat1365RegistrationFormResponse = {
  programId?: number
  participantId?: number
  memberId?: number
  name?: string | null
  birthDate?: string | null
  external1365Id?: string | null
  volunteerMinutes?: number | null
  mode?: string
}

export async function fetchUjat1365RegistrationFormRemote(input: {
  programId: string | number
  participantId: number
  mode: Ujat1365RegistrationMode
}): Promise<Ujat1365RegistrationFormResponse> {
  return unwrapApiBody(
    await customInstance<Ujat1365RegistrationFormResponse>({
      url: `/api/admin/programs/${encodeURIComponent(String(input.programId))}/participants/${encodeURIComponent(String(input.participantId))}/1365-registration-form`,
      method: 'POST',
      params: { mode: input.mode },
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}

export function resolveParticipantIdForMember(
  volunteers: ReadonlyArray<{ memberId?: number | null; participantId?: number | null }>,
  memberId: string
): number | null {
  const wanted = memberId.trim()
  if (!wanted) return null
  const match = volunteers.find(row => String(row.memberId ?? '') === wanted)
  return typeof match?.participantId === 'number' ? match.participantId : null
}

export function downloadUjat1365RegistrationJson(payload: Ujat1365RegistrationFormResponse): void {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ujat-1365-registration.json'
  link.click()
  URL.revokeObjectURL(url)
}

import { useMemo } from 'react'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'

export function useProgressIndividualParticipantList(programId: string | undefined) {
  const participantList = useMemo((): ParticipatingIndividualParticipantRow[] => {
    if (!programId) return []
    return getParticipatingIndividualParticipantsForProgram(programId)
  }, [programId])

  return { participantList }
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ProgramVolunteerFreeTextQuestion } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'

export type ParticipatingVolunteerFreeTextId = ProgramVolunteerFreeTextQuestion['id']

export type ParticipatingVolunteerPreviousJaProgramValues = {
  programYear: string
  programName: string
  certificateFileIds: string[]
}

export type ParticipatingVolunteerAddRegistrationPluginValues = {
  id1365: string
  previousJaProgram: ParticipatingVolunteerPreviousJaProgramValues
  freeTextById: Record<ParticipatingVolunteerFreeTextId, string>
}

const EMPTY_FREE_TEXT = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.reduce(
  (acc, q) => {
    acc[q.id] = ''
    return acc
  },
  {} as Record<ParticipatingVolunteerFreeTextId, string>
)

const EMPTY_PLUGIN_VALUES: ParticipatingVolunteerAddRegistrationPluginValues = {
  id1365: '',
  previousJaProgram: {
    programYear: '',
    programName: '',
    certificateFileIds: [],
  },
  freeTextById: { ...EMPTY_FREE_TEXT },
}

type ParticipatingVolunteerAddRegistrationPluginState = {
  values: ParticipatingVolunteerAddRegistrationPluginValues
  setId1365: (value: string) => void
  setPreviousJaProgramYear: (value: string) => void
  setPreviousJaProgramName: (value: string) => void
  appendPreviousJaCertificateFileIds: (fileIds: string[]) => void
  removePreviousJaCertificateFileAt: (index: number) => void
  setFreeText: (id: ParticipatingVolunteerFreeTextId, value: string) => void
  reset: () => void
}

const ParticipatingVolunteerAddRegistrationPluginContext =
  createContext<ParticipatingVolunteerAddRegistrationPluginState | null>(null)

export function ParticipatingVolunteerAddRegistrationPluginProvider({
  children,
}: {
  children: ReactNode
}) {
  const [values, setValues] = useState<ParticipatingVolunteerAddRegistrationPluginValues>(
    () => ({
      ...EMPTY_PLUGIN_VALUES,
      freeTextById: { ...EMPTY_FREE_TEXT },
    })
  )

  const reset = useCallback(() => {
    setValues({
      ...EMPTY_PLUGIN_VALUES,
      freeTextById: { ...EMPTY_FREE_TEXT },
    })
  }, [])

  const setId1365 = useCallback((value: string) => {
    setValues(prev => ({ ...prev, id1365: value }))
  }, [])

  const setPreviousJaProgramYear = useCallback((value: string) => {
    setValues(prev => ({
      ...prev,
      previousJaProgram: { ...prev.previousJaProgram, programYear: value },
    }))
  }, [])

  const setPreviousJaProgramName = useCallback((value: string) => {
    setValues(prev => ({
      ...prev,
      previousJaProgram: { ...prev.previousJaProgram, programName: value },
    }))
  }, [])

  const appendPreviousJaCertificateFileIds = useCallback((fileIds: string[]) => {
    if (fileIds.length === 0) return
    setValues(prev => ({
      ...prev,
      previousJaProgram: {
        ...prev.previousJaProgram,
        certificateFileIds: [...prev.previousJaProgram.certificateFileIds, ...fileIds],
      },
    }))
  }, [])

  const removePreviousJaCertificateFileAt = useCallback((index: number) => {
    setValues(prev => ({
      ...prev,
      previousJaProgram: {
        ...prev.previousJaProgram,
        certificateFileIds: prev.previousJaProgram.certificateFileIds.filter((_, i) => i !== index),
      },
    }))
  }, [])

  const setFreeText = useCallback((id: ParticipatingVolunteerFreeTextId, value: string) => {
    setValues(prev => ({
      ...prev,
      freeTextById: { ...prev.freeTextById, [id]: value },
    }))
  }, [])

  const state = useMemo(
    () => ({
      values,
      setId1365,
      setPreviousJaProgramYear,
      setPreviousJaProgramName,
      appendPreviousJaCertificateFileIds,
      removePreviousJaCertificateFileAt,
      setFreeText,
      reset,
    }),
    [
      values,
      setId1365,
      setPreviousJaProgramYear,
      setPreviousJaProgramName,
      appendPreviousJaCertificateFileIds,
      removePreviousJaCertificateFileAt,
      setFreeText,
      reset,
    ]
  )

  return (
    <ParticipatingVolunteerAddRegistrationPluginContext.Provider value={state}>
      {children}
    </ParticipatingVolunteerAddRegistrationPluginContext.Provider>
  )
}

export function useParticipatingVolunteerAddRegistrationPluginState() {
  const ctx = useContext(ParticipatingVolunteerAddRegistrationPluginContext)
  if (!ctx) {
    throw new Error(
      'useParticipatingVolunteerAddRegistrationPluginState must be used within ParticipatingVolunteerAddRegistrationPluginProvider'
    )
  }
  return ctx
}

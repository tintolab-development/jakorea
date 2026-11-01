import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Dayjs } from 'dayjs'
import { subscribeGeneralRegistrationWizardRhf } from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { subscribeCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import { subscribeTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  composeDisabledDate,
  REGISTRATION_BUSINESS_PERIOD_FIRST_HINT,
  type BusinessCalendarPeriod,
} from '@/features/program/shared/lib/registration-business-period-calendar'
import {
  readActiveRegistrationBusinessPeriod,
  subscribeUjatRegistrationBusinessPeriod,
} from '@/features/program/shared/lib/registration-business-period-issues'

type RegistrationBusinessPeriodConstraintValue = {
  period: BusinessCalendarPeriod | null
  isActive: true
}

const RegistrationBusinessPeriodConstraintContext =
  createContext<RegistrationBusinessPeriodConstraintValue | null>(null)

function subscribeRegistrationBusinessPeriod(listener: () => void): () => void {
  const unsubs = [
    subscribeUjatRegistrationBusinessPeriod(listener),
    subscribeGeneralRegistrationWizardRhf(listener),
    subscribeCompanySchoolRegistrationRhf(listener),
    subscribeTrainedTeachersRegistrationRhf(listener),
  ]
  return () => {
    unsubs.forEach(unsub => unsub())
  }
}

function periodSnapshot(): string {
  const period = readActiveRegistrationBusinessPeriod()
  return period ? `${period.start}|${period.end}` : ''
}

function parsePeriodSnapshot(raw: string): BusinessCalendarPeriod | null {
  if (!raw) return null
  const [start, end] = raw.split('|')
  if (!start || !end) return null
  return { start, end }
}

export function RegistrationBusinessPeriodConstraintProvider({
  children,
}: {
  children: ReactNode
}) {
  const snapshot = useSyncExternalStore(
    subscribeRegistrationBusinessPeriod,
    periodSnapshot,
    () => ''
  )
  const value = useMemo<RegistrationBusinessPeriodConstraintValue>(
    () => ({ period: parsePeriodSnapshot(snapshot), isActive: true }),
    [snapshot]
  )
  return (
    <RegistrationBusinessPeriodConstraintContext.Provider value={value}>
      {children}
    </RegistrationBusinessPeriodConstraintContext.Provider>
  )
}

export function useRegistrationBusinessPeriodConstraint(): RegistrationBusinessPeriodConstraintValue | null {
  return useContext(RegistrationBusinessPeriodConstraintContext)
}

export function useComposedRegistrationBusinessPeriodDisabledDate(
  existing?: (date: Dayjs) => boolean,
  exclude?: boolean
): ((date: Dayjs) => boolean) | undefined {
  const constraint = useRegistrationBusinessPeriodConstraint()
  return useCallback(
    (date: Dayjs) => {
      if (!exclude && constraint?.isActive) {
        return composeDisabledDate(constraint.period, existing)(date)
      }
      return existing?.(date) === true
    },
    [constraint, exclude, existing]
  )
}

export function useRegistrationBusinessPeriodPickerHint(exclude?: boolean): string | null {
  const constraint = useRegistrationBusinessPeriodConstraint()
  if (exclude || constraint == null) return null
  if (constraint.period != null) return null
  return REGISTRATION_BUSINESS_PERIOD_FIRST_HINT
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  FieldValidationHighlightContext,
  type FieldValidationHighlightContextValue,
} from '@jakorea/form-template-runtime'
import { RegistrationWizardFieldHighlightDomSync } from '@/features/program/shared/ui/registration/registration-wizard-field-highlight-dom-sync'
import type { RegistrationWizardIncompleteMapVariant } from '@/features/program/shared/lib/registration-wizard-incomplete-map'
import {
  firstRegistrationWizardIncompleteParagraphId,
  isRegistrationWizardFieldIncomplete,
  isRegistrationWizardHorizontalTableCellIncomplete,
  resolveRegistrationWizardIncompleteParagraphIds,
} from '@/features/program/shared/lib/registration-wizard-incomplete-map'

export type RegistrationWizardValidationHighlightState = {
  /** 0 = 비활성, 1+ = 검증 실패 attempt */
  attemptId: number
  incompleteKeys: ReadonlySet<string>
  incompleteParagraphIds: ReadonlySet<string>
  variant: RegistrationWizardIncompleteMapVariant
}

type RegistrationWizardValidationHighlightContextValue = RegistrationWizardValidationHighlightState & {
  reportIncomplete: (keys: readonly string[]) => void
  clearHighlight: () => void
  isFieldIncomplete: (validationKey: string | readonly string[]) => boolean
  isParagraphIncomplete: (paragraphId: string) => boolean
  isHorizontalTableCellIncomplete: (cellKey: string) => boolean
}

const defaultState: RegistrationWizardValidationHighlightState = {
  attemptId: 0,
  incompleteKeys: new Set(),
  incompleteParagraphIds: new Set(),
  variant: 'general',
}

const RegistrationWizardValidationHighlightContext =
  createContext<RegistrationWizardValidationHighlightContextValue>({
    ...defaultState,
    reportIncomplete: () => {},
    clearHighlight: () => {},
    isFieldIncomplete: () => false,
    isParagraphIncomplete: () => false,
    isHorizontalTableCellIncomplete: () => false,
  })

export function useRegistrationWizardValidationHighlight(): RegistrationWizardValidationHighlightContextValue {
  return useContext(RegistrationWizardValidationHighlightContext)
}

export function RegistrationWizardValidationHighlightProvider({
  variant,
  children,
}: {
  variant: RegistrationWizardIncompleteMapVariant
  children: ReactNode
}) {
  const [attemptId, setAttemptId] = useState(0)
  const [incompleteKeys, setIncompleteKeys] = useState<ReadonlySet<string>>(new Set())
  const [incompleteParagraphIds, setIncompleteParagraphIds] = useState<ReadonlySet<string>>(
    new Set()
  )

  const reportIncomplete = useCallback(
    (keys: readonly string[]) => {
      const keySet = new Set(keys)
      setIncompleteKeys(keySet)
      setIncompleteParagraphIds(resolveRegistrationWizardIncompleteParagraphIds(keys, variant))
      setAttemptId(prev => prev + 1)
    },
    [variant]
  )

  const clearHighlight = useCallback(() => {
    setAttemptId(0)
    setIncompleteKeys(new Set())
    setIncompleteParagraphIds(new Set())
  }, [])

  const isFieldIncomplete = useCallback(
    (validationKey: string | readonly string[]) => {
      if (attemptId <= 0) return false
      if (Array.isArray(validationKey)) {
        return validationKey.some(key =>
          isRegistrationWizardFieldIncomplete(key, incompleteKeys)
        )
      }
      return isRegistrationWizardFieldIncomplete(String(validationKey), incompleteKeys)
    },
    [attemptId, incompleteKeys]
  )

  const isParagraphIncomplete = useCallback(
    (paragraphId: string) => attemptId > 0 && incompleteParagraphIds.has(paragraphId),
    [attemptId, incompleteParagraphIds]
  )

  const isHorizontalTableCellIncompleteFn = useCallback(
    (cellKey: string) =>
      attemptId > 0 &&
      isRegistrationWizardHorizontalTableCellIncomplete(cellKey, incompleteKeys),
    [attemptId, incompleteKeys]
  )

  const value = useMemo(
    (): RegistrationWizardValidationHighlightContextValue => ({
      attemptId,
      incompleteKeys,
      incompleteParagraphIds,
      variant,
      reportIncomplete,
      clearHighlight,
      isFieldIncomplete,
      isParagraphIncomplete,
      isHorizontalTableCellIncomplete: isHorizontalTableCellIncompleteFn,
    }),
    [
      attemptId,
      clearHighlight,
      incompleteKeys,
      incompleteParagraphIds,
      isFieldIncomplete,
      isHorizontalTableCellIncompleteFn,
      isParagraphIncomplete,
      reportIncomplete,
      variant,
    ]
  )

  const fieldValidationBridge = useMemo(
    (): FieldValidationHighlightContextValue => ({
      epoch: attemptId,
      isFieldIncomplete,
    }),
    [attemptId, isFieldIncomplete]
  )

  return (
    <RegistrationWizardValidationHighlightContext.Provider value={value}>
      <FieldValidationHighlightContext.Provider value={fieldValidationBridge}>
        {children}
        <RegistrationWizardFieldHighlightDomSync />
      </FieldValidationHighlightContext.Provider>
    </RegistrationWizardValidationHighlightContext.Provider>
  )
}

export function useDetailEditRequiredHighlightRequest() {
  const [request, setRequest] = useState<{ nonce: number; keys: readonly string[] }>({
    nonce: 0,
    keys: [],
  })
  const report = useCallback((keys: readonly string[]) => {
    setRequest(prev => ({ nonce: prev.nonce + 1, keys: [...keys] }))
  }, [])
  const clear = useCallback(() => {
    setRequest(prev => (prev.nonce === 0 ? prev : { nonce: 0, keys: [] }))
  }, [])
  return { request, report, clear }
}

/** Provider 안에서 상세 수정 저장 실패 키를 단락·필드 강조로 반영 */
export function RegistrationWizardValidationHighlightSync({
  nonce,
  keys,
  variant,
}: {
  nonce: number
  keys: readonly string[]
  variant: RegistrationWizardIncompleteMapVariant
}) {
  const { reportIncomplete, clearHighlight } = useRegistrationWizardValidationHighlight()
  const keysFingerprint = keys.join('\0')

  useEffect(() => {
    if (nonce <= 0) {
      clearHighlight()
      return
    }
    const reported = keysFingerprint ? keysFingerprint.split('\0') : []
    reportIncomplete(reported)
    scrollToFirstRegistrationWizardIncompleteParagraph(
      resolveRegistrationWizardIncompleteParagraphIds(reported, variant)
    )
  }, [clearHighlight, keysFingerprint, nonce, reportIncomplete, variant])

  return null
}

/** 검증 실패 후 첫 미입력 단락으로 스크롤 */
export function scrollToFirstRegistrationWizardIncompleteParagraph(
  paragraphIds: ReadonlySet<string>
): void {
  const firstId = firstRegistrationWizardIncompleteParagraphId(paragraphIds)
  if (!firstId) return
  const el = document.querySelector(`[data-paragraph-id="${firstId}"]`)
  if (el instanceof HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

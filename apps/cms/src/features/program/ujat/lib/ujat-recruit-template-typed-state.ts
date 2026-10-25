import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { RecruitmentInterviewConfig } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  interviewConfigToLegacyOverlayRecord,
  overlayRecordToInterviewConfig,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
import { setRecruitTypedInterviewRecordBridge } from '@/features/program/shared/lib/recruit-typed-interview-record-bridge'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'

export const UJAT_RECRUIT_TEMPLATE_SETTINGS_KEY = 'ujatRecruitment' as const

export type UjatRecruitTemplateFormKind = 'institution' | 'volunteer'
export type UjatRecruitTemplateVolunteerHalf = 'h1' | 'h2'

export type UjatRecruitTemplateTypedState = {
  institution?: Partial<ProgramDetailEditFormValues>
  volunteerH1?: Partial<ProgramDetailEditFormValues>
  volunteerH2?: Partial<ProgramDetailEditFormValues>
  interviewH1?: RecruitmentInterviewConfig
  interviewH2?: RecruitmentInterviewConfig
}

const stateByTemplateCode = new Map<string, UjatRecruitTemplateTypedState>()
const listenersByTemplateCode = new Map<string, Set<() => void>>()

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function notify(templateCode: string): void {
  for (const listener of listenersByTemplateCode.get(templateCode) ?? []) listener()
}

function subscribe(templateCode: string, listener: () => void): () => void {
  const listeners = listenersByTemplateCode.get(templateCode) ?? new Set<() => void>()
  listeners.add(listener)
  listenersByTemplateCode.set(templateCode, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) listenersByTemplateCode.delete(templateCode)
  }
}

export function getUjatRecruitTemplateTypedState(
  templateCode: string
): UjatRecruitTemplateTypedState | undefined {
  return stateByTemplateCode.get(templateCode)
}

export function setUjatRecruitTemplateTypedState(
  templateCode: string,
  state: UjatRecruitTemplateTypedState
): UjatRecruitTemplateTypedState {
  const next = cloneJson(state)
  stateByTemplateCode.set(templateCode, next)
  notify(templateCode)
  return next
}

export function patchUjatRecruitTemplateTypedState(
  templateCode: string,
  patch: Partial<UjatRecruitTemplateTypedState>
): UjatRecruitTemplateTypedState {
  const current = stateByTemplateCode.get(templateCode) ?? {}
  const next = setUjatRecruitTemplateTypedState(templateCode, {
    ...current,
    ...patch,
  })
  return next
}

export function clearUjatRecruitTemplateTypedState(templateCode?: string): void {
  if (templateCode == null) {
    stateByTemplateCode.clear()
    for (const templateListeners of listenersByTemplateCode.values()) {
      for (const listener of templateListeners) listener()
    }
    return
  }
  if (!stateByTemplateCode.delete(templateCode)) return
  notify(templateCode)
}

function stateKey(
  kind: UjatRecruitTemplateFormKind,
  volunteerHalf?: UjatRecruitTemplateVolunteerHalf
): 'institution' | 'volunteerH1' | 'volunteerH2' {
  if (kind === 'institution') return 'institution'
  return volunteerHalf === 'h2' ? 'volunteerH2' : 'volunteerH1'
}

function setAtPath(root: unknown, path: string, value: unknown): unknown {
  const parts = path.split('.').filter(Boolean)
  if (parts.length === 0) return value
  const next = Array.isArray(root) ? [...root] : { ...(root as Record<string, unknown>) }
  let cursor = next as Record<string, unknown> | unknown[]
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    const nextPart = parts[index + 1]
    const current = Array.isArray(cursor)
      ? cursor[Number(part)]
      : (cursor as Record<string, unknown>)[part]
    const child = current == null ? (/^\d+$/.test(nextPart) ? [] : {}) : current
    const childCopy = Array.isArray(child) ? [...child] : { ...(child as Record<string, unknown>) }
    if (Array.isArray(cursor)) cursor[Number(part)] = childCopy
    else (cursor as Record<string, unknown>)[part] = childCopy
    cursor = childCopy
  }
  const last = parts[parts.length - 1]
  if (Array.isArray(cursor)) cursor[Number(last)] = value
  else (cursor as Record<string, unknown>)[last] = value
  return next
}

function getAtPath(root: unknown, path: string): unknown {
  return path.split('.').filter(Boolean).reduce<unknown>((current, part) => {
    if (current == null || typeof current !== 'object') return undefined
    return Array.isArray(current)
      ? current[Number(part)]
      : (current as Record<string, unknown>)[part]
  }, root)
}

export function patchUjatRecruitTemplateFormValues(args: {
  templateCode: string
  kind: UjatRecruitTemplateFormKind
  volunteerHalf?: UjatRecruitTemplateVolunteerHalf
  fieldName: string
  value: unknown
}): UjatRecruitTemplateTypedState {
  const key = stateKey(args.kind, args.volunteerHalf)
  const current = stateByTemplateCode.get(args.templateCode) ?? {}
  const currentForm = current[key] ?? {}
  const nextForm = setAtPath(currentForm, args.fieldName, args.value) as Partial<
    ProgramDetailEditFormValues
  >
  return patchUjatRecruitTemplateTypedState(args.templateCode, {
    [key]: nextForm,
  })
}

export function buildUjatRecruitTemplateSettingsJson(
  templateCode: string
): Record<string, unknown> {
  const state = stateByTemplateCode.get(templateCode) ?? {}
  return {
    [UJAT_RECRUIT_TEMPLATE_SETTINGS_KEY]: cloneJson(state),
  }
}

export function readUjatRecruitTemplateTypedStateFromSettings(
  settingsJson: Record<string, unknown> | undefined
): UjatRecruitTemplateTypedState | null {
  const raw = settingsJson?.[UJAT_RECRUIT_TEMPLATE_SETTINGS_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return cloneJson(raw as UjatRecruitTemplateTypedState)
}

export function hydrateUjatRecruitTemplateTypedStateFromSettings(args: {
  templateCode: string
  settingsJson?: Record<string, unknown>
  legacyState?: UjatRecruitTemplateTypedState
}): UjatRecruitTemplateTypedState {
  const typed = readUjatRecruitTemplateTypedStateFromSettings(args.settingsJson)
  return setUjatRecruitTemplateTypedState(args.templateCode, typed ?? args.legacyState ?? {})
}

/** Independent Template Authoring only: the schedule editor writes into this typed record. */
export function useUjatRecruitTemplateInterviewBridge(args: {
  templateCode: string
  volunteerHalf: UjatRecruitTemplateVolunteerHalf
}): void {
  const state = useSyncExternalStore(
    listener => subscribe(args.templateCode, listener),
    () => getUjatRecruitTemplateTypedState(args.templateCode),
    () => getUjatRecruitTemplateTypedState(args.templateCode)
  )
  const key = args.volunteerHalf === 'h2' ? 'interviewH2' : 'interviewH1'
  const namespace = ujatVolunteerRecruitInterviewNamespace(args.volunteerHalf)
  const config = state?.[key]
  const record = useMemo(
    () =>
      interviewConfigToLegacyOverlayRecord(
        config,
        namespace
      ),
    [config, namespace]
  )
  const onRecordChange = useMemo(
    () => (nextRecord: Record<string, unknown>) => {
      patchUjatRecruitTemplateTypedState(args.templateCode, {
        [key]: overlayRecordToInterviewConfig(nextRecord, namespace),
      })
    },
    [args.templateCode, key, namespace]
  )

  useEffect(() => {
    const nextRecord = record
    setRecruitTypedInterviewRecordBridge(nextRecord, onRecordChange)
    return () => {
      if (nextRecord === record) setRecruitTypedInterviewRecordBridge(null)
    }
  }, [args.templateCode, args.volunteerHalf, onRecordChange, record])
}

export function useUjatRecruitTemplateFormTypedSync(
  form: UseFormReturn<ProgramDetailEditFormValues>,
  args: {
    templateCode: string
    kind: UjatRecruitTemplateFormKind
    volunteerHalf?: UjatRecruitTemplateVolunteerHalf
  }
): void {
  const state = useSyncExternalStore(
    listener => subscribe(args.templateCode, listener),
    () => getUjatRecruitTemplateTypedState(args.templateCode),
    () => getUjatRecruitTemplateTypedState(args.templateCode)
  )
  const readyRef = useRef(false)
  const lastAppliedStateRef = useRef<UjatRecruitTemplateTypedState | undefined>(undefined)

  useEffect(() => {
    if (state == null) return
    if (lastAppliedStateRef.current === state) return
    const formState = state[stateKey(args.kind, args.volunteerHalf)]
    if (formState != null) {
      readyRef.current = false
      form.reset({ ...form.getValues(), ...formState } as ProgramDetailEditFormValues, {
        keepDefaultValues: false,
      })
      readyRef.current = true
    }
    lastAppliedStateRef.current = state
  }, [args.kind, args.volunteerHalf, form, state])

  useEffect(() => {
    readyRef.current = true
    const subscription = form.watch((values, info) => {
      if (!readyRef.current || info.name == null) return
      const nextState = patchUjatRecruitTemplateFormValues({
        templateCode: args.templateCode,
        kind: args.kind,
        volunteerHalf: args.volunteerHalf,
        fieldName: info.name,
        value: getAtPath(values, info.name),
      })
      lastAppliedStateRef.current = nextState
    })
    return () => subscription.unsubscribe()
  }, [args.kind, args.templateCode, args.volunteerHalf, form])
}

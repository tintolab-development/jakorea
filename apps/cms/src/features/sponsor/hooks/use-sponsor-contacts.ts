import type React from 'react'
import { useCallback, useMemo, useState, type Key } from 'react'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { isValidSponsorOfficePhone } from '@/features/sponsor/model/sponsor-contact-register-schema'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

const CONTACT_EDITABLE_KEYS = [
  'department',
  'position',
  'name',
  'officePhone',
  'phone',
  'email',
  'companyAddress',
  'memo',
] as const satisfies readonly (keyof SponsorContactRow)[]

function contactEditableChanged(previous: SponsorContactRow, next: SponsorContactRow): boolean {
  return CONTACT_EDITABLE_KEYS.some(key => previous[key] !== next[key])
}

function hasMissingRequiredContactFields(row: SponsorContactRow): boolean {
  return !row.name.trim() || !row.phone.trim()
}

function hasInvalidContactPhoneFields(row: SponsorContactRow): boolean {
  if (!isValidKoreanPhoneNumber(row.phone.trim())) return true
  const officePhone = row.officePhone.trim()
  return officePhone.length > 0 && !isValidSponsorOfficePhone(officePhone)
}

export interface UseSponsorContactsReturn {
  selectedKeys: Key[]
  setSelectedKeys: (keys: Key[]) => void
  openDropdownId: string | null
  setOpenDropdownId: (id: string | null) => void
  registerModalOpen: boolean
  setRegisterModalOpen: (open: boolean) => void
  deleteModalOpen: boolean
  setDeleteModalOpen: (open: boolean) => void
  selectedNames: string[]
  isEditing: boolean
  isSavingEdits: boolean
  draftRows: SponsorContactRow[]
  startEdit: (rows: SponsorContactRow[]) => void
  updateDraft: (rowId: string, patch: Partial<SponsorContactRow>) => void
  saveEdits: () => Promise<'saved' | 'invalid' | 'invalid-format' | 'failed'>
  handleRegister: (payload: SponsorContactRegisterPayload) => void | Promise<void>
  handleDelete: () => void
  handleTypeChange: (rowId: string, nextType: SponsorContactRow['contactType']) => void
}

/**
 * 후원사 담당자 테이블의 선택·드롭다운·등록/삭제 모달 상태와 파생 이름·변경 핸들러를 제공합니다.
 */
export type SponsorContactsRemoteActions = {
  onRegister: (
    payload: SponsorContactRegisterPayload,
    contactType: SponsorContactRow['contactType']
  ) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
  onTypeChange: (row: SponsorContactRow, nextType: SponsorContactRow['contactType']) => Promise<void>
  onUpdate: (row: SponsorContactRow) => Promise<void>
}

export function useSponsorContacts(
  contacts: SponsorContactRow[],
  setContacts: React.Dispatch<React.SetStateAction<SponsorContactRow[]>>,
  canWrite: boolean,
  remoteActions?: SponsorContactsRemoteActions
): UseSponsorContactsReturn {
  const [selectedKeys, setSelectedKeysState] = useState<Key[]>([])
  const [openDropdownId, setOpenDropdownIdState] = useState<string | null>(null)
  const [registerModalOpen, setRegisterModalOpenState] = useState(false)
  const [deleteModalOpen, setDeleteModalOpenState] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingEdits, setIsSavingEdits] = useState(false)
  const [draftRows, setDraftRows] = useState<SponsorContactRow[]>([])

  const setSelectedKeys = useCallback((keys: Key[]): void => {
    setSelectedKeysState(keys.map(k => String(k)))
  }, [])

  const setOpenDropdownId = useCallback((id: string | null): void => {
    setOpenDropdownIdState(id)
  }, [])

  const setRegisterModalOpen = useCallback((open: boolean): void => {
    setRegisterModalOpenState(open)
  }, [])

  const setDeleteModalOpen = useCallback((open: boolean): void => {
    setDeleteModalOpenState(open)
  }, [])

  const selectedNames = useMemo((): string[] => {
    if (selectedKeys.length === 0) return []
    const selectedSet = new Set(selectedKeys.map(key => String(key)))
    return contacts.filter(contact => selectedSet.has(contact.id)).map(contact => contact.name)
  }, [contacts, selectedKeys])

  const handleTypeChange = useCallback(
    (rowId: string, nextType: SponsorContactRow['contactType']): void => {
      const row = contacts.find(c => c.id === rowId)
      if (!row) return
      if (row.contactType === 'lead' && nextType === 'assistant') {
        const leadCount = contacts.filter(c => c.contactType === 'lead').length
        if (leadCount <= 1) return
      }
      if (remoteActions) {
        void remoteActions
          .onTypeChange(row, nextType)
          .then(() => {
            setDraftRows(prev =>
              prev.map(contact =>
                contact.id === rowId ? { ...contact, contactType: nextType } : contact
              )
            )
            setOpenDropdownId(null)
          })
          .catch(() => undefined)
        return
      }
      setContacts(prev => {
        const target = prev.find(c => c.id === rowId)
        if (target?.contactType === 'lead' && nextType === 'assistant') {
          const leadCount = prev.filter(c => c.contactType === 'lead').length
          if (leadCount <= 1) return prev
        }
        const mapped = prev.map(contact => {
          if (contact.id === rowId) return { ...contact, contactType: nextType }
          if (nextType === 'lead' && contact.contactType === 'lead')
            return { ...contact, contactType: 'assistant' as const }
          return contact
        })
        return normalizeSponsorContactsSingleLead(mapped)
      })
      setDraftRows(prev =>
        prev.map(contact => {
          if (contact.id === rowId) return { ...contact, contactType: nextType }
          if (nextType === 'lead' && contact.contactType === 'lead') {
            return { ...contact, contactType: 'assistant' as const }
          }
          return contact
        })
      )
      setOpenDropdownId(null)
    },
    [contacts, remoteActions, setContacts, setOpenDropdownId]
  )

  const handleRegister = useCallback(
    async (payload: SponsorContactRegisterPayload): Promise<void> => {
      if (!canWrite) return
      if (remoteActions) {
        const contactType = contacts.length === 0 ? ('lead' as const) : payload.contactType
        await remoteActions.onRegister(payload, contactType)
        setRegisterModalOpenState(false)
        return
      }
      setContacts(prev => {
        const contactType = prev.length === 0 ? ('lead' as const) : payload.contactType
        const base =
          contactType === 'lead'
            ? prev.map(contact =>
                contact.contactType === 'lead' ? { ...contact, contactType: 'assistant' as const } : contact
              )
            : prev
        const nextIndex = base.length + 1
        const nextContact: SponsorContactRow = {
          id: `contact-${Date.now()}-${nextIndex}`,
          name: payload.name,
          department: payload.department,
          position: payload.position,
          officePhone: payload.officePhone,
          phone: payload.phone,
          email: payload.email,
          companyAddress: payload.companyAddress,
          memo: payload.memo,
          registeredAt: new Date().toISOString(),
          contactType,
        }
        return normalizeSponsorContactsSingleLead([nextContact, ...base])
      })
      setRegisterModalOpenState(false)
    },
    [canWrite, contacts.length, remoteActions, setContacts]
  )

  const handleDelete = useCallback((): void => {
    if (!canWrite || selectedKeys.length === 0) return
    if (remoteActions) {
      const ids = selectedKeys.map(k => String(k))
      void remoteActions
        .onDelete(ids)
        .then(() => {
          setSelectedKeysState([])
          setDeleteModalOpenState(false)
        })
        .catch(() => undefined)
      return
    }
    const selectedSet = new Set(selectedKeys.map(key => String(key)))
    setContacts(prev =>
      normalizeSponsorContactsSingleLead(prev.filter(contact => !selectedSet.has(contact.id)))
    )
    setSelectedKeysState([])
    setDeleteModalOpenState(false)
  }, [canWrite, remoteActions, selectedKeys, setContacts])

  const startEdit = useCallback((rows: SponsorContactRow[]): void => {
    if (!canWrite) return
    setDraftRows(rows.map(row => ({ ...row })))
    setIsEditing(true)
  }, [canWrite])

  const updateDraft = useCallback((rowId: string, patch: Partial<SponsorContactRow>): void => {
    setDraftRows(prev => prev.map(row => (row.id === rowId ? { ...row, ...patch } : row)))
  }, [])

  const saveEdits = useCallback(async (): Promise<
    'saved' | 'invalid' | 'invalid-format' | 'failed'
  > => {
    if (!canWrite || !isEditing) return 'saved'
    if (draftRows.some(hasMissingRequiredContactFields)) return 'invalid'
    if (draftRows.some(hasInvalidContactPhoneFields)) return 'invalid-format'
    setIsSavingEdits(true)
    try {
      if (remoteActions) {
        for (const row of draftRows) {
          const previous = contacts.find(contact => contact.id === row.id)
          if (!previous || !contactEditableChanged(previous, row)) continue
          await remoteActions.onUpdate(row)
        }
      } else {
        const draftById = new Map(draftRows.map(row => [row.id, row]))
        setContacts(prev =>
          prev.map(contact => {
            const draft = draftById.get(contact.id)
            return draft ? { ...contact, ...draft } : contact
          })
        )
      }
      setIsEditing(false)
      setDraftRows([])
      return 'saved'
    } catch {
      return 'failed'
    } finally {
      setIsSavingEdits(false)
    }
  }, [canWrite, contacts, draftRows, isEditing, remoteActions, setContacts])

  return {
    selectedKeys,
    setSelectedKeys,
    openDropdownId,
    setOpenDropdownId,
    registerModalOpen,
    setRegisterModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedNames,
    isEditing,
    isSavingEdits,
    draftRows,
    startEdit,
    updateDraft,
    saveEdits,
    handleRegister,
    handleDelete,
    handleTypeChange,
  }
}

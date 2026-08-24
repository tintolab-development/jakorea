import type React from 'react'
import { useCallback, useMemo, useState, type Key } from 'react'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'

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
      if (remoteActions) {
        const row = contacts.find(c => c.id === rowId)
        if (!row) return
        void remoteActions
          .onTypeChange(row, nextType)
          .then(() => setOpenDropdownId(null))
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
          position: payload.position,
          phone: payload.phone,
          email: payload.email,
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
    handleRegister,
    handleDelete,
    handleTypeChange,
  }
}

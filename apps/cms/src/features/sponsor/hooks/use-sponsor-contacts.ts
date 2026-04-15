import type React from 'react'
import { useCallback, useMemo, useState, type Key } from 'react'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'

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
  handleRegister: (payload: SponsorContactRegisterPayload) => void
  handleDelete: () => void
  handleTypeChange: (rowId: string, nextType: SponsorContactRow['contactType']) => void
}

/**
 * 후원사 담당자 테이블의 선택·드롭다운·등록/삭제 모달 상태와 파생 이름·변경 핸들러를 제공합니다.
 */
export function useSponsorContacts(
  contacts: SponsorContactRow[],
  setContacts: React.Dispatch<React.SetStateAction<SponsorContactRow[]>>,
  canWrite: boolean
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
      setContacts(prev =>
        prev.map(contact => (contact.id === rowId ? { ...contact, contactType: nextType } : contact))
      )
      setOpenDropdownId(null)
    },
    [setContacts, setOpenDropdownId]
  )

  const handleRegister = useCallback(
    (payload: SponsorContactRegisterPayload): void => {
      if (!canWrite) return
      setContacts(prev => {
        const nextIndex = prev.length + 1
        const nextContact: SponsorContactRow = {
          id: `contact-${Date.now()}-${nextIndex}`,
          name: payload.name,
          position: payload.position,
          phone: payload.phone,
          email: payload.email,
          registeredAt: new Date().toISOString(),
          contactType: payload.contactType,
        }
        return [nextContact, ...prev]
      })
      setRegisterModalOpenState(false)
    },
    [canWrite, setContacts]
  )

  const handleDelete = useCallback((): void => {
    if (!canWrite || selectedKeys.length === 0) return
    const selectedSet = new Set(selectedKeys.map(key => String(key)))
    setContacts(prev => prev.filter(contact => !selectedSet.has(contact.id)))
    setSelectedKeysState([])
    setDeleteModalOpenState(false)
  }, [canWrite, selectedKeys, setContacts])

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

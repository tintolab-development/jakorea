/**
 * List 페이지 CRUD 로직 공통 훅
 * 데이터 목록 관리, 생성, 수정, 삭제 상태 및 핸들러 제공
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { MESSAGES } from '@/shared/constants/messages'

export interface UseListCRUDOptions<T extends { id: string }> {
  /** 초기 데이터 */
  initialData: T[]
  /** 생성 핸들러 */
  onCreate?: (values: Partial<T>) => T | Promise<T>
  /** 수정 핸들러 */
  onUpdate?: (id: string, values: Partial<T>) => T | Promise<T>
  /** 삭제 핸들러 */
  onDelete?: (id: string) => void | Promise<void>
  /** ID 생성 함수 (생성 시 사용) */
  generateId?: () => string
  /** 성공 메시지 커스터마이징 */
  messages?: {
    created?: string
    updated?: string
    deleted?: string
    createError?: string
    updateError?: string
    deleteError?: string
  }
}

export interface UseListCRUDReturn<T extends { id: string }> {
  /** 데이터 목록 */
  data: T[]
  /** 데이터 설정 함수 */
  setData: React.Dispatch<React.SetStateAction<T[]>>
  /** 편집 중인 항목 */
  editing: T | null
  /** 모달 열림 상태 */
  open: boolean
  /** 생성 모달 열기 */
  openCreate: () => void
  /** 수정 모달 열기 */
  openEdit: (item: T) => void
  /** 모달 닫기 */
  closeModal: () => void
  /** 제출 핸들러 (생성/수정) */
  handleSubmit: (values: Partial<T>) => Promise<void>
  /** 삭제 핸들러 */
  handleDelete: (id: string) => Promise<void>
  /** 편집 중인 항목 설정 */
  setEditing: React.Dispatch<React.SetStateAction<T | null>>
  /** 모달 열림 상태 설정 */
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * List 페이지 CRUD 로직 공통 훅
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   editing,
 *   open,
 *   openCreate,
 *   openEdit,
 *   closeModal,
 *   handleSubmit,
 *   handleDelete,
 * } = useListCRUD({
 *   initialData: mockItems,
 *   onCreate: (values) => ({ ...values, id: `item-${Date.now()}` }),
 *   onUpdate: (id, values) => ({ id, ...values }),
 *   onDelete: (id) => console.log('delete', id),
 * })
 * ```
 */
export function useListCRUD<T extends { id: string }>({
  initialData,
  onCreate,
  onUpdate,
  onDelete,
  generateId = () => `item-${Date.now()}`,
  messages: customMessages,
}: UseListCRUDOptions<T>): UseListCRUDReturn<T> {
  const [data, setData] = useState<T[]>(initialData)
  const [editing, setEditing] = useState<T | null>(null)
  const [open, setOpen] = useState(false)

  const messages = {
    created: customMessages?.created || MESSAGES.success.created,
    updated: customMessages?.updated || MESSAGES.success.updated,
    deleted: customMessages?.deleted || MESSAGES.success.deleted,
    createError: customMessages?.createError || MESSAGES.error.create,
    updateError: customMessages?.updateError || MESSAGES.error.update,
    deleteError: customMessages?.deleteError || MESSAGES.error.delete,
  }

  const openCreate = useCallback(() => {
    setEditing(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((item: T) => {
    setEditing(item)
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setEditing(null)
  }, [])

  const handleSubmit = useCallback(
    async (values: Partial<T>) => {
      try {
        if (editing) {
          // 수정
          if (onUpdate) {
            const updated = await onUpdate(editing.id, values)
            setData((prev) => prev.map((item) => (item.id === editing.id ? updated : item)))
          } else {
            setData((prev) =>
              prev.map((item) => (item.id === editing.id ? { ...item, ...values } : item))
            )
          }
          message.success(messages.updated)
        } else {
          // 생성
          const newItem: T = onCreate
            ? await onCreate({ ...values, id: generateId() } as Partial<T>)
            : ({ ...values, id: generateId() } as T)
          setData((prev) => [...prev, newItem])
          message.success(messages.created)
        }
        closeModal()
      } catch (error) {
        console.error('Submit error:', error)
        message.error(editing ? messages.updateError : messages.createError)
      }
    },
    [editing, onCreate, onUpdate, generateId, messages, closeModal]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        if (onDelete) {
          await onDelete(id)
        }
        setData((prev) => prev.filter((item) => item.id !== id))
        message.success(messages.deleted)
      } catch (error) {
        console.error('Delete error:', error)
        message.error(messages.deleteError)
      }
    },
    [onDelete, messages]
  )

  return {
    data,
    setData,
    editing,
    open,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete,
    setEditing,
    setOpen,
  }
}

/**
 * 모달 상태 관리 공통 훅
 * 모달 열림/닫힘, 선택된 항목, Form 초기화 로직 통합
 */

import { useState, useCallback, useEffect } from 'react'

export interface UseModalStateOptions<T> {
  /** 초기 데이터 (편집 모드용) */
  initialData?: T | null
  /** 모달 열림 시 콜백 */
  onOpen?: (data?: T) => void
  /** 모달 닫힘 시 콜백 */
  onClose?: () => void
}

export interface UseModalStateReturn<T> {
  /** 모달 열림 상태 */
  open: boolean
  /** 모달 열기 */
  openModal: (data?: T) => void
  /** 모달 닫기 */
  closeModal: () => void
  /** 선택된 항목 (편집 모드) */
  selectedItem: T | null
  /** 선택된 항목 설정 */
  setSelectedItem: React.Dispatch<React.SetStateAction<T | null>>
  /** 편집 모드 여부 */
  isEditing: boolean
}

/**
 * 모달 상태 관리 공통 훅
 * 
 * @example
 * ```tsx
 * const {
 *   open,
 *   openModal,
 *   closeModal,
 *   selectedItem,
 *   isEditing,
 * } = useModalState<Item>({
 *   onOpen: (data) => console.log('opened', data),
 *   onClose: () => console.log('closed'),
 * })
 * 
 * // 생성 모드
 * openModal()
 * 
 * // 편집 모드
 * openModal(item)
 * ```
 */
export function useModalState<T>({
  initialData = null,
  onOpen,
  onClose,
}: UseModalStateOptions<T> = {}): UseModalStateReturn<T> {
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(initialData || null)

  const openModal = useCallback(
    (data?: T) => {
      if (data !== undefined) {
        setSelectedItem(data)
      } else {
        setSelectedItem(null)
      }
      setOpen(true)
      onOpen?.(data)
    },
    [onOpen]
  )

  const closeModal = useCallback(() => {
    setOpen(false)
    // 모달이 닫힐 때 선택된 항목 초기화 (선택적)
    // setSelectedItem(null)
    onClose?.()
  }, [onClose])

  const isEditing = selectedItem != null

  // initialData가 변경되면 selectedItem도 업데이트
  useEffect(() => {
    if (initialData !== undefined) {
      setSelectedItem(initialData)
    }
  }, [initialData])

  return {
    open,
    openModal,
    closeModal,
    selectedItem,
    setSelectedItem,
    isEditing,
  }
}

/**
 * 프로그램 관심 등록 관련 로직 커스텀 훅
 */

import { useState, useEffect } from 'react'
import type { Program } from '@/types/domain'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'

interface UseProgramFavoriteProps {
  open: boolean
  program: Program | null
  favoriteUserId: string | undefined
  canFavorite: boolean
}

export function useProgramFavorite({
  open,
  program,
  favoriteUserId,
  canFavorite,
}: UseProgramFavoriteProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // 관심 프로그램 상태 로드
  useEffect(() => {
    if (!open || !program || !canFavorite || !favoriteUserId) {
      setIsFavorite(false)
      return
    }

    let cancelled = false
    const loadFavorite = async () => {
      try {
        const favorite = await isFavoriteProgram(favoriteUserId, program.id)
        if (!cancelled) {
          setIsFavorite(favorite)
        }
      } catch (error) {
        console.error('관심 프로그램 상태 로드 실패:', error)
      }
    }

    loadFavorite()
    return () => {
      cancelled = true
    }
  }, [open, program, canFavorite, favoriteUserId])

  // 관심 프로그램 토글
  const toggleFavorite = async () => {
    if (!favoriteUserId || !program) return

    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await removeFavoriteProgram(favoriteUserId, program.id)
        setIsFavorite(false)
        } else {
        await addFavoriteProgram(favoriteUserId, program.id)
        setIsFavorite(true)
        }
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
      } finally {
      setFavoriteLoading(false)
    }
  }

  return {
    isFavorite,
    favoriteLoading,
    toggleFavorite,
  }
}

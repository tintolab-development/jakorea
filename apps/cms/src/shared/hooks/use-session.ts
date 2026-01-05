/**
 * 세션 관리 훅
 * Phase 4.1.1: 세션 관리 및 자동 로그아웃
 */

import { useEffect, useRef } from 'react'
import React from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const WARNING_TIME = 5 * 60 * 1000 // 5분 전 경고

export function useSession() {
  const { logout, expiresAt } = useAuthStore()
  const timeoutRef = useRef<number | null>(null)
  const warningRef = useRef<number | null>(null)
  const warningShownRef = useRef(false)

  useEffect(() => {
    if (!expiresAt) {
      return
    }

    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    if (timeUntilExpiry <= 0) {
      logout()
      return
    }

    // 경고 시간 설정
    const warningTime = timeUntilExpiry - WARNING_TIME
    if (warningTime > 0) {
      warningRef.current = window.setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true
          Modal.warning({
            title: '세션 만료 경고',
            icon: React.createElement(ExclamationCircleOutlined),
            content: '5분 후 세션이 만료됩니다. 계속 사용하려면 다시 로그인해주세요.',
            okText: '확인',
            onOk: () => {
              warningShownRef.current = false
            },
          })
        }
      }, warningTime)
    }

    // 자동 로그아웃 설정
    timeoutRef.current = window.setTimeout(() => {
      Modal.info({
        title: '세션 만료',
        content: '세션이 만료되어 자동으로 로그아웃됩니다.',
        okText: '확인',
        onOk: () => {
          logout()
        },
      })
    }, timeUntilExpiry)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
      warningShownRef.current = false
    }
  }, [expiresAt, logout])
}


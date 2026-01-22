/**
 * 단일 CTA 컴포넌트
 * 공통 UI 원칙: 최대 1개만 노출, 명확한 행동 안내, targetUrl 기반 네비게이션
 */

import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

interface SingleCTAProps {
  label: string
  targetUrl?: string
  onClick?: () => void
  type?: 'primary' | 'default'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  size?: 'large' | 'middle' | 'small'
}

export function SingleCTA({ 
  label, 
  targetUrl, 
  onClick, 
  type = 'primary',
  loading = false,
  disabled = false,
  block = false,
  size = 'middle'
}: SingleCTAProps) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (targetUrl) {
      navigate(targetUrl)
    } else if (onClick) {
      onClick()
    }
  }
  
  return (
    <Button 
      type={type} 
      onClick={handleClick}
      loading={loading}
      disabled={disabled || (!targetUrl && !onClick)}
      block={block}
      size={size}
    >
      {label}
    </Button>
  )
}


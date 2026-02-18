/**
 * 레이블이 있는 검색 인풋 컴포넌트
 * 모든 검색 필터를 통일된 UI로 제공
 */

import { Input, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import './labeled-search-input.css'

const { Text } = Typography

export interface LabeledSearchInputProps {
  /** 레이블 텍스트 */
  label: string
  /** 플레이스홀더 텍스트 */
  placeholder?: string
  /** 검색어 값 */
  value?: string
  /** 검색어 변경 핸들러 */
  onChange?: (value: string) => void
  /** 인풋 너비 */
  width?: number | string
  /** 추가 스타일 */
  style?: React.CSSProperties
  /** allowClear 옵션 */
  allowClear?: boolean
  /** disabled 상태 */
  disabled?: boolean
  /** 검색(돋보기) 아이콘 표시 여부. false면 prefix 아이콘 없음 */
  showPrefixIcon?: boolean
  /** 레이블 표시 여부. false면 레이블 미표시(인풋만, 헤더 액션 등과 정렬 시 사용) */
  showLabel?: boolean
}

/**
 * 레이블이 있는 검색 인풋 컴포넌트
 * 오른쪽 돋보기 아이콘 영역 없이 왼쪽에만 아이콘 표시
 *
 * @example
 * ```tsx
 * <LabeledSearchInput
 *   label="프로그램명"
 *   placeholder="프로그램명을 입력하세요"
 *   value={searchValue}
 *   onChange={setSearchValue}
 * />
 * ```
 */
export function LabeledSearchInput({
  label,
  placeholder,
  value,
  onChange,
  width = 300,
  style,
  allowClear = true,
  disabled = false,
  showPrefixIcon = true,
  showLabel = true,
}: LabeledSearchInputProps) {
  return (
    <div
      className={`labeled-search-input ${showPrefixIcon ? '' : 'labeled-search-input--no-icon'} ${!showLabel ? 'labeled-search-input--no-label' : ''}`}
      style={style}
    >
      {showLabel && <Text className="labeled-search-input__label">{label}</Text>}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        allowClear={allowClear}
        disabled={disabled}
        style={{ width }}
        prefix={
          showPrefixIcon ? <SearchOutlined className="labeled-search-input__icon" /> : undefined
        }
        className="labeled-search-input__input"
      />
    </div>
  )
}

/**
 * 레이블이 있는 검색 인풋 컴포넌트
 * 모든 검색 필터를 통일된 UI로 제공
 */

import { SearchOutlined } from '@ant-design/icons'
import './labeled-search-input.css'
import { CmsInput } from './cms-input'

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
  /** 포커스 해제 시 콜백 (한글 IME 등 입력 완료 후 URL 동기화용) */
  onBlur?: () => void
  /** default: 일반 폼 높이. filter: 통일 필터 카드(44px 등) */
  uiVariant?: 'default' | 'filter'
  /** true면 숫자만 입력 가능(비숫자 문자·붙여넣기 즉시 제거) */
  numericOnly?: boolean
}

/**
 * 레이블이 있는 검색 인풋 컴포넌트
 * 오른쪽 돋보기 아이콘 영역 없이 왼쪽에만 아이콘 표시
 */
export function LabeledSearchInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  width = 300,
  style,
  disabled = false,
  showPrefixIcon = false,
  showLabel = true,
  numericOnly = false,
}: LabeledSearchInputProps) {
  const handleChange = (raw: string) => {
    const next = numericOnly ? raw.replace(/\D/g, '') : raw
    onChange?.(next)
  }
  const wrapperClassName = [
    'labeled-search-input',
    !showPrefixIcon && 'labeled-search-input--no-icon',
    !showLabel && 'labeled-search-input--no-label',
  ]
    .filter((className): className is string => Boolean(className))
    .join(' ')

  return (
    <div className={wrapperClassName} style={style}>
      {showLabel && <span className="labeled-search-input__label">{label}</span>}
      <CmsInput
        className="labeled-search-input__control labeled-search-input__input"
        placeholder={placeholder}
        value={value}
        inputSize="large"
        onChange={e => handleChange(e.target.value)}
        onBlur={onBlur}
        inputMode={numericOnly ? 'numeric' : undefined}
        allowClear={true}
        width={width}
        disabled={disabled}
        icon={
          showPrefixIcon ? <SearchOutlined className="labeled-search-input__icon" /> : undefined
        }
      />
    </div>
  )
}

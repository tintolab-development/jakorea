/**
 * Material Design 3 Chip Set
 * 여러 Chip을 그룹으로 관리
 */

// M3 Chip 컴포넌트 import (MdChip에서 이미 import되지만 명시적으로 포함)
import { MdChip } from './index'

interface MdChipSetProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  label?: string
}

export default function MdChipSet({ options, selected, onChange, label }: MdChipSetProps) {
  const toggleChip = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((option) => (
          <MdChip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onClick={() => toggleChip(option)}
          />
        ))}
      </div>
    </div>
  )
}


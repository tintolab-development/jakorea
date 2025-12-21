/**
 * 주체 유형 표시용 Chip 컴포넌트
 * 학교, 학생, 강사를 구분하여 표시
 */

import './SubjectTypeChip.css'

interface SubjectTypeChipProps {
  subjectType: 'school' | 'student' | 'instructor'
  label?: string
  className?: string
}

export default function SubjectTypeChip({ 
  subjectType, 
  label,
  className = '' 
}: SubjectTypeChipProps) {
  // 주체 유형에 따른 레이블
  const getLabel = (): string => {
    if (label) return label
    switch (subjectType) {
      case 'school':
        return '학교'
      case 'student':
        return '학생'
      case 'instructor':
        return '강사'
      default:
        return subjectType
    }
  }

  return (
    <span className={`subject-type-chip subject-type-${subjectType} ${className}`.trim()}>
      {getLabel()}
    </span>
  )
}






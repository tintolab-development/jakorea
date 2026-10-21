import type { ReactNode } from 'react'
import type { ParagraphCardEditableHeading } from '@jakorea/form-template-runtime'

/** 안내사항·성범죄 단락 — 읽기 전용 카드 헤더 (신청 양식 단락과 동일 마크업) */
export function institutionGuidanceParagraphHeading(
  title: string,
  description: string,
  options?: { required?: boolean; titleTrailing?: ReactNode },
): ParagraphCardEditableHeading {
  const trimmedDescription = description.trim()
  return {
    isEditMode: false,
    titleValue: title,
    onTitleChange: () => {},
    titleRequired: options?.required ?? true,
    descriptionValue: trimmedDescription,
    onDescriptionChange: () => {},
    showDescription: trimmedDescription.length > 0,
    titleTrailing: options?.titleTrailing,
  }
}

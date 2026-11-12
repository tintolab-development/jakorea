/**
 * 교재 단원 소개 본문 이미지 — EDUCATION_TEXTBOOK_INLINE_IMAGE(일반 자산 API)로 올린 뒤 공개 주소를 넣는다.
 */

import { uploadAdminInlineImage } from '@/shared/lib/upload-admin-inline-image'

export function uploadEducationTextbookInlineImage(file: File): Promise<string> {
  return uploadAdminInlineImage(file, 'EDUCATION_TEXTBOOK_INLINE_IMAGE')
}

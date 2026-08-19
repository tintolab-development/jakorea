import type { MailTemplateFormMode } from './types'

export const MAIL_FORM_URL = {
  mode: 'mail_form',
  templateId: 'mail_tpl',
  categoryId: 'mail_form_cat',
} as const

export type MailTemplateFormUrlState = {
  open: boolean
  mode: MailTemplateFormMode
  templateId: string | null
  categoryId: string | null
}

export function mailFormStateFromSearchParams(
  searchParams: URLSearchParams
): MailTemplateFormUrlState {
  const rawMode = searchParams.get(MAIL_FORM_URL.mode)?.trim()
  if (rawMode !== 'create' && rawMode !== 'edit') {
    return { open: false, mode: 'create', templateId: null, categoryId: null }
  }

  const templateId = searchParams.get(MAIL_FORM_URL.templateId)?.trim() || null
  const categoryId = searchParams.get(MAIL_FORM_URL.categoryId)?.trim() || null

  if (rawMode === 'edit' && !templateId) {
    return { open: false, mode: 'create', templateId: null, categoryId: null }
  }

  return {
    open: true,
    mode: rawMode,
    templateId: rawMode === 'edit' ? templateId : null,
    categoryId: rawMode === 'create' ? categoryId : null,
  }
}

export function openMailCreateFormSearchParams(
  prev: URLSearchParams,
  categoryId?: string | null
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set(MAIL_FORM_URL.mode, 'create')
  next.delete(MAIL_FORM_URL.templateId)
  const trimmedCategoryId = categoryId?.trim()
  if (trimmedCategoryId) next.set(MAIL_FORM_URL.categoryId, trimmedCategoryId)
  else next.delete(MAIL_FORM_URL.categoryId)
  return next
}

export function openMailEditFormSearchParams(
  prev: URLSearchParams,
  templateId: string
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set(MAIL_FORM_URL.mode, 'edit')
  next.set(MAIL_FORM_URL.templateId, templateId.trim())
  next.delete(MAIL_FORM_URL.categoryId)
  return next
}

export function closeMailFormSearchParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.delete(MAIL_FORM_URL.mode)
  next.delete(MAIL_FORM_URL.templateId)
  next.delete(MAIL_FORM_URL.categoryId)
  return next
}

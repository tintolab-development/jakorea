import type { SmsTemplateFormMode } from './types'

export const SMS_FORM_URL = {
  mode: 'sms_form',
  templateId: 'sms_tpl',
  categoryId: 'sms_form_cat',
} as const

export type SmsTemplateFormUrlState = {
  open: boolean
  mode: SmsTemplateFormMode
  templateId: string | null
  categoryId: string | null
}

export function smsFormStateFromSearchParams(
  searchParams: URLSearchParams
): SmsTemplateFormUrlState {
  const rawMode = searchParams.get(SMS_FORM_URL.mode)?.trim()
  if (rawMode !== 'create' && rawMode !== 'edit') {
    return { open: false, mode: 'create', templateId: null, categoryId: null }
  }

  const templateId = searchParams.get(SMS_FORM_URL.templateId)?.trim() || null
  const categoryId = searchParams.get(SMS_FORM_URL.categoryId)?.trim() || null

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

export function openSmsCreateFormSearchParams(
  prev: URLSearchParams,
  categoryId?: string | null
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set(SMS_FORM_URL.mode, 'create')
  next.delete(SMS_FORM_URL.templateId)
  const trimmedCategoryId = categoryId?.trim()
  if (trimmedCategoryId) next.set(SMS_FORM_URL.categoryId, trimmedCategoryId)
  else next.delete(SMS_FORM_URL.categoryId)
  return next
}

export function openSmsEditFormSearchParams(
  prev: URLSearchParams,
  templateId: string
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set(SMS_FORM_URL.mode, 'edit')
  next.set(SMS_FORM_URL.templateId, templateId.trim())
  next.delete(SMS_FORM_URL.categoryId)
  return next
}

export function closeSmsFormSearchParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.delete(SMS_FORM_URL.mode)
  next.delete(SMS_FORM_URL.templateId)
  next.delete(SMS_FORM_URL.categoryId)
  return next
}

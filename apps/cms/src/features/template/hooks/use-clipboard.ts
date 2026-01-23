import { message } from 'antd'
import { MESSAGES } from '@/shared/constants/messages'

export function useClipboard() {
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(MESSAGES.success.copied)
    } catch {
      message.error(MESSAGES.error.copy)
    }
  }

  return { copyText }
}

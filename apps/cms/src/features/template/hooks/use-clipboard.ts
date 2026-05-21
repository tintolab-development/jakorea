
export function useClipboard() {
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      } catch (error) {
      console.debug('clipboard write failed', error)
    }
  }

  return { copyText }
}

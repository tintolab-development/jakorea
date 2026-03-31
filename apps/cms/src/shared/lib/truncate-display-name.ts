/**
 * 목록 등 짧은 칸용: 이름이 maxChars 글자(유니코드 스칼라)를 넘으면 앞부분만 + "..."
 */
export function truncateDisplayNameForList(name: string, maxChars = 3): string {
  const chars = [...name]
  if (chars.length <= maxChars) return name
  return `${chars.slice(0, maxChars).join('')}...`
}

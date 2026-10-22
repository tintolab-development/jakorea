/** Vite `define` — 배포 확인용 빌드 시각(KST)과 커밋 SHA */
export function viteAppBuildDefine(): Record<string, string> {
  const builtAt = `${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7)
  return {
    'import.meta.env.VITE_APP_BUILD_AT': JSON.stringify(builtAt),
    'import.meta.env.VITE_APP_GIT_SHA': JSON.stringify(sha),
  }
}

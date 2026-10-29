import { closeSync, existsSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

function pidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function acquireDevLock(lockPath) {
  if (existsSync(lockPath)) {
    const existing = Number(readFileSync(lockPath, 'utf8').trim())
    if (Number.isInteger(existing) && pidAlive(existing)) {
      return false
    }
    try {
      unlinkSync(lockPath)
    } catch {
      // 다른 프로세스가 동시에 지웠을 수 있음
    }
  }

  try {
    const fd = openSync(lockPath, 'wx')
    try {
      writeFileSync(fd, String(process.pid))
    } finally {
      closeSync(fd)
    }
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      return false
    }
    throw error
  }
}

export function releaseDevLock(lockPath, held) {
  if (!held) return
  try {
    unlinkSync(lockPath)
  } catch {
    // 이미 없음
  }
}

import { vi } from 'vitest'

function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => {
      map.clear()
    },
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value))
    },
  }
}

const storageBroken =
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.getItem !== 'function'

if (storageBroken) {
  vi.stubGlobal('localStorage', createMemoryStorage())
  vi.stubGlobal('sessionStorage', createMemoryStorage())
}

// pdfjs-dist@6 requires global Iterator (Node 22+). Vitest often runs on Node 20.
vi.mock('pdfjs-dist', () => ({
  AnnotationMode: { DISABLE: 0 },
  getDocument: vi.fn(() => ({ promise: Promise.resolve(null) })),
  GlobalWorkerOptions: { workerSrc: '' },
}))

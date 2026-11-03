const PDF_MAGIC = '%PDF-'
const GENERATED_DOCUMENT_STUB = 'JA Korea Generated Document'

/** BE legacy structured stub — certificate download GET 재시도 트리거 */
export class CertificateLegacyRenderStubError extends Error {
  override name = 'CertificateLegacyRenderStubError'

  constructor() {
    super('legacy certificate render stub')
  }
}

export async function isLegacyCertificateRenderStub(blob: Blob): Promise<boolean> {
  const preview = (await blob.slice(0, 512).text()).trim()
  return (
    preview.startsWith(GENERATED_DOCUMENT_STUB) ||
    /\bjobType\s*=\s*CERTIFICATE_RENDER\b/.test(preview) ||
    (/\bjobId\s*=/.test(preview) && /\bjobType\s*=/.test(preview))
  )
}

export async function assertCertificatePdfBlob(
  blob: Blob,
  label = '수료증',
): Promise<Blob> {
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error(`${label} 파일을 받지 못했습니다.`)
  }

  const magic = await blob.slice(0, 5).text()
  if (magic.startsWith(PDF_MAGIC)) {
    if (await isLegacyCertificateRenderStub(blob)) {
      throw new CertificateLegacyRenderStubError()
    }
    return blob.type.toLowerCase().includes('pdf') ? blob : new Blob([blob], { type: 'application/pdf' })
  }

  if (await isLegacyCertificateRenderStub(blob)) {
    throw new CertificateLegacyRenderStubError()
  }

  throw new Error(`${label} PDF 형식이 아닙니다. 잠시 후 다시 시도해 주세요.`)
}

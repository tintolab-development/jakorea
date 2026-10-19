/**
 * Springdoc OpenAPI 3.1 → Orval(OpenAPI 3.0 validator) 호환.
 * `type: ["string", "null"]` → `type: "string", nullable: true` 등.
 */
export function normalizeOpenApiSchemaNode(node) {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) normalizeOpenApiSchemaNode(item)
    return
  }
  if (node.$ref && node.type === 'null') {
    delete node.type
    node.nullable = true
  }
  if (Array.isArray(node.type)) {
    const hasNull = node.type.includes('null')
    const types = node.type.filter(t => t !== 'null')
    node.type = types[0] ?? 'string'
    if (hasNull) node.nullable = true
  }
  for (const value of Object.values(node)) {
    normalizeOpenApiSchemaNode(value)
  }
}

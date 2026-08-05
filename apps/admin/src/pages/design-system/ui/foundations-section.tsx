import { DsDemo, DsSection } from './section'

const SWATCHES = [
  { name: 'Brand primary', varName: '--color-brand-primary', fallback: '#01a1af' },
  { name: 'Default BK', varName: '--default-BK', fallback: '#3d3d3d' },
  { name: 'Table th BG', varName: '--table-th-bg', fallback: 'gradient + #fff' },
  { name: 'BG header', varName: '--BG-header', fallback: 'rgba(231,235,239,.6) on #fff' },
  { name: 'Table line', varName: '--table-line', fallback: '#e0e0e0' },
  { name: 'BG secondary', varName: '--color-bg-secondary', fallback: '#f5f5f5' },
  { name: 'Error', varName: '--color-error', fallback: '#ff4d4f' },
] as const

export function FoundationsSection() {
  return (
    <DsSection
      id="foundations"
      title="Foundations"
      description="theme-provider 토큰. CMS와 동일 값으로 미러링되어 있습니다."
    >
      <DsDemo label="Color tokens">
        <div className="ds-swatch-grid">
          {SWATCHES.map(item => (
            <div key={item.varName} className="ds-swatch">
              <div
                className="ds-swatch__chip"
                style={{ background: `var(${item.varName}, ${item.fallback})` }}
              />
              <p className="ds-swatch__meta">
                {item.name}
                <br />
                <code>{item.varName}</code>
              </p>
            </div>
          ))}
        </div>
      </DsDemo>
    </DsSection>
  )
}

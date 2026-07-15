import { DsDemo, DsSection } from './section'

type Swatch = { token: string; label: string }

const BRAND_SWATCHES: Swatch[] = [
  { token: '--color-brand-primary', label: 'Primary' },
  { token: '--color-brand-primary-hover', label: 'Primary hover' },
  { token: '--color-brand-secondary-1', label: 'Secondary 1' },
  { token: '--color-brand-secondary-2', label: 'Secondary 2' },
  { token: '--JA-mint-01', label: 'JA mint 01' },
  { token: '--JA-mint-02', label: 'JA mint 02' },
]

const DOMAIN_SWATCHES: Swatch[] = [
  { token: '--color-program', label: 'Program' },
  { token: '--color-school', label: 'School' },
  { token: '--color-instructor', label: 'Instructor' },
  { token: '--color-sponsor', label: 'Sponsor' },
  { token: '--color-application', label: 'Application' },
  { token: '--color-schedule', label: 'Schedule' },
  { token: '--color-matching', label: 'Matching' },
  { token: '--color-settlement', label: 'Settlement' },
]

const SURFACE_SWATCHES: Swatch[] = [
  { token: '--color-bg-base', label: 'BG base' },
  { token: '--color-bg-secondary', label: 'BG secondary' },
  { token: '--color-bg-tertiary', label: 'BG tertiary' },
  { token: '--color-bg-accent', label: 'BG accent' },
  { token: '--color-border', label: 'Border' },
  { token: '--color-text-heading', label: 'Text heading' },
  { token: '--color-text-body', label: 'Text body' },
  { token: '--color-text-secondary', label: 'Text secondary' },
]

const DANGER_SWATCHES: Swatch[] = [
  { token: '--color-required-mark', label: 'Required mark' },
  { token: '--color-settlement', label: 'Danger / settlement' },
  { token: '--color-danger-hover', label: 'Danger hover' },
  { token: '--color-danger-secondary', label: 'Danger secondary' },
  { token: '--color-danger-secondary-bg', label: 'Danger secondary bg' },
  { token: '--color-danger-fill-hover', label: 'Danger fill hover' },
]

const SPACING = [
  ['--spacing-4', '4px'],
  ['--spacing-8', '8px'],
  ['--spacing-12', '12px'],
  ['--spacing-16', '16px'],
  ['--spacing-20', '20px'],
  ['--spacing-24', '24px'],
  ['--spacing-32', '32px'],
] as const

const RADII = [
  ['--radius-4', '4px'],
  ['--radius-6', '6px'],
  ['--radius-8', '8px'],
  ['--radius-16', '16px'],
] as const

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className="ds-swatch-grid">
      {items.map(item => (
        <div key={item.token} className="ds-swatch">
          <div
            className="ds-swatch__chip"
            style={{ background: `var(${item.token})` }}
            aria-hidden
          />
          <p className="ds-swatch__name">{item.label}</p>
          <p className="ds-swatch__token">{item.token}</p>
        </div>
      ))}
    </div>
  )
}

export function FoundationsSection() {
  return (
    <DsSection
      id="foundations"
      title="Foundations"
      description="토큰 SSOT는 theme-provider.css. Ant 테마 hex는 colors.ts / theme-provider.tsx와 동기화. 제품 룩 변경은 Phase 5에서 shared·토큰만."
    >
      <p className="ds-note">
        ConfigProvider colorPrimary는 <code>brandColorsHex.primary</code>와 같고, CSS는
        --color-brand-primary → --JA-mint-01 / --color-mint-01 alias입니다. Platform·packages/ui와
        무관합니다.
      </p>

      <DsDemo label="Brand">
        <SwatchGrid items={BRAND_SWATCHES} />
      </DsDemo>

      <DsDemo label="Domain accents">
        <SwatchGrid items={DOMAIN_SWATCHES} />
      </DsDemo>

      <DsDemo label="Text / surface / border">
        <SwatchGrid items={SURFACE_SWATCHES} />
      </DsDemo>

      <DsDemo label="Danger">
        <SwatchGrid items={DANGER_SWATCHES} />
      </DsDemo>

      <DsDemo label="Token Do / Don't">
        <ul className="ds-list">
          <li>
            <strong>Do:</strong> <code>var(--color-*)</code>, <code>var(--spacing-*)</code>,{' '}
            <code>var(--radius-*)</code> 등 theme-provider 토큰을 사용합니다.
          </li>
          <li>
            <strong>Don&apos;t:</strong> 토큰이 있는데 raw hex를 새로 박지 않습니다. 필요하면 토큰을
            먼저 확인·추가합니다.
          </li>
        </ul>
      </DsDemo>

      <DsDemo label="Spacing (4px base)">
        <table className="ds-token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Value</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {SPACING.map(([token, value]) => (
              <tr key={token}>
                <td>
                  <code>{token}</code>
                </td>
                <td>{value}</td>
                <td>
                  <div className="ds-space-bar">
                    <span className="ds-space-bar__mark" style={{ width: `var(${token})` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DsDemo>

      <DsDemo label="Radius">
        <table className="ds-token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Value</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {RADII.map(([token, value]) => (
              <tr key={token}>
                <td>
                  <code>{token}</code>
                </td>
                <td>{value}</td>
                <td>
                  <div
                    style={{
                      width: 48,
                      height: 32,
                      background: 'var(--color-brand-primary-overlay-25)',
                      border: '1px solid var(--color-brand-primary)',
                      borderRadius: `var(${token})`,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DsDemo>

      <DsDemo label="Typography">
        <div className="ds-demo__stack">
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-32)', fontWeight: 700 }}>
            Pretendard 32 / 700 — 페이지 타이틀
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-24)', fontWeight: 700 }}>
            Pretendard 24 / 700 — 섹션 타이틀
          </p>
          <p className="ds-type-sample" style={{ fontSize: 'var(--font-size-16)', fontWeight: 400 }}>
            Pretendard 16 / 400 — 본문
          </p>
          <p
            className="ds-type-sample"
            style={{
              fontFamily: 'var(--font-family-number)',
              fontSize: 'var(--font-size-14)',
              fontWeight: 500,
            }}
          >
            Outfit 14 / 500 — 숫자·코드성 텍스트 123,456
          </p>
        </div>
      </DsDemo>
    </DsSection>
  )
}

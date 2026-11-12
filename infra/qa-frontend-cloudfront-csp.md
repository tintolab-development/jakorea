# QA 프론트 CloudFront CSP 최종 수정

QA로 올린 Admin / Platform(사용자 홈페이지) 브라우저 콘솔의 CSP 경고는 **앱 버그가 아니다.** `Content-Security-Policy-Report-Only: default-src 'self'`만 있고 `style-src` · `font-src` · `connect-src` · `frame-src`가 없어, 브라우저가 전부 `default-src`로 판정한 **인프라 헤더** 문제다.

문구에 `The policy is report-only`가 있으면 **로그만** 남고 화면은 막히지 않는다. 배포 실패·크래시로 취급하지 않는다. 고치려면 CloudFront Response Headers Policy(또는 WAF/ALB가 같은 헤더를 넣는 경우 그쪽)를 수정한다. 이 프론트 레포의 `index.html`이나 React 코드를 고쳐 없애는 문제가 아니다.

`infra/newprod/frontend-static.yml` 스택과는 다른 QA 배포다.

## 앱 구분

콘솔 한 줄로 어느 사이트인지 본다.

| 로그 | 앱 |
| --- | --- |
| `[Admin] 배포 빌드 …` | Homepage Admin |
| `[Platform] 배포 빌드 …` | 사용자 홈페이지 (Platform) |
| `[CMS] 배포 빌드 …` | CMS (같은 유형이면 CMS 배포에도 동일 절차) |

인라인 스타일만 보이면 Admin에서 흔하다. Google Fonts · YouTube iframe이 보이면 Platform이다. **같은 CSP 유형**이고, allowlist만 앱마다 다르다.

## QA 대상

계정 `264015108093`, 리전 `ap-northeast-2`.

| 앱 | Distribution | 정적 버킷 | 공개 URL |
| --- | --- | --- | --- |
| Admin | `E2DGTFXBDMZU0O` | `ja-prod-frontend-admin-264015108093` | `https://d2rdfkctvi6zhx.cloudfront.net` |
| Platform | `E16QK1U83PRA5Z` | `ja-prod-frontend-platform-264015108093` | 해당 배포 DomainName (`get-distribution`) |
| CMS | `E1H6YN0NW3269W` | `ja-prod-frontend-cms-264015108093` | 해당 배포 DomainName |

Admin 기본 캐시 origin Id는 `s3-admin`이다. 성공 시 S3 도메인은 `ja-prod-frontend-admin-264015108093.s3.ap-northeast-2.amazonaws.com`이다. origin 목록 `Items[0]`에 ALB(`ja-prod-api-alb-957145248.ap-northeast-2.elb.amazonaws.com`)가 있어도 CSP는 S3 HTML이 아니라 엣지·로드밸런서 헤더일 수 있다.

## 관측된 위반과 코드 근거

모두 report-only · `default-src 'self'` 폴백이다.

| 지시문이 없어서 폴백된 것 | 요청 | 근거 |
| --- | --- | --- |
| (인라인) style | React `style={{}}`, Ant Design `<style>` | Admin/CMS UI |
| `style-src-elem` | `https://fonts.googleapis.com/css2?family=Outfit:…` | Platform `tokens.css`, Admin/CMS `theme-provider.css` |
| `font-src` | `https://fonts.gstatic.com/s/outfit/…woff2` | 위 CSS가 받는 폰트 파일 |
| `connect-src` | API CloudFront 등 (콘솔에 `<URL>`로 가려질 수 있음) | QA env API |
| `frame-src` | `https://www.youtube-nocookie.com/` | Platform `youtube.ts` embed |

콘솔의 `sha256-…` 해시 하나만 정책에 넣지 않는다. Ant Design·폰트 CSS가 바뀔 때마다 해시가 달라진다.

Admin/CMS는 TossFace도 쓴다.

- `https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css`

Platform 주소 검색:

- `https://business.juso.go.kr/addrlink/addrLinkApi.do`

## 1. 헤더 출처 확인

Admin 예시:

```bash
curl -sI https://d2rdfkctvi6zhx.cloudfront.net/ | grep -i content-security-policy
```

Platform은 해당 CloudFront 도메인으로 같은 명령을 친다.

| 헤더 | 의미 |
| --- | --- |
| `Content-Security-Policy-Report-Only` | 리포트만. 동작은 허용. |
| `Content-Security-Policy` | enforce. 위반 시 브라우저가 막음. |

`index.html`에 CSP 메타가 없고 `curl -I`에 헤더가 있으면 인프라 레이어다. 순서:

1. CloudFront 배포 → Behaviors → Response headers policy
2. CloudFront Function / Lambda@Edge (Viewer response)
3. AWS WAF 커스텀 헤더
4. ALB 리스너 또는 ALB 뒤 앱

CloudFront와 ALB/WAF가 같은 헤더를 둘 다 넣으면 한쪽만 고쳐도 경고가 남는다. 값을 맞추거나 중복을 뺀다.

```bash
aws cloudfront get-distribution-config --id E2DGTFXBDMZU0O \
  --query 'DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId' \
  --output text

aws cloudfront get-distribution-config --id E16QK1U83PRA5Z \
  --query 'DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId' \
  --output text
```

나온 ID로 `aws cloudfront get-response-headers-policy --id <policy-id>`를 본다. `SecurityHeadersConfig.ContentSecurityPolicy` 또는 커스텀 헤더 `Content-Security-Policy-Report-Only`를 확인한다.

## 2. 최종 권장 정책 (Report-Only)

의도가 **콘솔 경고 제거**이면 기존 Report-Only 값을 아래로 교체한다.  
의도가 **실제로 막기**이면 한동안 Report-Only로 검증한 뒤 헤더 이름을 `Content-Security-Policy`로 바꾸고 Report-Only를 제거한다.

한 줄로 넣는다. 공백·세미콜론을 깨지 않는다.

### Platform (사용자 홈페이지) — 콘솔에 Fonts·YouTube가 뜬 경우

```
default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self'; img-src 'self' data: blob: https://i.ytimg.com; connect-src 'self' https://d3r1iaa0sy4tcq.cloudfront.net https://d388j6f4woncqy.cloudfront.net https://business.juso.go.kr; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
```

### Admin

```
default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; script-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://d3r1iaa0sy4tcq.cloudfront.net https://d388j6f4woncqy.cloudfront.net https://d39lkvqlx43zyt.cloudfront.net; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
```

CMS는 Admin과 같이 Outfit + TossFace를 쓰므로 Admin 값을 기준으로 하고, `connect-src`는 CMS가 실제로 치는 API 오리진으로 바꾼다.

| 지시문 | 역할 |
| --- | --- |
| `style-src` / `style-src-elem` + `'unsafe-inline'` + Google Fonts CSS | 인라인·Ant Design·Outfit `@import` |
| `font-src` + `fonts.gstatic.com` | Outfit woff2 |
| `script-src 'self'` | JS 인라인은 열지 않음 |
| `connect-src` | QA API CloudFront (가려진 `<URL>`의 실체) |
| `frame-src` YouTube nocookie | Platform 영상 embed |
| `cdn.jsdelivr.net` | Admin/CMS TossFace만 |

QA API 오리진 (워크플로 env, 2026-11-12 기준):

- `https://d3r1iaa0sy4tcq.cloudfront.net`
- `https://d388j6f4woncqy.cloudfront.net`
- Admin CMS 링크: `https://d39lkvqlx43zyt.cloudfront.net`

API 도메인이 바뀌면 `connect-src`도 같이 바꾼다. 콘솔 connect 위반의 실제 호스트는 DevTools Network에서 확인한다.

카카오 맵(`t1.kakaocdn.net`)·소셜 로그인 팝업을 쓰는 페이지에서 추가 위반이 나면 해당 호스트만 `script-src` / `connect-src` / `frame-src`에 보탠다. 처음부터 `default-src`에 `'unsafe-inline'`을 넣지 않는다.

## 3. CloudFront에서 수정

1. CloudFront → 해당 Distribution (Admin `E2DGTFXBDMZU0O` / Platform `E16QK1U83PRA5Z`)
2. Behaviors → Default (`*`)
3. Response headers policy 확인
4. 커스텀 정책이면 Report-Only(또는 enforce) 값을 §2로 교체
5. AWS 관리형 SecurityHeadersPolicy이면 복사해 커스텀 정책을 만든 뒤 Behavior에 그 정책 ID를 붙인다
6. 저장 후 `/*` 무효화

```bash
aws cloudfront get-response-headers-policy --id <policy-id>
# 커스텀이면 update-response-headers-policy
# 관리형이면 복사본 생성 후 Behavior의 ResponseHeadersPolicyId 교체
aws cloudfront create-invalidation --distribution-id E16QK1U83PRA5Z --paths '/*'
aws cloudfront create-invalidation --distribution-id E2DGTFXBDMZU0O --paths '/*'
```

`If-Match`에는 get 응답 ETag를 그대로 쓴다.

세 앱이 **같은 응답 헤더 정책 ID**를 공유하면, Admin용 짧은 정책으로 덮지 말고 Platform까지 커버하는 값을 쓰거나 정책을 분리한다.

## 4. 하지 말 것

- `default-src`에 `'unsafe-inline'` — 스크립트까지 열림
- 콘솔 해시 하나만 `style-src`에 넣기
- Admin 인라인만 고치고 Platform Fonts/YouTube를 빼기
- 이 프론트 레포 소스만 고치고 헤더는 그대로 두기
- Report-Only를 검증 없이 바로 enforce — `connect-src`·폰트·iframe 누락 시 화면이 깨짐
- `infra/newprod/frontend-static.yml`만 고치고 QA가 고쳐졌다고 보기

## 5. 검증

```bash
curl -sI https://d2rdfkctvi6zhx.cloudfront.net/ | grep -i content-security-policy
```

Platform은 해당 공개 도메인으로 동일하게 확인한다.

- 헤더에 `style-src`, `font-src`, `connect-src`, (Platform이면) `frame-src`가 있는지
- 하드 리로드 후 같은 `default-src 'self'` 폴백 위반이 더 늘지 않는지
- enforce 전환 시 로그인, API, Outfit 숫자 폰트, YouTube 임베드, (Admin) TossFace가 막히지 않는지

## 관련 코드 (헤더 수정 대상 아님, allowlist 근거)

- Platform Outfit: `apps/platform/src/shared/styles/tokens.css`
- Platform YouTube: `apps/platform/src/shared/lib/youtube.ts`
- Admin/CMS Outfit·TossFace: `apps/admin/src/app/providers/theme-provider.css`, `apps/cms/src/app/providers/theme-provider.css`
- Admin QA 배포: `.github/workflows/deploy-admin-qa.yml`
- Platform QA 배포: `.github/workflows/deploy-portal-qa.yml`
- CMS QA 배포: `.github/workflows/deploy-cms-qa.yml`

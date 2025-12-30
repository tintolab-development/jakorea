# MCP 서버 설정 가이드

Filesystem MCP와 Git MCP를 Cursor IDE에 추가하는 방법입니다.

## ✅ 완료된 작업

프로젝트 루트에 `.cursor/mcp.json` 설정 파일이 생성되었습니다.

## 📋 설정 내용

### Filesystem MCP

- **용도**: 파일 시스템 접근 및 조작
- **경로**: 프로젝트 루트 디렉토리

### Git MCP

- **용도**: Git 작업 자동화
- **경로**: 프로젝트 Git 저장소

## 🔧 Cursor IDE 설정

### 방법 1: 프로젝트별 설정 (권장)

프로젝트 루트의 `.cursor/mcp.json` 파일이 자동으로 인식됩니다.

### 방법 2: 전역 설정

Cursor IDE 설정에서 MCP 서버를 추가할 수 있습니다:

1. **Cursor 설정 열기**
   - `Cmd + ,` (Mac) 또는 `Ctrl + ,` (Windows/Linux)
   - 또는 `Cursor > Settings`

2. **MCP 설정 찾기**
   - 검색창에 "MCP" 입력
   - "MCP Servers" 또는 "Model Context Protocol" 설정

3. **설정 추가**
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-filesystem",
           "/Users/tintolab/Desktop/arbeiten/jakorea"
         ]
       },
       "git": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-git",
           "/Users/tintolab/Desktop/arbeiten/jakorea"
         ]
       }
     }
   }
   ```

## 🚀 사용 방법

### Filesystem MCP 사용 예시

```
"프로젝트의 package.json 파일을 읽어줘"
"apps/cms/src/main.tsx 파일을 보여줘"
"새로운 컴포넌트 파일을 생성해줘"
```

### Git MCP 사용 예시

```
"현재 변경사항을 확인해줘"
"변경사항을 커밋해줘"
"커밋 메시지를 생성해줘"
```

## ✅ 확인 방법

1. **Cursor 재시작**
   - MCP 서버 설정을 적용하려면 Cursor를 재시작하세요

2. **MCP 서버 상태 확인**
   - Cursor 하단 상태바에서 MCP 서버 연결 상태 확인
   - 또는 설정에서 MCP 서버 목록 확인

3. **테스트**
   - "프로젝트의 README.md 파일을 읽어줘" 같은 요청으로 테스트

## 🔍 문제 해결

### MCP 서버가 작동하지 않는 경우

1. **Node.js 확인**

   ```bash
   node --version  # v18 이상 필요
   npm --version
   ```

2. **npx 확인**

   ```bash
   npx --version
   ```

3. **수동 테스트**

   ```bash
   npx -y @modelcontextprotocol/server-filesystem --help
   npx -y @modelcontextprotocol/server-git --help
   ```

4. **경로 확인**
   - `.cursor/mcp.json`의 경로가 올바른지 확인
   - 절대 경로 사용 권장

### 권한 문제

- Filesystem MCP는 지정된 디렉토리만 접근 가능
- 상위 디렉토리 접근이 필요한 경우 경로 수정

## 📚 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [Cursor MCP 설정 가이드](https://docs.cursor.com/mcp)
- [Filesystem MCP GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [Git MCP GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/git)

---

**마지막 업데이트**: 2025-01-20



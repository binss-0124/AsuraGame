# React 구조 변환 가이드

## 🎯 변경된 프로젝트 구조

기존의 순수 HTML/JS 구조에서 React 기반의 모던 웹 애플리케이션 구조로 전환되었습니다.

### 📁 새로운 폴더 구조

```
프로젝트/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   │   ├── CreateRoomModal.jsx
│   │   │   ├── JoinRoomModal.jsx
│   │   │   ├── CharacterSelectModal.jsx
│   │   │   └── PlayerSlot.jsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── MainMenu.jsx
│   │   │   ├── WaitingRoom.jsx
│   │   │   └── GamePage.jsx
│   │   ├── contexts/          # React Context
│   │   │   └── SocketContext.jsx
│   │   ├── game/              # Three.js 게임 로직
│   │   ├── hooks/             # 커스텀 훅
│   │   └── utils/             # 유틸리티 함수
│   ├── public/                # 정적 리소스 (이미지, 모델 등)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                    # Node.js 백엔드
    ├── server.js
    ├── weaponUtils.js
    └── package.json
```

## 🚀 시작하기

### 1. 서버 실행

```powershell
cd server
npm install
npm start
```

### 2. 클라이언트 실행 (새 터미널)

```powershell
cd client
npm install
npm run dev
```

### 3. 브라우저에서 접속

`http://localhost:5173` 접속

## 📋 주요 변경 사항

### React 컴포넌트로 변환된 UI

| 기존 HTML | React 컴포넌트 |
|-----------|----------------|
| index.html (메인 메뉴) | MainMenu.jsx |
| 방 생성 팝업 | CreateRoomModal.jsx |
| 방 참가 팝업 | JoinRoomModal.jsx |
| 캐릭터 선택 팝업 | CharacterSelectModal.jsx |
| 대기실 | WaitingRoom.jsx |
| 게임 화면 | GamePage.jsx |

### 상태 관리

- **Socket.IO 연결**: `SocketContext`로 전역 관리
- **페이지 전환**: React 상태로 관리 (menu → waiting → game)
- **플레이어 정보**: 컴포넌트 Props로 전달

### 스타일링

- 각 컴포넌트마다 별도의 CSS 파일
- 글로벌 스타일은 `index.css`와 `App.css`에 정의
- CSS 모듈화로 스타일 충돌 방지

## 🔧 개발 도구

- **Vite**: 빠른 HMR (Hot Module Replacement)
- **React DevTools**: 컴포넌트 디버깅
- **ESM 모듈**: 최신 JavaScript 모듈 시스템

## 📦 다음 작업

기존 게임 로직 파일들을 React 구조에 맞게 통합해야 합니다:

1. `public/player.js` → `client/src/game/player.js`
2. `public/weapon.js` → `client/src/game/weapon.js`
3. `public/attackSystem.js` → `client/src/game/attackSystem.js`
4. `public/hp.js` → `client/src/game/hp.js`
5. `public/ui.js` → `client/src/game/ui.js`
6. 기타 게임 로직 파일들

이 파일들을 `client/src/game/` 폴더로 복사하고 ESM import/export 문법으로 변환하세요.

## 🎮 리소스 파일

`public/resources/` 폴더의 모든 3D 모델, 텍스처, 이미지는 `client/public/resources/`로 복사해야 합니다.

```powershell
Copy-Item -Path ".\public\resources" -Destination ".\client\public\" -Recurse
```

## 💡 개발 팁

- 컴포넌트는 기능별로 작게 나누기
- CSS는 컴포넌트와 같은 폴더에 위치
- 전역 상태는 Context 사용
- Socket 이벤트 리스너는 useEffect로 관리
- Three.js 객체는 useRef로 참조 유지

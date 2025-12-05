# React 구조로 재구성된 3D 온라인 멀티플레이어 격투 게임

이것은 Node.js, Socket.IO, React, 그리고 Three.js를 사용하여 제작된 실시간 3D 온라인 멀티플레이어 격투 게임입니다. 플레이어는 방을 만들거나 참가하고, 다양한 캐릭터 중에서 선택하고, 3D 환경에서 다른 플레이어와 전투를 벌일 수 있습니다.

## 주요 기능

*   **실시간 멀티플레이어:** Socket.IO를 사용하여 지연 시간이 짧은 게임 플레이를 구현했습니다.
*   **3D 그래픽:** Three.js를 사용하여 캐릭터, 맵 및 무기를 렌더링하여 몰입감 있는 3D 경험을 제공합니다.
*   **방 시스템:** 플레이어는 공개 또는 비공개 게임 룸을 만들고 참가할 수 있습니다.
*   **캐릭터 선택:** 다양한 캐릭터 중에서 선택할 수 있으며, 3D 미리보기를 통해 선택한 캐릭터를 확인할 수 있습니다.
*   **인게임 UI:** 게임 타이머, 킬 피드, 실시간 스코어보드 등 게임 플레이에 필요한 정보를 제공합니다.
*   **동적 게임 플레이:** 맵에서 무기를 줍고, 다양한 공격을 사용하며, 맵 경계를 벗어나면 피해를 입는 등 다양한 게임 요소를 포함합니다.

## 기술 스택

### 백엔드

*   **[Node.js](https://nodejs.org/)**: 서버 측 로직을 위한 JavaScript 런타임 환경
*   **[Express](https://expressjs.com/)**: 웹 서버 구축을 위한 웹 프레임워크
*   **[Socket.IO](https://socket.io/)**: 실시간 양방향 통신을 위한 라이브러리

### 프론트엔드

*   **[React](https://react.dev/)**: UI 구축을 위한 JavaScript 라이브러리
*   **[Vite](https://vitejs.dev/)**: 빠른 개발 환경을 위한 빌드 도구
*   **[Three.js](https://threejs.org/)**: 3D 그래픽 렌더링을 위한 라이브러리
*   **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)**: React용 Three.js 렌더러
*   **[@react-three/drei](https://github.com/pmndrs/drei)**: React Three Fiber를 위한 유용한 헬퍼
*   **[Socket.IO Client](https://socket.io/docs/v4/client-api/)**: 클라이언트 측 Socket.IO

## 프론트엔드(React) 기술 스택 상세 설명

| 기술 스택 | 왜 사용하는가? | 어디서/어떻게 사용되는가? |
|-----------|----------------|--------------------------|
| **React** | 컴포넌트 기반 UI 설계, 상태 관리, 빠른 화면 갱신 | `src/components/`, `src/pages/`, `src/contexts/` 등에서 UI와 상태 관리, 함수형 컴포넌트, 훅 사용 |
| **Vite** | 빠른 개발 서버, HMR(핫 리로드), 빌드 속도 향상 | `vite.config.js`, 개발 시 `npm run dev`, 빌드시 `dist/` 생성 |
| **Three.js** | 3D 그래픽(캐릭터, 맵, 무기 등) 렌더링 | `public/player.js`, `object.js`, `weapon.js`, `attackSystem.js`, `src/game/GameStage1.js` 등에서 3D 씬/모델/애니메이션/충돌 처리 |
| **Socket.IO Client** | 서버와 실시간 양방향 통신(플레이어 이동, 공격 등) | `src/contexts/SocketContext.jsx`에서 소켓 연결, 각 컴포넌트에서 이벤트 송수신 |
| **@react-three/fiber**<br>(선택적) | React에서 Three.js를 선언적으로 사용, 3D 씬을 컴포넌트처럼 관리 | (사용 시) 3D 오브젝트/카메라/조명 등을 JSX로 선언, React 상태와 연동 |
| **@react-three/drei**<br>(선택적) | 자주 쓰는 3D 기능(카메라 컨트롤 등) 제공 | (사용 시) drei의 헬퍼 컴포넌트로 3D 씬 보조 |

1. React
역할: UI(화면) 전체를 컴포넌트 단위로 구성하고, 상태 변화에 따라 화면을 효율적으로 갱신합니다.
어디서?
components : 캐릭터 선택, 방 생성/참가, 플레이어 슬롯 등 UI를 담당하는 재사용 컴포넌트들
pages : 메인 메뉴, 대기실, 게임 화면 등 페이지 단위 컴포넌트
App.jsx : 전체 라우팅 및 최상위 레이아웃
어떻게?
각 UI 요소를 함수형 컴포넌트로 작성, props와 state로 데이터 전달 및 관리
React의 useState, useEffect, useContext 등 훅을 활용하여 동적 UI 구현
2. Vite
역할: 개발 서버 구동, 번들링, HMR(핫 리로드) 등 빠른 개발 환경 제공
어디서?
vite.config.js : Vite 설정
개발 시 npm run dev로 Vite 개발 서버 실행
어떻게?
소스코드 변경 시 즉시 브라우저에 반영(HMR)
빌드 시 client/dist에 정적 파일 생성
3. Three.js
역할: 3D 그래픽(캐릭터, 맵, 무기 등) 렌더링 및 물리 연산
어디서?
player.js, object.js, weapon.js, attackSystem.js 등
GameStage1.js : 게임의 3D 씬, 카메라, 조명, 오브젝트 관리
어떻게?
Three.js의 Scene, Camera, Renderer, Mesh, Animation 등 객체를 직접 생성/제어
FBX/GLTF 등 3D 모델 로더로 리소스 불러오기
플레이어, NPC, 무기, 맵 오브젝트의 위치/애니메이션/충돌 처리
4. Socket.IO Client
역할: 서버와의 실시간 양방향 통신(플레이어 이동, 공격, 방 입장/퇴장 등)
어디서?
SocketContext.jsx : 소켓 연결 및 전역 상태 관리
각 페이지/컴포넌트에서 소켓 이벤트 송수신
어떻게?
React Context로 소켓 인스턴스를 전역 제공
useContext로 소켓에 접근, 서버와 실시간 데이터 송수신
5. @react-three/fiber, @react-three/drei (선택적)
역할: React에서 Three.js를 더 쉽게 사용할 수 있도록 도와주는 라이브러리
어디서?
만약 사용했다면, 3D 씬을 React 컴포넌트처럼 선언적으로 작성
(현재 코드에서는 직접 Three.js를 사용하는 부분이 더 많음)
어떻게?
3D 오브젝트, 카메라, 조명 등을 JSX로 선언
drei는 카메라 컨트롤, 환경맵 등 자주 쓰는 기능을 제공

## 프로젝트 기술스택 한눈에 보기

### 1. 사용한 기술스택
- **React**
- **Vite**
- **Three.js**
- **Socket.IO Client**
- **@react-three/fiber**
- **@react-three/drei**
- **Express (백엔드)**
- **Node.js (백엔드)**

---

### 2. 각 기술스택의 역할(정의), 이점, 사용 이유

| 기술 스택                | 역할(정의)                                                    | 이점(장점)                                         | 사용한 이유                          |
|-------------------------|--------------------------------------------------------------|----------------------------------------------------|--------------------------------------|
| **React**               | UI를 컴포넌트 단위로 설계, 상태 변화에 따라 화면을 효율적으로 갱신 | UI 재사용, 빠른 상태 반영, 유지보수/확장성 우수      | 복잡한 게임 UI를 효율적으로 관리하기 위해 |
| **Vite**                | 빠른 개발 서버와 빌드 환경 제공                               | 빠른 HMR, 빌드 속도, 개발 경험 개선                  | 개발 생산성 및 속도 향상             |
| **Three.js**            | 웹에서 3D 그래픽(캐릭터, 맵, 무기 등) 렌더링 및 물리 연산       | 강력한 3D 기능, 다양한 모델 지원, 웹GL 추상화         | 몰입감 있는 3D 게임 구현             |
| **Socket.IO Client**    | 서버와 실시간 양방향 통신(플레이어 이동, 공격 등)              | 실시간 데이터 송수신, 멀티플레이어 구현               | 실시간 멀티플레이어 게임을 위해      |
| **@react-three/fiber**  | React에서 Three.js를 선언적으로 사용, 3D 씬을 컴포넌트처럼 관리 | React와 3D의 통합, 선언적 코드, 상태와 3D 연동        | 3D와 React의 결합을 쉽게 하기 위해   |
| **@react-three/drei**   | 자주 쓰는 3D 기능(카메라 컨트롤 등) 제공                      | 반복 코드 감소, 3D 씬 보조, 개발 편의성               | 3D 개발 효율성 및 편의성 증대        |
| **Express (백엔드)**    | Node.js 기반 웹 서버 프레임워크                                | 라우팅, 미들웨어, REST API 등 빠른 서버 구축           | 서버/API/소켓 관리                   |
| **Node.js (백엔드)**    | 서버 측 JavaScript 런타임 환경                                 | 비동기 처리, 다양한 라이브러리, 높은 확장성            | 전체 서버 로직 및 실시간 처리         |

---

### 3. 실제 적용 예시
- **React**: 캐릭터 선택, 방 생성/참가, 실시간 스코어보드 등 UI를 컴포넌트로 분리
- **Vite**: 개발 중 코드 변경 시 즉시 반영, 빠른 빌드 및 배포
- **Three.js**: 3D 캐릭터, 맵, 무기 등 게임의 핵심 그래픽을 웹에서 직접 렌더링
- **Socket.IO Client**: 서버와 실시간 데이터 송수신, 플레이어 동기화
- **@react-three/fiber/drei**: 3D 씬을 React 방식으로 선언적으로 관리, 카메라 컨트롤 등 반복 기능 적용
- **Express/Node.js**: 서버에서 게임 매치메이킹, 소켓 관리, 무기 데이터 제공 등 백엔드 로직 담당

---

#### 면접 참고 포인트
- 각 기술의 도입 이유와 실제 적용 사례를 구체적으로 설명할 수 있음
- React와 Three.js의 결합, Vite의 개발 경험 개선, Socket.IO의 실시간 동기화 등 프로젝트의 구조적 강점 강조 가능
- 기술 선택의 배경(생산성, 유지보수, 성능, 확장성 등)을 논리적으로 설명할 수 있음
- 실제 코드 위치와 역할을 예시로 들어 설명하면 신뢰도 상승

---
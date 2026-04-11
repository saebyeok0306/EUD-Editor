# EUD Editor (StarCraft Data Editor)

Electron 기반으로 구축된 스타크래프트 에디터 프로젝트입니다.  
AI랑 결합한 차세대 EUD 에디터를 목표로 하고 있지만, 취미로 시작한 프로젝트라 언제 중단될지 모릅니다.🔥

![main1](/md/main1.png)
![main2](/md/main2.png)


---

## Special Thanks

이 프로젝트는 **맛있는빙수**님의 [EUD Editor](https://github.com/Buizz/EUDEditor) 프로젝트 소스를 참고하여 제작되었습니다. 소스 코드를 공개해주신 맛있는빙수님께 깊은 감사를 드립니다.

---

## 🛠 Project Setup

### 필수 요구사항 (Prerequisites)
* Node.js (v18+)
* **Rust Toolchain:** GRP WASM 모듈 빌드를 위해 [rustup](https://rustup.rs/) 및 `wasm-pack` 설치가 필요합니다.
```bash
cargo install wasm-pack
```

### Install & Build WASM

패키지 설치 및 Rust 코어 의존성을 WASM 모듈로 빌드합니다.
```bash
$ npm install
$ npm run build:wasm
```

### Development

개발용 Vite + Electron Hot-Reload 환경 시작
```bash
$ npm run dev
```

### Build App Executable

최종 배포용 윈도우/맥/리눅스 애플리케이션 빌드
```bash
# For Windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

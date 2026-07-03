# 🎮 The Voting Game - Edição Casa

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

**[PT]** Um jogo de festa multijogador local (party game) desenhado para Smart TVs e ecrãs grandes. Construído inteiramente com arquitetura Vanilla JavaScript, com foco em alta performance, animações aceleradas por hardware e integração nativa de comandos (Gamepad API).

**[EN]** A local multiplayer party game designed for Smart TVs and large displays. Built entirely with Vanilla JavaScript architecture, focusing on high performance, hardware-accelerated animations, and native controller integration (Gamepad API).

---

## 🏗️ Architecture & Technical Highlights / Arquitetura e Destaques Técnicos

This project was deliberately built without external frameworks (like React or Vue) to demonstrate absolute control over the browser's rendering pipeline and memory footprint—crucial for low-power Smart TV environments.

* **Publisher-Subscriber State Management:** Custom decoupled state logic (`AppState`) prevents DOM layout thrashing and spaghetti code.
* **Hardware-Accelerated CSS Transitions:** UI rendering is offloaded to the GPU using `transform` and `opacity` properties, guaranteeing smooth 60fps card flips.
* **Gamepad API Polling:** Custom edge-detection matrix running via `requestAnimationFrame` allows users to control the UI natively using Xbox/PlayStation Bluetooth controllers.
* **Web Audio API:** Asynchronous preloading of binary PCM audio buffers ensures zero-latency sound effects, bypassing the inherent delays of standard HTML5 `<audio>` tags.
* **Fisher-Yates Shuffle:** Implementation of the mathematically unbiased Fisher-Yates algorithm for $O(n)$ data randomization.

## ✨ Features / Funcionalidades

* **[PT]** **Lobby Dinâmico:** Registo de jogadores guardado localmente via `localStorage`.
* **[EN]** **Dynamic Lobby:** Player registration persisted locally via `localStorage`.
* **[PT]** **Placar em Tempo Real:** Atualização reativa de pontuações sem recarregar a página.
* **[EN]** **Real-time Scoreboard:** Reactive score updates without page reloads.
* **[PT]** **Auditoria de Votos:** Modal interativo para visualizar o histórico de cartões de cada jogador.
* **[EN]** **Vote Auditing:** Interactive modal to view the card history won by each player.
* **[PT]** **Design Responsivo:** Adaptado para proporções 16:9 (Televisões).
* **[EN]** **Responsive Design:** Tailored for 16:9 aspect ratios (Televisions).

## 🚀 How to Run / Como Executar

**[PT]** Devido às políticas de segurança dos browsers modernos (CORS) ao utilizar a API `fetch` para carregar o ficheiro `perguntas.json`, este projeto deve ser corrido num servidor local.
1. Clone o repositório.
2. Abra o projeto no VS Code.
3. Inicie a extensão **Live Server**.

**[EN]** Due to modern browser security policies (CORS) when using the `fetch` API for the `perguntas.json` file, this project must be run on a local server.
1. Clone the repository.
2. Open the project in VS Code.
3. Start the **Live Server** extension.

## 📂 File Structure / Estrutura de Ficheiros

```text
/
├── index.html       # Semantic HTML5 & layout structure
├── styles.css       # Custom properties, animations, and UI states
├── app.js           # Core architecture (State, Audio, Gamepad, DOM)
├── perguntas.json   # JSON data payload (Question deck)
└── README.md        # Project documentation
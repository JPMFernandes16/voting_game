/**
 * The Voting Game - Edição Casa (Baralho Digital)
 * Arquitetura Vanilla JavaScript otimizada para Smart TVs
 */

// ==========================================
// 1. GESTÃO DE ESTADO (Histórico e Memória)
// ==========================================
class AppState {
    constructor() {
        this.gameState = 'LOBBY'; // LOBBY, PLAYING, PAUSED
        this.questions = [];
        this.currentQuestionIndex = -1;
        this.playedIds = this.loadPlayedIds();
    }

    loadPlayedIds() {
        try {
            const stored = localStorage.getItem('tvg_played_ids');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Erro ao aceder ao LocalStorage:", error);
            return [];
        }
    }

    savePlayedId(id) {
        if (!this.playedIds.includes(id)) {
            this.playedIds.push(id);
            try {
                localStorage.setItem('tvg_played_ids', JSON.stringify(this.playedIds));
            } catch (error) {
                console.warn("Limite de armazenamento excedido.");
            }
        }
    }

    clearPlayedIds() {
        this.playedIds = [];
        localStorage.removeItem('tvg_played_ids');
    }
}

// ==========================================
// 2. CONTROLADOR DE INTERFACE (Utilitários)
// ==========================================
class UIController {
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Calcula o tamanho da fonte consoante o comprimento da pergunta
    getTextSizeClass(text) {
        const length = text.length;
        if (length < 50) return 'text-xl';
        if (length < 100) return 'text-lg';
        if (length < 150) return 'text-md';
        return 'text-sm';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Erro ao tentar modo ecrã inteiro: ${err.message}`);
            });
        }
    }
}

// ==========================================
// 3. MOTOR DE ÁUDIO (Com Pitch Shift)
// ==========================================
class AudioManager {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.buffers = {};
        this.isUnlocked = false;
    }

    unlock() {
        if (!this.isUnlocked && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => this.isUnlocked = true);
        }
    }

    async preload(id, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return; 
            const arrayBuffer = await response.arrayBuffer();
            this.buffers[id] = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.warn(`Áudio ${id} não encontrado, ignorando.`);
        }
    }

    play(id) {
        if (this.ctx.state === 'suspended') this.unlock();
        const buffer = this.buffers[id];
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        // Variação orgânica do áudio (Pitch Shift entre 0.9 e 1.1)
        source.playbackRate.value = 0.9 + Math.random() * 0.2;
        
        source.connect(this.ctx.destination);
        source.start(0);
    }
}

// ==========================================
// 4. CONTROLADOR DE COMANDOS (Gamepad API)
// ==========================================
class GamepadManager {
    constructor() {
        this.previousState = {};
        this.onButtonPress = null; 
        this.polling = false;
        
        window.addEventListener("gamepadconnected", () => {
            if (!this.polling) {
                this.polling = true;
                this.poll();
            }
        });

        window.addEventListener("gamepaddisconnected", () => {
            const gamepads = navigator.getGamepads();
            if (!Array.from(gamepads).some(gp => gp !== null)) {
                this.polling = false;
            }
        });
    }

    onPress(callback) {
        this.onButtonPress = callback;
    }

    poll() {
        if (!this.polling) return;
        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;
            
            for (let b = 0; b < gp.buttons.length; b++) {
                const buttonObj = gp.buttons[b];
                const pressed = typeof buttonObj === "object" ? buttonObj.pressed : buttonObj === 1.0;
                const stateKey = `gp_${gp.index}_btn_${b}`;
                const previouslyPressed = this.previousState[stateKey] || false;

                if (pressed && !previouslyPressed && this.onButtonPress) {
                    this.onButtonPress(b, gp.index);
                }
                this.previousState[stateKey] = pressed;
            }
        }
        
        if (this.polling) {
            requestAnimationFrame(() => this.poll());
        }
    }
}

// ==========================================
// 5. LÓGICA CENTRAL DO JOGO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const state = new AppState();
    const ui = new UIController();
    const audio = new AudioManager();
    const gamepad = new GamepadManager();

    const startBtn = document.getElementById('start-btn');
    const resetMemoryBtn = document.getElementById('reset-memory-btn');
    const cardContainer = document.getElementById('card-container');
    const lobbyScreen = document.getElementById('lobby-screen');
    const pauseOverlay = document.getElementById('pause-overlay');

    let isAnimating = false; // Previne múltiplos cliques acidentais

    // 5.1. Gestão do Cursor Inativo
    let cursorTimeout;
    const resetCursorTimer = () => {
        document.body.classList.remove('hide-cursor');
        clearTimeout(cursorTimeout);
        if (state.gameState === 'PLAYING') {
            cursorTimeout = setTimeout(() => document.body.classList.add('hide-cursor'), 3000);
        }
    };
    document.addEventListener('mousemove', resetCursorTimer);

    // 5.2. Carregamento e Filtro de Perguntas
    async function loadQuestions() {
        try {
            const response = await fetch('perguntas.json');
            let data = await response.json();
            
            // Filtra as perguntas que já foram jogadas
            let availableQuestions = data.filter(q => !state.playedIds.includes(q.id));
            
            if (availableQuestions.length === 0) {
                alert("O baralho chegou ao fim! A memória foi limpa para recomeçar a festa.");
                state.clearPlayedIds();
                availableQuestions = [...data];
            }

            // Baralhamento (Fisher-Yates)
            for (let i = availableQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
            }
            
            state.questions = availableQuestions;
        } catch (e) {
            console.error("Erro ao carregar o baralho. O Live Server está ativo?", e);
        }
    }

    await loadQuestions();

    // 5.3. Ações do Lobby
    const unlockInteraction = () => {
        audio.unlock();
        document.body.removeEventListener('click', unlockInteraction);
        document.body.removeEventListener('keydown', unlockInteraction);
    };
    document.body.addEventListener('click', unlockInteraction);
    document.body.addEventListener('keydown', unlockInteraction);

    resetMemoryBtn.addEventListener('click', () => {
        state.clearPlayedIds();
        alert("Histórico apagado. O próximo jogo terá todas as cartas disponíveis!");
        loadQuestions();
    });

    startBtn.addEventListener('click', startGame);

    function startGame() {
        ui.toggleFullscreen();
        state.gameState = 'PLAYING';
        lobbyScreen.style.display = 'none';
        cardContainer.style.display = 'flex';
        resetCursorTimer();
        advanceTurn('next');
    }

    // 5.4. Lógica de Renderização e Animação 3D
    function renderNextCard() {
        const questionData = state.questions[state.currentQuestionIndex];
        
        if (!questionData) {
            cardContainer.innerHTML = '<h2 class="question-text">Fim do Baralho!</h2>';
            return;
        }

        // Grava o ID no histórico para não repetir
        state.savePlayedId(questionData.id);

        const newCard = document.createElement('div');
        newCard.className = 'question-card'; 
        
        const catClass = `cat-${questionData.categoria.toLowerCase().replace(/\s+/g, '-')}`;
        const sizeClass = ui.getTextSizeClass(questionData.pergunta);

        newCard.innerHTML = `
            <span class="badge ${catClass}">${ui.escapeHTML(questionData.categoria)}</span>
            <h1 class="question-text ${sizeClass}">${ui.escapeHTML(questionData.pergunta)}</h1>
        `;
        
        cardContainer.appendChild(newCard);

        void newCard.offsetWidth; // Força layout
        newCard.classList.add('active');
    }

    function advanceTurn(direction = 'next') {
        if (isAnimating) return;
        
        if (direction === 'next' && state.currentQuestionIndex >= state.questions.length - 1) return;
        if (direction === 'prev' && state.currentQuestionIndex <= 0) return;

        isAnimating = true;
        audio.play('swoosh');

        const currentCard = document.querySelector('.question-card.active');
        
        if (direction === 'next') {
            state.currentQuestionIndex++;
        } else {
            state.currentQuestionIndex--;
        }

        if (currentCard) {
            currentCard.classList.remove('active');
            currentCard.classList.add('exit'); // Vira a carta 3D
            
            // 600ms deve coincidir com a var --transition-duration no CSS
            setTimeout(() => {
                currentCard.remove(); 
                renderNextCard();
                isAnimating = false;
            }, 600); 
        } else {
            renderNextCard();
            isAnimating = false;
        }
    }

    function togglePause() {
        if (state.gameState === 'PLAYING') {
            state.gameState = 'PAUSED';
            pauseOverlay.style.display = 'flex';
            document.body.classList.remove('hide-cursor');
        } else if (state.gameState === 'PAUSED') {
            state.gameState = 'PLAYING';
            pauseOverlay.style.display = 'none';
            resetCursorTimer();
        }
    }

    // 5.5. Controlos Globais (Teclado e Comandos)
    document.addEventListener('keydown', (e) => {
        audio.unlock();
        
        if (state.gameState === 'LOBBY' && (e.code === 'Enter' || e.code === 'Space')) {
            startGame();
        } else if (state.gameState === 'PLAYING') {
            if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') advanceTurn('next');
            if (e.code === 'ArrowLeft') advanceTurn('prev');
            if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
        } else if (state.gameState === 'PAUSED') {
            if (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Enter') togglePause();
        }
    });

    gamepad.onPress((buttonIndex) => {
        audio.unlock();
        
        if (state.gameState === 'LOBBY') {
            if (buttonIndex === 9) startGame(); // Start / Options
        } else if (state.gameState === 'PLAYING') {
            if (buttonIndex === 0 || buttonIndex === 5) advanceTurn('next'); // A/Cruz ou R1
            if (buttonIndex === 4 || buttonIndex === 14) advanceTurn('prev'); // L1 ou D-Pad Esquerda
            if (buttonIndex === 9) togglePause(); // Start / Options
        } else if (state.gameState === 'PAUSED') {
            if (buttonIndex === 9 || buttonIndex === 0) togglePause(); // Start ou A/Cruz retoma
        }
    });
});
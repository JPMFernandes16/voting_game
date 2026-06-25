// Seleção dos elementos do HTML que vamos manipular
const textPergunta = document.getElementById('pergunta-texto');
const badgeCategoria = document.getElementById('categoria-badge');
const cardContainer = document.getElementById('card');
const nextBtn = document.getElementById('next-btn');

// Variáveis de estado do jogo
let questionsList = [];
let currentIndex = 0;
let isAnimating = false; // Barreira para evitar que alguém "spampe" o botão e quebre a animação

// Arranca o jogo automaticamente assim que a página carrega
document.addEventListener('DOMContentLoaded', initializeGame);

// Função assíncrona para ir buscar os dados ao perguntas.json
async function initializeGame() {
    try {
        const response = await fetch('perguntas.json');
        
        // Verifica se deu erro (ex: abrir sem o Live Server)
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }
        
        questionsList = await response.json();
        
        // Baralha as perguntas logo no início
        shuffleArray(questionsList);
        
        // Mostra a primeira pergunta
        showQuestion();
    } catch (error) {
        console.error("Erro a carregar o perguntas.json:", error);
        textPergunta.textContent = "Erro a carregar as perguntas. Lembra-te de usar o Live Server!";
        badgeCategoria.textContent = "ERRO";
        badgeCategoria.className = 'badge cat-drama'; // Usa o estilo vermelho de erro
    }
}

// Algoritmo Fisher-Yates: A forma correta de baralhar arrays em JavaScript (sem viciação)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Lógica para trocar a pergunta e fazer as animações
function showQuestion() {
    // Se a animação ainda estiver a correr, ignora o clique
    if (isAnimating) return;
    
    // Se chegámos ao fim do baralho, baralha tudo de novo e recomeça o ciclo
    if (currentIndex >= questionsList.length) {
        shuffleArray(questionsList);
        currentIndex = 0;
    }

    const currentQuestion = questionsList[currentIndex];

    // 1. Inicia o fade out (esconde o cartão)
    isAnimating = true;
    cardContainer.classList.remove('fade-in');
    cardContainer.classList.add('fade-out');

    // 2. Espera 400ms (o tempo da animação no CSS) para trocar o texto enquanto está invisível
    setTimeout(() => {
        textPergunta.textContent = currentQuestion.pergunta;
        badgeCategoria.textContent = currentQuestion.categoria;
        
        // Limpa as classes antigas e aplica a cor certa para a nova categoria
        badgeCategoria.className = 'badge'; 
        if (currentQuestion.categoria === "Caos Familiar") {
            badgeCategoria.classList.add('cat-caos');
        } else if (currentQuestion.categoria === "Humor") {
            badgeCategoria.classList.add('cat-humor');
        } else if (currentQuestion.categoria === "Drama Leve") {
            badgeCategoria.classList.add('cat-drama');
        }

        // 3. Inicia o fade in (mostra o cartão com a pergunta nova)
        cardContainer.classList.remove('fade-out');
        cardContainer.classList.add('fade-in');
        
        // Liberta o bloqueio depois da animação de entrada terminar
        setTimeout(() => {
            isAnimating = false;
        }, 400);

        currentIndex++;
    }, 400); 
}

// ==========================================
// Controlos do Jogo (Event Listeners)
// ==========================================

// Avançar clicando no botão
nextBtn.addEventListener('click', showQuestion);

// Avançar clicando em qualquer lado do fundo (bom para quem usa um rato na TV e falha o botão)
document.body.addEventListener('click', (e) => {
    if (e.target !== nextBtn) {
        showQuestion();
    }
});

// Avançar usando o teclado
document.addEventListener('keydown', (e) => {
    // Barra de Espaço ou Tecla Enter
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault(); // Previne que o browser faça scroll para baixo se usares o espaço
        showQuestion();
    }
});
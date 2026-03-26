const playBtn = document.getElementById("playBtn");
const startScreen = document.querySelector(".start-screen");
const music = document.getElementById("bgMusic");

const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const gameOverScreen = document.querySelector('.game-over');
const scoreElement = document.querySelector('.score');
const restartBtn = document.querySelector('.reiniciar');
const gameBoard = document.querySelector('.game-board');

// sons
const jumpSound = new Audio("assets/musica/Super Mario World - Jump (Sound).mp3");
const deathSound = new Audio("assets/musica/Super Mario World - Death (Player Down) SFX.mp3");
const winSound = new Audio("assets/musica/Super Mario World Music_ Level Complete.mp3");

let pontos = 0;
let jogoAtivo = false;
let velocidade = 1.5;

// ── SISTEMA DE BOLAS DE FOGO ──────────────────────────────────────────
const MAX_BOLAS = 5;
const COOLDOWN_MS = 2000;
let bolasRestantes = MAX_BOLAS;
let cooldownAtivo = false;

// Cria o HUD de bolas de fogo
const fireHUD = document.createElement('div');
fireHUD.classList.add('fire-hud');
document.querySelector('.game-board').appendChild(fireHUD);

function atualizarHUD() {
    fireHUD.innerHTML = '';
    for (let i = 0; i < MAX_BOLAS; i++) {
        const icone = document.createElement('span');
        icone.textContent = '🔥';
        icone.classList.add('fire-icon');
        if (i >= bolasRestantes) icone.classList.add('gasto');
        fireHUD.appendChild(icone);
    }

    if (cooldownAtivo) {
        const aviso = document.createElement('span');
        aviso.textContent = ' ⏳ 2s';
        aviso.classList.add('cooldown-aviso');
        fireHUD.appendChild(aviso);
    }
}

function atirarBola() {
    if (!jogoAtivo || bolasRestantes <= 0 || cooldownAtivo) return;

    bolasRestantes--;
    atualizarHUD();

    // Cria a bola de fogo
    const bola = document.createElement('div');
    bola.classList.add('fireball');
    bola.style.left = (mario.offsetLeft + mario.offsetWidth) + 'px';
    bola.style.bottom = '30px';
    gameBoard.appendChild(bola);

    // Move a bola para a direita
    const moverBola = setInterval(() => {
        const bolaLeft = parseInt(bola.style.left);
        bola.style.left = (bolaLeft + 12) + 'px';

        // Verifica colisão com o cano
        const pipeLeft = pipe.offsetLeft;
        const pipeRight = pipeLeft + pipe.offsetWidth;

        if (bolaLeft >= pipeLeft - 10 && bolaLeft <= pipeRight) {
            // Acertou o cano!
            explodirCano(bola, moverBola);
            return;
        }

        // Saiu da tela
        if (bolaLeft > gameBoard.offsetWidth) {
            bola.remove();
            clearInterval(moverBola);
        }
    }, 20);

    // Quando usar todas as bolas, inicia cooldown
    if (bolasRestantes === 0) {
        iniciarCooldown();
    }
}

function explodirCano(bola, moverBola) {
    clearInterval(moverBola);
    bola.remove();

    // Animação de explosão no cano
    const explosao = document.createElement('div');
    explosao.classList.add('explosao');
    explosao.style.left = pipe.offsetLeft + 'px';
    explosao.style.bottom = '0px';
    gameBoard.appendChild(explosao);

    // Esconde o cano temporariamente
    pipe.style.opacity = '0';
    pipe.style.pointerEvents = 'none';

    // Ponto ganho
    pontos++;
    scoreElement.innerText = pontos;

    setTimeout(() => {
        explosao.remove();
        pipe.style.opacity = '1';
        pipe.style.pointerEvents = '';
    }, 600);

    // Vitória
    if (pontos >= 20) {
        music.pause();
        winSound.play();
        jogoAtivo = false;
        setTimeout(() => {
            alert("VOCÊ VENCEU 🔥");
            location.reload();
        }, 500);
    }
}

function iniciarCooldown() {
    cooldownAtivo = true;
    atualizarHUD();

    setTimeout(() => {
        bolasRestantes = MAX_BOLAS;
        cooldownAtivo = false;
        atualizarHUD();
    }, COOLDOWN_MS);
}

// ── PULO ──────────────────────────────────────────────────────────────
const jump = () => {
    if (!jogoAtivo) return;
    mario.classList.add('jump');
    jumpSound.currentTime = 0;
    jumpSound.play();
    setTimeout(() => mario.classList.remove('jump'), 500);
};

// ── CONTROLES ─────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
    }
    if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        atirarBola();
    }
});

// Toque mobile: lado esquerdo = pulo, lado direito = fogo
document.addEventListener('touchstart', (e) => {
    const toque = e.touches[0];
    if (toque.clientX < window.innerWidth / 2) {
        jump();
    } else {
        atirarBola();
    }
});

// ── INICIAR ───────────────────────────────────────────────────────────
playBtn.addEventListener("click", () => {
    music.play();
    startScreen.style.display = "none";
    jogoAtivo = true;
    atualizarHUD();
});

// ── LOOP PRINCIPAL ────────────────────────────────────────────────────
const loop = setInterval(() => {
    if (!jogoAtivo) return;

    const pipePosition = pipe.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

    // COLISÃO (só se o cano estiver visível)
    if (
        pipePosition <= 120 && pipePosition > 0 &&
        marioPosition < 80 &&
        pipe.style.opacity !== '0'
    ) {
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = "assets/imgs/game-over.png";
        mario.style.width = "75px";
        mario.style.marginLeft = "50px";

        music.pause();
        deathSound.play();
        jogoAtivo = false;
        gameOverScreen.style.visibility = "visible";
        clearInterval(loop);
    }

    // PONTO ao passar o cano (sem bola de fogo)
    if (pipePosition < 0 && !pipe.pontuado) {
        pontos++;
        pipe.pontuado = true;
        scoreElement.innerText = pontos;

        velocidade += 0.05;
        pipe.style.animationDuration = `${velocidade}s`;

        setTimeout(() => { pipe.pontuado = false; }, 1000);

        if (pontos >= 20) {
            music.pause();
            winSound.play();
            jogoAtivo = false;
            setTimeout(() => {
                alert("VOCÊ VENCEU 🔥");
                location.reload();
            }, 500);
        }
    }
}, 10);

// ── REINICIAR ─────────────────────────────────────────────────────────
restartBtn.addEventListener("click", () => location.reload());
const playBtn = document.getElementById("playBtn");
const startScreen = document.querySelector(".start-screen");
const music = document.getElementById("bgMusic");

const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const gameOverScreen = document.querySelector('.game-over');
const scoreElement = document.querySelector('.score');
const restartBtn = document.querySelector('.reiniciar');
const gameBoard = document.querySelector('.game-board');
let tirosFase = 5; 
// sons
const jumpSound = new Audio("assets/musica/Super Mario World - Jump (Sound).mp3");
const deathSound = new Audio("assets/musica/Super Mario World - Death (Player Down) SFX.mp3");
const winSound = new Audio("assets/musica/Super Mario World Music_ Level Complete.mp3");
const bossMusic = new Audio("assets/musica/boss.mp3");
bossMusic.loop = true;  

let pontos = 0;
let jogoAtivo = false;

// ── MOVIMENTO DO CANO VIA JS ──────────────────────────────────────────
let pipeX = window.innerWidth * 1.1;
let velocidade = 10;

function moverCano() {
    if (!jogoAtivo || bossAtivo) {
        requestAnimationFrame(moverCano);
        return;
    }

    pipeX -= velocidade;

    if (pipeX < -pipe.offsetWidth) {
        pipeX = window.innerWidth * 1.1;

        pontos++;
        scoreElement.innerText = pontos;
        velocidade += 0.1;

        if (pontos >= 20) {
            iniciarBossFight();
            return;
        }
    }

    pipe.style.left = pipeX + 'px';
    requestAnimationFrame(moverCano);
}

// ── SISTEMA DE BOLAS DE FOGO ──────────────────────────────────────────
let MAX_BOLAS = 5;
const COOLDOWN_MS = 3000;
let bolasRestantes = MAX_BOLAS;
let cooldownAtivo = false;

const fireHUD = document.createElement('div');
fireHUD.classList.add('fire-hud');
gameBoard.appendChild(fireHUD);

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
    if (!jogoAtivo) return;

    // ── FASE NORMAL (ANTES DO BOSS) ─────────────────────
    if (!bossAtivo) {
        if (tirosFase <= 0) return;
        tirosFase--;
    }

    // ── BOSS ────────────────────────────────────────────
    if (bossAtivo) {
        if (bolasRestantes <= 0 || cooldownAtivo) return;
        bolasRestantes--;
    }

    atualizarHUD();

    const bola = document.createElement('div');
    bola.classList.add('fireball');
    const marioBottom = parseInt(window.getComputedStyle(mario).bottom);

bola.style.left = (mario.offsetLeft + mario.offsetWidth) + 'px';
bola.style.bottom = (marioBottom + mario.offsetHeight / 2) + 'px';
    gameBoard.appendChild(bola);

    const moverBola = setInterval(() => {
        const bolaLeft = parseInt(bola.style.left);
        bola.style.left = (bolaLeft + 12) + 'px';

        // ── COLISÃO COM TIROS DO BOSS ────────────────────
        if (bossAtivo) {
            const fogosDosBoss = document.querySelectorAll('.boss-fireball');

            fogosDosBoss.forEach(fogoBoss => {
                const fogoBossLeft = parseInt(fogoBoss.style.left);
                const fogoBossBottom = parseInt(fogoBoss.style.bottom);
                const bolaBottom = parseInt(bola.style.bottom);

                if (
                    Math.abs(bolaLeft - fogoBossLeft) < 30 &&
                    Math.abs(bolaBottom - fogoBossBottom) < 30
                ) {
                    fogoBoss.remove();
                    bola.remove();
                    clearInterval(moverBola);
                }
            });

            if (!bola.isConnected) return;
        }

        // ── COLISÃO COM CANO (FASE NORMAL) ───────────────
        if (!bossAtivo) {
            const pipeLeft = pipeX;
            const pipeRight = pipeX + pipe.offsetWidth;

            if (bolaLeft >= pipeLeft - 10 && bolaLeft <= pipeRight) {
                explodirCano(bola, moverBola);
                return;
            }
        }

        // ── COLISÃO COM BOSS ─────────────────────────────
        if (bossAtivo && bossEl) {
            const bossLeft = parseInt(bossEl.style.left);
            const bossRight = bossLeft + bossEl.offsetWidth;
            const bossBottom = parseInt(bossEl.style.bottom);
            const bossTop = bossBottom + bossEl.offsetHeight;
            const bolaBottom = parseInt(bola.style.bottom);

            if (
                bolaLeft >= bossLeft - 10 &&
                bolaLeft <= bossRight &&
                bolaBottom >= bossBottom - 10 &&
                bolaBottom <= bossTop
            ) {
                acertarBoss(bola, moverBola);
                return;
            }
        }

        // ── SAIU DA TELA ─────────────────────────────────
        if (bolaLeft > gameBoard.offsetWidth) {
            bola.remove();
            clearInterval(moverBola);
        }
    }, 20);

    // ── COOLDOWN APENAS NO BOSS ─────────────────────────
    if (bossAtivo && bolasRestantes === 0) {
        iniciarCooldown();
    }
}   

function explodirCano(bola, moverBola) {
    clearInterval(moverBola);
    bola.remove();

    const explosao = document.createElement('div');
    explosao.classList.add('explosao');
    explosao.style.left = pipeX + 'px';
    explosao.style.bottom = '0px';
    gameBoard.appendChild(explosao);

    pipe.style.opacity = '0';
    pipe.style.pointerEvents = 'none';

    pipeX = window.innerWidth * 1.1;
    pipe.style.left = pipeX + 'px';

    pontos++;
    scoreElement.innerText = pontos;

    setTimeout(() => {
        explosao.remove();
        pipe.style.opacity = '1';
        pipe.style.pointerEvents = '';
    }, 600);

    if (pontos >= 20) {
        iniciarBossFight();
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

// ── BOSS FIGHT ────────────────────────────────────────────────────────
let bossAtivo = false;
let bossHP = 5;
let bossEl = null;
let bossHUDEl = null;
let bossY = 200;
let bossDir = 1;
let bossAnimFrame = null;
let bossFireInterval = null;

function iniciarBossFight() {
    bossAtivo = true;
    bolasRestantes = 5;
cooldownAtivo = false;
atualizarHUD();
    music.pause();
bossMusic.currentTime = 0;
bossMusic.play();
    // Esconde o cano
    pipe.style.opacity = '0';
    pipe.style.pointerEvents = 'none';

    music.pause();

    // Cria o boss
    bossEl = document.createElement('div');
    bossEl.classList.add('boss');
    bossEl.innerHTML = `<img src="assets/imgs/boss.png" class="boss-img">`;
    bossEl.style.left = (gameBoard.offsetWidth - 120) + 'px';
    bossEl.style.bottom = bossY + 'px';
    gameBoard.appendChild(bossEl);

    // HUD de HP do boss
    bossHUDEl = document.createElement('div');
    bossHUDEl.classList.add('boss-hud');
    gameBoard.appendChild(bossHUDEl);
    atualizarBossHUD();

    // Aviso na tela
    const aviso = document.createElement('div');
    aviso.classList.add('boss-aviso');
    aviso.textContent = '⚠️ BOSS FIGHT!';
    gameBoard.appendChild(aviso);
    setTimeout(() => aviso.remove(), 2000);

    moverBoss();
    bossFireInterval = setInterval(bossAtirar, 1800);
}

function atualizarBossHUD() {
    if (!bossHUDEl) return;
    bossHUDEl.innerHTML = '';

    const label = document.createElement('span');
    label.textContent = 'BOSS: ';
    label.style.color = '#fff';
    label.style.fontWeight = 'bold';
    bossHUDEl.appendChild(label);

    for (let i = 0; i < 5; i++) {
        const coracao = document.createElement('span');
        coracao.textContent = i < bossHP ? '❤️' : '🖤';
        bossHUDEl.appendChild(coracao);
    }
}

function moverBoss() {
    if (!bossAtivo || !bossEl) return;

    bossY += bossDir * 2;

    // ALTURA MÁXIMA
    const maxAltura = 350;

    // CHÃO (0)
    const minAltura = 0;

    if (bossY >= maxAltura) bossDir = -1;
    if (bossY <= minAltura) bossDir = 1;

    bossEl.style.bottom = bossY + 'px';
    bossAnimFrame = requestAnimationFrame(moverBoss);
}

function bossAtirar() {
    if (!bossAtivo || !bossEl) return;

    const fogoBoss = document.createElement('div');
    fogoBoss.classList.add('boss-fireball');
    fogoBoss.style.left = (parseInt(bossEl.style.left) - 20) + 'px';
    fogoBoss.style.bottom = (bossY + bossEl.offsetHeight / 2 - 10) + 'px';
    gameBoard.appendChild(fogoBoss);

    const moverFogo = setInterval(() => {
        if (!fogoBoss.isConnected) {
            clearInterval(moverFogo);
            return;
        }

        const fogoLeft = parseInt(fogoBoss.style.left);
        fogoBoss.style.left = (fogoLeft - 8) + 'px';

        // Colisão com mario
        const marioLeft = mario.offsetLeft;
        const marioRight = marioLeft + mario.offsetWidth - 20;
        const marioBottom = +window.getComputedStyle(mario).bottom.replace('px', '');
        const marioTop = marioBottom + mario.offsetHeight;
        const fogoBottom = parseInt(fogoBoss.style.bottom);

        if (
            fogoLeft <= marioRight &&
            fogoLeft >= marioLeft &&
            fogoBottom >= marioBottom &&
            fogoBottom <= marioTop
        ) {
            fogoBoss.remove();
            clearInterval(moverFogo);
            gameOver();
            return;
        }

        if (fogoLeft < -30) {
            fogoBoss.remove();
            clearInterval(moverFogo);
        }
    }, 20);
}

function acertarBoss(bola, moverBola) {
    clearInterval(moverBola);
    bola.remove();

    bossEl.classList.add('boss-hit');
    setTimeout(() => bossEl && bossEl.classList.remove('boss-hit'), 300);

    bossHP--;
    atualizarBossHUD();

    if (bossHP <= 0) {
        vitoria();
    }
}

function vitoria() {
    bossAtivo = false;
    bossMusic.pause();
    clearInterval(bossFireInterval);
    cancelAnimationFrame(bossAnimFrame);

    document.querySelectorAll('.boss-fireball').forEach(f => f.remove());

    const explosao = document.createElement('div');
    explosao.classList.add('explosao');
    explosao.style.left = bossEl.style.left;
    explosao.style.bottom = bossEl.style.bottom;
    gameBoard.appendChild(explosao);

    bossEl.remove();
    bossEl = null;

    jogoAtivo = false;
    winSound.play();

    setTimeout(() => {
        explosao.remove();
        alert("VOCÊ VENCEU! 🏆🔥");
        location.reload();
    }, 800);
}

function gameOver() {
    if (!jogoAtivo && !bossAtivo) return;
    jogoAtivo = false;
    bossAtivo = false;


    clearInterval(bossFireInterval);
    cancelAnimationFrame(bossAnimFrame);

    mario.style.animation = 'none';
    mario.src = "assets/imgs/game-over.png";
    mario.style.width = "75px";
    mario.style.marginLeft = "50px";

    music.pause();
    bossMusic.pause();
    deathSound.play();
    gameOverScreen.style.visibility = "visible";
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
    moverCano();
});

// ── LOOP DE COLISÃO (fase normal) ─────────────────────────────────────
const loop = setInterval(() => {
    if (!jogoAtivo || bossAtivo) return;

    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

    if (
        pipeX <= mario.offsetLeft + mario.offsetWidth - 20 &&
        pipeX + pipe.offsetWidth >= mario.offsetLeft + 20 &&
        marioPosition < 80 &&
        pipe.style.opacity !== '0'
    ) {
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        gameOver();
        clearInterval(loop);
    }
}, 10);

// ── REINICIAR ─────────────────────────────────────────────────────────
restartBtn.addEventListener("click", () => location.reload());
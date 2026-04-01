const playBtn = document.getElementById("playBtn");
const startScreen = document.querySelector(".start-screen");
const music = document.getElementById("bgMusic");

const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const gameOverScreen = document.querySelector('.game-over');
const scoreElement = document.querySelector('.score');
const restartBtn = document.querySelector('.reiniciar');
const gameBoard = document.querySelector('.game-board');
let tirosFase = 100 ; 
// sons
const jumpSound = new Audio("assets/musica/Super Mario World - Jump (Sound).mp3");
const deathSound = new Audio("assets/musica/Super Mario World - Death (Player Down) SFX.mp3");
const winSound = new Audio("assets/musica/Super Mario World Music_ Level Complete.mp3");
const bossMusic = new Audio("assets/musica/boss.mp3");
bossMusic.loop = true;
let moedasColetadas = 0;
const coinCountEl = document.getElementById('coinCount');  

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

    if (!congelado) pipeX -= velocidade;

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

    if (!congelado) bossY += bossDir * 2;

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
    if (!bossAtivo || !bossEl || congelado) return;

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
           if (invencivel) {
                // ignora
            } else if (marioGrande) {
                levarHitComEscudo();
            } else {
                gameOver();
            }
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
         const r = calcularNota(moedasColetadas);

         alert(`VOCÊ VENCEU! 🏆🔥\n\nMoedas coletadas: ${moedasColetadas}\nNota: ${r.nota} ${r.emoji}\n${r.msg}`);
        location.reload();
    }, 800);
}

function gameOver() {
   clearTimeout(invencivelTimeout);
    clearTimeout(congeladoTimeout);
    clearTimeout(itemEspecialInterval);
    itemIntervals.forEach(clearInterval);
    itemIntervals = [];
    invencivel = false;
    congelado = false;
    temBomba = false;
    bombaHUD.style.display = 'none';
    mario.classList.remove('mario-invencivel');
    pipe.classList.remove('congelado');
    document.querySelectorAll('.item-estrela, .item-relogio, .item-bomba, .item-luigi, .luigi-assistente').forEach(e => e.remove());

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
        if (e.code === 'KeyB' || e.key === 'b' || e.key === 'B') {
        lancarBomba();
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
    mario.src = spriteSelecionado; 
    music.play();
    startScreen.style.display = "none";
    jogoAtivo = true;
    atualizarHUD();
    moverCano();
    iniciarSpawnMoedas();
    iniciarSpawnItens();
    iniciarSpawnCogumelo();
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

       if (invencivel) {
            // invencível, ignora o hit — empurra o cano
            pipeX = window.innerWidth * 1.1;
            pipe.style.left = pipeX + 'px';
        } else if (marioGrande) {
            levarHitComEscudo();
        } else {
            gameOver();
            clearInterval(loop);
        }
    }
}, 10);
function criarMoeda() {
    if (!jogoAtivo) return;

    const moeda = document.createElement('img');
    moeda.src = 'assets/imgs/moeda.png';
    moeda.classList.add('coin');

    // altura aleatória entre 50px e 400px do chão
const alturaAleatoria = Math.floor(Math.random() * 150) + 50;
    moeda.style.bottom = alturaAleatoria + 'px';
    moeda.style.left = (window.innerWidth + 50) + 'px';

    gameBoard.appendChild(moeda);

    // Move a moeda da direita para a esquerda
    let moedaX = window.innerWidth + 50;
    const velMoeda = velocidade * 0.9;

    const moverMoeda = setInterval(() => {
        if (!jogoAtivo) {
            moeda.remove();
            clearInterval(moverMoeda);
            return;
        }

        moedaX -= velMoeda;
        moeda.style.left = moedaX + 'px';

        // Verifica colisão com o Mario
        const marioLeft  = mario.offsetLeft;
        const marioRight = marioLeft + mario.offsetWidth - 20;
        const marioBot   = +window.getComputedStyle(mario).bottom.replace('px', '');
        const marioTop   = marioBot + mario.offsetHeight;
        const moedaBot   = +moeda.style.bottom.replace('px', '');
        const moedaTop   = moedaBot + moeda.offsetHeight;

        if (
            moedaX + moeda.offsetWidth >= marioLeft &&
            moedaX <= marioRight &&
            moedaTop  >= marioBot &&
            moedaBot  <= marioTop
        ) {
            coletarMoeda(moeda, moverMoeda, moedaX, moedaBot);
        }

        // Saiu da tela sem ser coletada
        if (moedaX < -50) {
            moeda.remove();
            clearInterval(moverMoeda);
        }
    }, 16);
}

function coletarMoeda(moeda, interval, x, y) {
    clearInterval(interval);
    moeda.classList.add('coletada');

    // Popup "+1"
    const popup = document.createElement('div');
    popup.classList.add('coin-popup');
    popup.textContent = '+1 🪙';
    popup.style.left = x + 'px';
    popup.style.bottom = (y + 40) + 'px';
    gameBoard.appendChild(popup);

    moedasColetadas++;
    coinCountEl.textContent = moedasColetadas;

    setTimeout(() => { moeda.remove(); popup.remove(); }, 800);
}

function calcularNota(moedas) {
    if (moedas >= 20) return { nota: 'SS',  emoji: '🏆', msg: 'Selvagem e sexy' };
    if (moedas >= 15) return { nota: 'S', emoji: '⭐', msg: 'Selvagem' };
    if (moedas >= 10) return { nota: 'A',  emoji: '😎', msg: 'Apocalipse de moedas' };
    if (moedas >= 6)  return { nota: 'B',  emoji: '🙂', msg: 'Badass' };
    if (moedas >= 3)  return { nota: 'C',  emoji: '😐', msg: 'caramba boa' };
    return              { nota: 'D',  emoji: '💀', msg: 'Desanima ein' };
}

// Spawn de moedas a cada 3–6 segundos
let moedaInterval = null;

function iniciarSpawnMoedas() {
    function agendar() {
        if (!jogoAtivo) return;
        const delay = Math.random() * 3000 + 3000; // 3–6s
        moedaInterval = setTimeout(() => {
            criarMoeda();
            agendar();
        }, delay);
    }
    agendar();
}
// ── REINICIAR ─────────────────────────────────────────────────────────
restartBtn.addEventListener("click", () => location.reload());

// ── SISTEMA DE COGUMELO (POWER-UP) ───────────────────────────────────
let marioGrande = false;
let mushroomInterval = null;

// HUD do escudo
const shieldHUD = document.createElement('div');
shieldHUD.classList.add('shield-hud');
shieldHUD.textContent = '🍄';
gameBoard.appendChild(shieldHUD);

function criarCogumelo() {
    if (!jogoAtivo || marioGrande) return; // não spawna se já tiver power-up

    const cogumelo = document.createElement('img');
    cogumelo.src = 'assets/imgs/cogumelo.png'; // ← nome do seu sprite aqui
    cogumelo.classList.add('mushroom');

    const altura = Math.floor(Math.random() * 150) + 50;

    cogumelo.style.bottom = altura + 'px';
    cogumelo.style.left = (window.innerWidth + 50) + 'px';
    gameBoard.appendChild(cogumelo);

    let cogumeloX = window.innerWidth + 50;
    const vel = velocidade * 0.85;

    const mover = setInterval(() => {
        if (!jogoAtivo) { cogumelo.remove(); clearInterval(mover); return; }

        cogumeloX -= vel;
        cogumelo.style.left = cogumeloX + 'px';

        // Colisão com Mario
        const mL = mario.offsetLeft;
        const mR = mL + mario.offsetWidth - 20;
        const mB = +window.getComputedStyle(mario).bottom.replace('px', '');
        const mT = mB + mario.offsetHeight;
        const cB = +cogumelo.style.bottom.replace('px', '');
        const cT = cB + cogumelo.offsetHeight;

        if (
            cogumeloX + cogumelo.offsetWidth >= mL &&
            cogumeloX <= mR &&
            cT >= mB && cB <= mT
        ) {
            clearInterval(mover);
            cogumelo.remove();
            ativarCogumelo(cogumeloX, cB);
        }

        if (cogumeloX < -50) { cogumelo.remove(); clearInterval(mover); }
    }, 16);
}

function ativarCogumelo(x, y) {
    marioGrande = true;
    mario.classList.add('mario-grande');
    shieldHUD.style.display = 'block';

    // Popup
    const popup = document.createElement('div');
    popup.classList.add('mushroom-popup');
    popup.textContent = '🍄 POWER UP!';
    popup.style.left = x + 'px';
    popup.style.bottom = (y + 40) + 'px';
    gameBoard.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
}

function levarHitComEscudo() {
    marioGrande = false;
    mario.classList.remove('mario-grande');
    mario.classList.remove('jump'); // cancela o pulo imediatamente
    shieldHUD.style.display = 'none';

    // Força o Mario de volta ao chão
    mario.style.animation = 'none';
    mario.style.bottom = '0px';

    // Pequeno delay para o reflow acontecer antes de piscar
    void mario.offsetWidth;
    mario.classList.add('mario-hit');

    setTimeout(() => {
        mario.classList.remove('mario-hit');
        mario.style.animation = ''; // libera a animação para pulos futuros
        mario.style.bottom = '';    // devolve o controle do bottom ao CSS
    }, 500);

    pipeX = window.innerWidth * 1.1;
    pipe.style.left = pipeX + 'px';
}
// Spawn a cada 8–14 segundos
function iniciarSpawnCogumelo() {
    function agendar() {
        if (!jogoAtivo) return;
        const delay = Math.random() * 6000 + 8000; // 8–14s
        mushroomInterval = setTimeout(() => {
            criarCogumelo();
            agendar();
        }, delay);
    }
    agendar();
}
let spriteSelecionado = 'assets/imgs/mario.gif';

document.querySelectorAll('.char-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.char-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        spriteSelecionado = 'assets/imgs/' + opt.dataset.sprite;

        // Preview na tela — troca o sprite do Mario antes de começar
        mario.src = spriteSelecionado;
    });
});
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
        mostrarTelaVitoria();
    }, 800);
}

function mostrarTelaVitoria() {
    const r = calcularNota(moedasColetadas);
    const tela = document.querySelector('.tela-vitoria');

    // preenche os dados
    tela.querySelector('.vitoria-sprite').src = spriteSelecionado;
    tela.querySelector('.vitoria-nota').textContent = r.nota;
    tela.querySelector('.vitoria-nota-emoji').textContent = r.emoji;
    tela.querySelector('.vitoria-msg').textContent = r.msg;
    document.getElementById('stat-moedas').textContent = moedasColetadas;
    document.getElementById('stat-pontos').textContent = pontos;

    tela.style.display = 'flex';
    iniciarConfetes();

    tela.querySelector('.vitoria-restart').addEventListener('click', () => location.reload());
}

function iniciarConfetes() {
    const canvas = document.getElementById('confeti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cores = ['#FFD700', '#ff4444', '#44ff88', '#44aaff', '#ff44ff', '#ffffff'];
    const particulas = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        cor: cores[Math.floor(Math.random() * cores.length)],
        vel: Math.random() * 3 + 2,
        angulo: Math.random() * 360,
        giro: Math.random() * 4 - 2,
    }));

    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            p.y += p.vel;
            p.angulo += p.giro;
            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angulo * Math.PI / 180);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        requestAnimationFrame(animar);
    }
    animar();
}
// ── SISTEMA DE ITENS ESPECIAIS ────────────────────────────────────────

// Estado dos itens
let invencivel = false;
let invencivelTimeout = null;
let congelado = false;
let congeladoTimeout = null;
let temBomba = false;
let itemIntervals = [];

// HUD da bomba
const bombaHUD = document.createElement('div');
bombaHUD.classList.add('bomba-hud');
bombaHUD.innerHTML = `<img src="assets/imgs/bomba.png"> Pressione B`;
gameBoard.appendChild(bombaHUD);

// ── FUNÇÕES UTILITÁRIAS ───────────────────────────────────────────────

function mostrarStatusPopup(texto, x, y) {
    const popup = document.createElement('div');
    popup.classList.add('status-popup');
    popup.textContent = texto;
    popup.style.left = (x || 200) + 'px';
    popup.style.bottom = (y || 300) + 'px';
    gameBoard.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function verificarColisaoItem(itemEl, itemX) {
    const mL = mario.offsetLeft;
    const mR = mL + mario.offsetWidth - 20;
    const mB = +window.getComputedStyle(mario).bottom.replace('px', '');
    const mT = mB + mario.offsetHeight;
    const iB = +itemEl.style.bottom.replace('px', '');
    const iT = iB + itemEl.offsetHeight;

    return (
        itemX + itemEl.offsetWidth >= mL &&
        itemX <= mR &&
        iT >= mB &&
        iB <= mT
    );
}

function criarItemGenerico(nomeArquivo, classe) {
    if (!jogoAtivo) return null;

    const item = document.createElement('img');
    item.src = `assets/imgs/${nomeArquivo}`;
    item.classList.add(classe);

    const altura = Math.floor(Math.random() * 150) + 50;
    item.style.bottom = altura + 'px';
    item.style.left = (window.innerWidth + 50) + 'px';
    gameBoard.appendChild(item);

    return item;
}

function moverItem(item, onColisao) {
    let itemX = window.innerWidth + 50;
    const vel = velocidade * 0.85;

    const interval = setInterval(() => {
        if (!jogoAtivo || !item.isConnected) {
            item.remove();
            clearInterval(interval);
            return;
        }

        itemX -= vel;
        item.style.left = itemX + 'px';

        if (verificarColisaoItem(item, itemX)) {
            clearInterval(interval);
            item.remove();
            onColisao(itemX, +item.style.bottom.replace('px', ''));
        }

        if (itemX < -50) {
            item.remove();
            clearInterval(interval);
        }
    }, 16);

    itemIntervals.push(interval);
}

// ── ESTRELA DE INVENCIBILIDADE ────────────────────────────────────────

function criarEstrela() {
    if (!jogoAtivo || invencivel) return;
    const item = criarItemGenerico('estrela.png', 'item-estrela');
    if (!item) return;

    moverItem(item, (x, y) => {
        ativarInvencibilidade(x, y);
    });
}

function ativarInvencibilidade(x, y) {
    invencivel = true;
    mario.classList.add('mario-invencivel');
    mostrarStatusPopup('⭐ INVENCÍVEL!', x, y + 40);

    clearTimeout(invencivelTimeout);
    invencivelTimeout = setTimeout(() => {
        invencivel = false;
        mario.classList.remove('mario-invencivel');
    }, 5000);
}

// ── RELÓGIO (CONGELA TUDO) ────────────────────────────────────────────

function criarRelogio() {
    if (!jogoAtivo || congelado) return;
    const item = criarItemGenerico('relogio.png', 'item-relogio');
    if (!item) return;

    moverItem(item, (x, y) => {
        ativarCongelamento(x, y);
    });
}

function ativarCongelamento(x, y) {
    congelado = true;
    mostrarStatusPopup('🕐 TEMPO PARADO!', x, y + 40);

    // Efeito visual no cano e boss
    pipe.classList.add('congelado');
    if (bossEl) bossEl.classList.add('congelado');

    clearTimeout(congeladoTimeout);
    congeladoTimeout = setTimeout(() => {
        congelado = false;
        pipe.classList.remove('congelado');
        if (bossEl) bossEl.classList.remove('congelado');
    }, 3000);
}

// ── BOMBA ─────────────────────────────────────────────────────────────

function criarBomba() {
    if (!jogoAtivo || temBomba) return;
    const item = criarItemGenerico('bomba.png', 'item-bomba');
    if (!item) return;

    moverItem(item, (x, y) => {
        temBomba = true;
        bombaHUD.style.display = 'flex';
        mostrarStatusPopup('💣 BOMBA! Pressione B', x, y + 40);
    });
}

function lancarBomba() {
    if (!temBomba || !jogoAtivo) return;
    temBomba = false;
    bombaHUD.style.display = 'none';

    const explosao = document.createElement('div');
    explosao.classList.add('explosao-bomba');

    if (bossAtivo && bossEl) {
        // Explode no boss
        explosao.style.left = bossEl.style.left;
        explosao.style.bottom = bossEl.style.bottom;
        gameBoard.appendChild(explosao);

        bossHP = Math.max(0, bossHP - 2);
        atualizarBossHUD();
        bossEl.classList.add('boss-hit');
        setTimeout(() => bossEl && bossEl.classList.remove('boss-hit'), 300);

        if (bossHP <= 0) vitoria();

    } else {
        // Explode no cano
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
            pipe.style.opacity = '1';
            pipe.style.pointerEvents = '';
        }, 600);
    }

    setTimeout(() => explosao.remove(), 700);
}

// ── LUIGI ASSISTENTE ──────────────────────────────────────────────────

function criarItemLuigi() {
    if (!jogoAtivo) return;
    const item = criarItemGenerico('luigi-item.png', 'item-luigi');
    if (!item) return;

    moverItem(item, (x, y) => {
        ativarLuigi();
    });
}

function ativarLuigi() {
    mostrarStatusPopup('👤 LUIGI CHEGOU!', 200, 300);

    // Luigi entra correndo da esquerda
    const luigi = document.createElement('img');
    luigi.src = 'assets/imgs/luigi-item.png';
    luigi.classList.add('luigi-assistente');
    luigi.style.left = '-100px';
    gameBoard.appendChild(luigi);

    let luigiX = -100;
    const correr = setInterval(() => {
        luigiX += 8;
        luigi.style.left = luigiX + 'px';

        if (bossAtivo && bossEl) {
            const bossLeft = parseInt(bossEl.style.left);
            if (luigiX >= bossLeft - 60) {
                // Acerta o boss
                clearInterval(correr);
                bossHP = Math.max(0, bossHP - 1);
                atualizarBossHUD();
                bossEl.classList.add('boss-hit');
                setTimeout(() => bossEl && bossEl.classList.remove('boss-hit'), 300);
                mostrarStatusPopup('💚 -1 HP do Boss!', luigiX, 200);

                // Luigi sai correndo
                const sair = setInterval(() => {
                    luigiX += 10;
                    luigi.style.left = luigiX + 'px';
                    if (luigiX > window.innerWidth) {
                        luigi.remove();
                        clearInterval(sair);
                    }
                }, 16);

                if (bossHP <= 0) vitoria();
            }
        } else {
            // Destrói o cano
            if (luigiX >= pipeX - 40) {
                clearInterval(correr);

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

                mostrarStatusPopup('💚 Cano destruído!', luigiX, 200);

                // Luigi sai correndo
                const sair = setInterval(() => {
                    luigiX += 10;
                    luigi.style.left = luigiX + 'px';
                    if (luigiX > window.innerWidth) {
                        luigi.remove();
                        clearInterval(sair);
                    }
                }, 16);
            }
        }

        if (luigiX > window.innerWidth) {
            luigi.remove();
            clearInterval(correr);
        }
    }, 16);
}

// ── COLISÃO COM INVENCIBILIDADE ───────────────────────────────────────
// Modifica o loop de colisão — envolve o hit do cano com verificação
// (já feito abaixo no loop principal)

// ── SPAWN DOS ITENS ───────────────────────────────────────────────────
let itemEspecialInterval = null;

function iniciarSpawnItens() {
    const itens = [
        { fn: criarEstrela,    chance: 0.15 }, // rara
        { fn: criarRelogio,    chance: 0.25 },
        { fn: criarBomba,      chance: 0.25 },
        { fn: criarItemLuigi,  chance: 0.20 },
    ];

    function agendar() {
        if (!jogoAtivo) return;
        const delay = Math.random() * 8000 + 10000; // 10–18s
        itemEspecialInterval = setTimeout(() => {
            const sorteio = Math.random();
            let acumulado = 0;
            for (const item of itens) {
                acumulado += item.chance;
                if (sorteio <= acumulado) {
                    item.fn();
                    break;
                }
            }
            agendar();
        }, delay);
    }
    agendar();
}
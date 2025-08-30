export function createExitOverlay() { //carregando o exit pra js p usar ele em todas as telas

    if (document.querySelector('.exit-overlay')) return;
    
    if (window.location.pathname.endsWith('index.html')) return;

    const exitOverlay = document.createElement('div');
    exitOverlay.className = 'exit-overlay';
    
    exitOverlay.innerHTML = `
        <div class="bgs-exit">
            <div class="bg-fundo"></div>
            <div class="bg-frente"></div>
            <div class="bg-pixel"></div>
        </div>

        <div class="q1"></div>
        <div class="q2"></div>

        <div class="faixa">
            <span class="faixa-texto">EXIT</span>
            <div class="danger"></div>
        </div>

        <div class="exit-options">
            <button class="exit-btn exit-btn-yes" id="exit-yes"></button>
            <button class="exit-btn exit-btn-no" id="exit-no"></button>
        </div>
                    
        <div class="emojis">
            <div class="nice-emoji"></div>
            <div class="sad-emoji"></div>
        </div>

        <div class="txt-exit">
            <p>ARE YOU SURE YOU WANT TO LEAVE THIS WONDERFULLY INCREDIBLE EXPERIENCE AND GO TO MAIN MENU</p>
        </div>
    `;

    document.body.appendChild(exitOverlay);

    loadExitStyles();
    
    setupExitOverlayEvents();
}

function loadExitStyles() {
    if (document.getElementById('exit-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'exit-styles';
    link.rel = 'stylesheet';
    link.href = '../styles/exit.css';
    document.head.appendChild(link);
}

function setupExitOverlayEvents() {
    const exitOverlay = document.querySelector('.exit-overlay');
    const exitYesBtn = document.getElementById('exit-yes');
    const exitNoBtn = document.getElementById('exit-no');

    const toggleOverlay = (show) => {
        if (!exitOverlay) return;
        
        if (show) {
            exitOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            exitOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            const isActive = document.querySelector('.exit-overlay.active');
            toggleOverlay(!isActive);
        }
    });
    
    if (exitYesBtn) {
        exitYesBtn.addEventListener('click', () => {
            if (window.location.pathname.endsWith('index.html')) { //p contornar a restrição
                window.close();
            }
            window.location.href = '/index.html';  
          
        });
    }

    if (exitNoBtn) {
        exitNoBtn.addEventListener('click', () => toggleOverlay(false));
    }
}
document.addEventListener('DOMContentLoaded', createExitOverlay);
export function createVictoryOverlay() {
    // Verificar se já existe uma overlay de vitória
    if (document.querySelector('.victoryOverlay')) return;
    
    const victoryOverlay = document.createElement('div');
    victoryOverlay.className = 'victory';
    
    victoryOverlay.innerHTML = `
        <div class="bgs-victory">
            <div class="bg-default"></div>
            <div class="bg-golden"></div>
        </div>
        <div class="bg-pixel"></div>
        <div class="bgs-elements">
            <div class="naipes">
                <div class="copasGolden"></div>
                <div class="pausGolden"></div>
                <div class="ourosGolden"></div>
                <div class="espadasGolden"></div>
            </div>
            <div class="logo-opaca"></div>
            <div class="triangulosVermelhos">
                <div class="triangulo-direita"></div>
                <div class="triangulo-esquerda"></div>
            </div>
        </div>
        
        <div class="faixa">
            <div class="winTeam"></div>
        </div>

        <div class="elements">
            <div class="coroa"></div>
            <div class="flying-text"></div>
            <div class="estrelas">
                <div class="estrela-esquerda"></div>
                <div class="estrela-direita"></div>
            </div>
            <div class="brilho"></div>
            <div class="restart-btn"></div>
            <div class="figures">
                <div class="coracao"></div>
                <div class="diamante"></div>
            </div>
        </div>
    `;

    document.body.appendChild(victoryOverlay);

    loadVictoryStyles();
    
    setupVictoryOverlayEvents();
}

function loadVictoryStyles() {
    // Verificar se os estilos já foram carregados
    if (document.getElementById('victory-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'victory-styles';
    link.rel = 'stylesheet';
    link.href = '../styles/victory.css';
    document.head.appendChild(link);
}

function setupVictoryOverlayEvents() {
    const victoryOverlay = document.querySelector('.victory');
    const restartBtn = victoryOverlay.querySelector('.restart-btn');

    
    // Função para mostrar/ocultar a overlay
    const toggleOverlay = (show) => {
        if (!victoryOverlay) return;
        
        if (show) {
            victoryOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            restartBtn.style.pointerEvents = 'auto';
        } else {
            victoryOverlay.classList.remove('active');
            document.body.style.overflow = '';
            restartBtn.style.pointerEvents = 'auto';
        }
    };

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            // Redirecionar para start.html
            window.location.href = 'start.html';
        });
    }

}

// Carregar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', createVictoryOverlay);
window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const blocks = document.querySelectorAll('.loading-bar-blocks .loading-block');
    let current = 0;
    const total = blocks.length;
    const interval = 45; // ms por bloco

    // Inicialmente, todos os blocos ficam azuis e transparentes
    blocks.forEach(b => {
        b.classList.remove('loading-block-pink');
        b.classList.add('loading-block-blue');
        b.style.opacity = '0.25';
    });

    function fillNextBlock() {
        if (current < total) {
            blocks[current].classList.remove('loading-block-blue');
            blocks[current].classList.add('loading-block-pink');
            blocks[current].style.opacity = '1';
            current++;
            setTimeout(fillNextBlock, interval);
        } else {
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 400);
                }
            }, 400);
        }
    }
    fillNextBlock();
});
/**
     * index.js
     * Page-specific interactive logic for the NIVOR Hub Directory.
     */

document.addEventListener('DOMContentLoaded', () => {
    // Logo Click Reload
    const logoContainer = document.querySelector('.nvr-logo-container');
    if (logoContainer) {
        logoContainer.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Active Card Navigation
    const activeFormCard = document.querySelector('.forms-grid .form-card:not(.form-card--upcoming)');
    if (activeFormCard) {
        activeFormCard.addEventListener('click', () => {
            window.location.href = 'social-media-form.html';
        });
    }

    // Sync Now Button Logic with 5-second cooldown
    const syncNowBtn = document.getElementById('syncNowBtn');
    const syncText = document.getElementById('syncText');
    const syncIcon = document.getElementById('syncIcon');

    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => {
            if (syncNowBtn.disabled) return;

            // Fetch config to get webhook URL and trigger sync
            fetch('config.json')
                .then(response => response.json())
                .then(config => {
                    const webhookUrl = config.N8N_WH_SyncNow;
                    if (webhookUrl && !webhookUrl.includes('YOUR-SYNC-NOW-WEBHOOK')) {
                        fetch(webhookUrl, { method: 'POST' }).catch(err => console.error('Sync error:', err));
                    } else {
                        console.warn('Please update N8N_WH_SyncNow in config.json with a valid webhook URL.');
                    }
                })
                .catch(err => console.error('Failed to load config.json:', err));

            // Disable button and start countdown
            syncNowBtn.disabled = true;
            syncNowBtn.style.opacity = '0.7';
            syncNowBtn.style.cursor = 'not-allowed';
            syncIcon.classList.add('bi-hourglass-split');
            syncIcon.classList.remove('bi-arrow-repeat');
            
            let timeLeft = 5;
            syncText.textContent = `Várj... (${timeLeft}s)`;

            const countdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    syncText.textContent = `Várj... (${timeLeft}s)`;
                } else {
                    clearInterval(countdownInterval);
                    syncNowBtn.disabled = false;
                    syncNowBtn.style.opacity = '1';
                    syncNowBtn.style.cursor = 'pointer';
                    syncText.textContent = 'Sync Now';
                    syncIcon.classList.remove('bi-hourglass-split');
                    syncIcon.classList.add('bi-arrow-repeat');
                }
            }, 1000);
        });
    }
});

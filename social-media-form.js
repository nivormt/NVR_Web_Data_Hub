/**
 * social-media-form.js
 * Page-specific interactive logic and n8n webhook data collection.
 */

// Webhook URL configuration loaded dynamically from config.json
let N8N_WEBHOOK_URL = "";

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            const config = await response.json();
            N8N_WEBHOOK_URL = config.N8N_WH_Social || "";
        } else {
            console.warn('Nem sikerült betölteni a config.json konfigurációs fájlt.');
        }
    } catch (err) {
        console.error('Hiba a konfiguráció betöltésekor:', err);
    }
}
loadConfig();

// DOM Elements
const form = document.getElementById('socialMediaForm');
const submitBtn = document.getElementById('submitBtn');
const submitIcon = document.getElementById('submitIcon');
const errorBanner = document.getElementById('errorBanner');
const errorText = document.getElementById('errorText');
const descriptionTextarea = document.getElementById('description');

const successOverlay = document.getElementById('successOverlay');
const successCloseBtn = document.getElementById('successCloseBtn');

// Comments Count Toggle Elements
const commentsCheckbox = document.getElementById('comments');
const commentsCountContainer = document.getElementById('commentsCountContainer');
const commentsCountSelect = document.getElementById('commentsCount');

if (commentsCheckbox && commentsCountContainer && commentsCountSelect) {
    commentsCheckbox.addEventListener('change', function() {
        if (this.checked) {
            commentsCountContainer.style.display = 'flex';
            commentsCountSelect.required = true;
            commentsCountSelect.value = "20"; // Default to 20 when shown
        } else {
            commentsCountContainer.style.display = 'none';
            commentsCountSelect.required = false;
            commentsCountSelect.value = ""; // Clear when hidden
        }
    });
}

// Reset listener to return comments count block to default hidden state
if (form) {
    form.addEventListener('reset', () => {
        if (commentsCountContainer) commentsCountContainer.style.display = 'none';
        if (commentsCountSelect) {
            commentsCountSelect.required = false;
            commentsCountSelect.value = "";
        }
    });
}

// Auto-resize Description Textarea based on input content
if (descriptionTextarea) {
    descriptionTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

// Hide Error Banner
function hideError() {
    if (errorBanner) errorBanner.style.display = 'none';
}

// Show Error Banner
function showError(msg) {
    if (errorText && errorBanner) {
        errorText.textContent = msg;
        errorBanner.style.display = 'flex';
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Open Success Screen
function showSuccess() {
    if (successOverlay) {
        successOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scroll
    }
}

// Close Success Screen
function closeSuccess() {
    if (successOverlay) {
        successOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}
if (successCloseBtn) {
    successCloseBtn.addEventListener('click', closeSuccess);
}

// Form Submit Handler
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        // Verification of Dynamic Webhook URL from config.json
        if (!N8N_WEBHOOK_URL) {
            showError('Konfigurációs figyelmeztetés: A Webhook URL nincs megadva. Kérjük, állítsd be az N8N_WH_Social mezőt a config.json fájlban!');
            console.warn('NIVOR Integration Error: N8N_WH_Social is empty. Please set it in config.json.');
            return;
        }

        // Client-side Validation Checks
        if (!form.checkValidity()) {
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) firstInvalid.focus();
            showError('Kérjük, töltsd ki az összes kötelező mezőt érvényes adatokkal!');
            return;
        }

        // Gather Data
        const formData = {
            timestamp: new Date().toISOString(),
            submit_timestamp: Date.now(), // Unix epoch millisecond timestamp
            submit_id: typeof window.generateNvrSubmitId === 'function' ? window.generateNvrSubmitId() : "", // Unique ID generated per submission
            category: document.getElementById('category').value || "",
            url: (document.getElementById('url').value || "").trim(),
            country: (document.getElementById('country').value || "").trim(),
            region: (document.getElementById('region').value || "").trim(),
            city: (document.getElementById('city').value || "").trim(),
            description: (document.getElementById('description').value || "").trim(),
            stealable: document.getElementById('stealable').checked,
            metadata: document.getElementById('metadata').checked,
            comments: document.getElementById('comments').checked,
            comments_count: document.getElementById('comments').checked ? (document.getElementById('commentsCount').value || "20") : "",
            transcript: document.getElementById('transcript').checked
        };

        // Loading state
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Küldés folyamatban...';
        submitIcon.className = 'bi bi-arrow-repeat animate-spin';

        try {
            // POST fetch to n8n Webhook URL
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                form.reset();
                if (descriptionTextarea) {
                    descriptionTextarea.style.height = 'auto'; // Reset text area height
                }
                showSuccess();
            } else {
                throw new Error(`A szerver válasza: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error(err);
            showError(`Nem sikerült elküldeni az adatokat a webhooknak. Ellenőrizd a kapcsolatot és a config.json fájlban megadott Webhook URL-t! Részletek: ${err.message}`);
        } finally {
            // Restore state
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Adatok Beküldése';
            submitIcon.className = 'bi bi-send';
        }
    });
}

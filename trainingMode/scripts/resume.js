/**
 * resume.js
 * Sistema de Currículo — Resume Builder
 *
 * Persistência:
 *   - trainingMode_subMode_wins  : { [subModeId]: true }  → vitórias por sub-modo
 *   - trainingMode_resume_data   : { [fieldId]: string }  → dados preenchidos pelo usuário
 *
 * Um tópico é "desbloqueado" quando TODOS os seus sub-modos foram vencidos.
 */

// ---------------------------------------------------------------------------
// MAPA: topicId → subModeIds que precisam ser vencidos
// (deve espelhar gameModes.json)
// ---------------------------------------------------------------------------
const TOPIC_SUBMODES = {
    tutorial_grammar:   ['tutorial_vocab', 'tutorial_audio', 'tutorial_quiz', 'tutorial_interview'],
    persona:            ['persona_vocab',   'persona_audio',   'persona_quiz',   'persona_interview'],
    introduction:       ['intro_vocab',     'intro_audio',     'intro_quiz',     'intro_interview'],
    experience:         ['exp_vocab',       'exp_audio',       'exp_quiz',       'exp_interview'],
    meetings:           ['meetings_vocab',  'meetings_audio',  'meetings_quiz',  'meetings_interview'],
    classic_questions:  ['classic_vocab',   'classic_audio',   'classic_quiz',   'classic_interview'],
    soft_skills:        ['soft_vocab',      'soft_audio',      'soft_quiz',      'soft_interview'],
    salary_negotiation: ['salary_vocab',    'salary_audio',    'salary_quiz',    'salary_interview'],
};

// ---------------------------------------------------------------------------
// ESTRUTURA DO CURRÍCULO
// ---------------------------------------------------------------------------
const RESUME_SECTIONS = [
    {
        id: 'personal_info',
        title: '👤 Personal Information',
        topic: 'tutorial_grammar',
        fields: [
            { id: 'full_name',  label: 'Full Name',    placeholder: 'e.g. John Smith',                    type: 'text' },
            { id: 'email',      label: 'Email',         placeholder: 'e.g. john.smith@email.com',          type: 'text' },
            { id: 'linkedin',   label: 'LinkedIn',      placeholder: 'e.g. linkedin.com/in/johnsmith',     type: 'text' },
            { id: 'phone',      label: 'Phone',         placeholder: 'e.g. +55 (31) 9 1234-5678',          type: 'text' },
        ]
    },
    {
        id: 'professional_summary',
        title: '🎯 Professional Summary',
        topic: 'persona',
        fields: [
            { id: 'summary_kw1', label: 'Keyword 1', placeholder: 'e.g. proactive',       type: 'text' },
            { id: 'summary_kw2', label: 'Keyword 2', placeholder: 'e.g. collaborative',   type: 'text' },
            { id: 'summary_kw3', label: 'Keyword 3', placeholder: 'e.g. detail-oriented', type: 'text' },
            { id: 'summary_text', label: 'Summary Sentence', placeholder: 'e.g. I am a proactive and collaborative professional with strong attention to detail.', type: 'textarea' },
        ]
    },
    {
        id: 'self_introduction',
        title: '🗣️ Self-Introduction',
        topic: 'introduction',
        fields: [
            { id: 'intro_paragraph', label: 'Introduction Paragraph', placeholder: 'Write a brief self-introduction in English (2–3 sentences). e.g. "Hi, my name is John. I am a software developer with 3 years of experience in web development."', type: 'textarea' },
        ]
    },
    {
        id: 'work_experience',
        title: '💼 Work Experience',
        topic: 'experience',
        fields: [
            { id: 'job_title',   label: 'Job Title',        placeholder: 'e.g. Junior Developer',              type: 'text' },
            { id: 'company',     label: 'Company',          placeholder: 'e.g. Tech Corp Ltda.',               type: 'text' },
            { id: 'exp_period',  label: 'Period',           placeholder: 'e.g. Jan 2022 – Present',            type: 'text' },
            { id: 'achievement', label: 'Key Achievement',  placeholder: 'e.g. Reduced load time by 40% by optimizing queries.', type: 'textarea' },
        ]
    },
    {
        id: 'communication',
        title: '🤝 Meetings & Communication',
        topic: 'meetings',
        fields: [
            { id: 'comm_skill1',    label: 'Communication Skill 1',      placeholder: 'e.g. Active Listening',          type: 'text' },
            { id: 'comm_skill2',    label: 'Communication Skill 2',      placeholder: 'e.g. Clear Written Communication',type: 'text' },
            { id: 'meeting_phrase', label: 'Favourite Meeting Phrase',   placeholder: 'e.g. "Could you clarify that point?"', type: 'text' },
        ]
    },
    {
        id: 'classic_answers',
        title: '❓ Classic Interview Answers',
        topic: 'classic_questions',
        fields: [
            { id: 'why_hire',  label: '"Why should we hire you?"',   placeholder: 'e.g. Because I bring a strong mix of technical skills and soft skills that align with your needs.', type: 'textarea' },
            { id: 'strength',  label: '"What is your greatest strength?"', placeholder: 'e.g. My ability to quickly learn new technologies.', type: 'textarea' },
            { id: 'weakness',  label: '"What is your weakness?"',    placeholder: 'e.g. I sometimes focus too much on details, but I am working to balance thoroughness with speed.', type: 'textarea' },
        ]
    },
    {
        id: 'soft_skills_section',
        title: '⭐ Soft Skills',
        topic: 'soft_skills',
        fields: [
            { id: 'soft1', label: 'Top Soft Skill 1', placeholder: 'e.g. Leadership',      type: 'text' },
            { id: 'soft2', label: 'Top Soft Skill 2', placeholder: 'e.g. Empathy',         type: 'text' },
            { id: 'soft3', label: 'Top Soft Skill 3', placeholder: 'e.g. Problem-solving', type: 'text' },
        ]
    },
    {
        id: 'salary',
        title: '💰 Salary Expectation',
        topic: 'salary_negotiation',
        fields: [
            { id: 'salary_range',   label: 'Expected Salary Range', placeholder: 'e.g. R$ 4,000 – R$ 6,000 / month', type: 'text' },
            { id: 'salary_justify', label: 'Justification',         placeholder: 'e.g. Based on my experience and market research for this role in Belo Horizonte.', type: 'textarea' },
        ]
    },
];

// ---------------------------------------------------------------------------
// PERSISTENCE HELPERS
// ---------------------------------------------------------------------------
const WINS_KEY = 'trainingMode_subMode_wins';
const DATA_KEY = 'trainingMode_resume_data';

function getWins() {
    try { return JSON.parse(localStorage.getItem(WINS_KEY)) || {}; }
    catch { return {}; }
}

function getResumeData() {
    try { return JSON.parse(localStorage.getItem(DATA_KEY)) || {}; }
    catch { return {}; }
}

function saveResumeData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/**
 * Marca um sub-modo como vencido e persiste.
 * @param {string} subModeId  ex: "tutorial_quiz"
 */
function markSubModeWon(subModeId) {
    const wins = getWins();
    wins[subModeId] = true;
    localStorage.setItem(WINS_KEY, JSON.stringify(wins));
}

/**
 * Retorna true se todos os sub-modos de um tópico foram vencidos.
 */
function isTopicUnlocked(topicId) {
    const wins = getWins();
    const submodes = TOPIC_SUBMODES[topicId] || [];
    return submodes.length > 0 && submodes.every(id => wins[id] === true);
}

// ---------------------------------------------------------------------------
// PREVIEW HELPERS
// ---------------------------------------------------------------------------

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Retorna HTML de um campo para o preview do documento.
 * - Bloqueado → placeholder com cadeado (striped)
 * - Desbloqueado + vazio → placeholder pontilhado
 * - Preenchido → valor real
 */
function rdocField(fieldId, placeholder, isUnlocked) {
    if (!isUnlocked) {
        return `<span class="rdoc-ph rdoc-ph--locked" title="🔒 Complete the module to unlock">${placeholder}</span>`;
    }
    const val = (getResumeData()[fieldId] || '').trim();
    if (!val) {
        return `<span class="rdoc-ph rdoc-ph--empty">${placeholder}</span>`;
    }
    return `<span class="rdoc-filled">${escapeHtml(val)}</span>`;
}

function buildResumePreviewHTML() {
    const ul = {};
    RESUME_SECTIONS.forEach(s => { ul[s.topic] = isTopicUnlocked(s.topic); });

    const f = (id, ph, topic) => rdocField(id, ph, ul[topic]);

    return `
        <!-- Personal Header -->
        <div class="rdoc-personal-header">
            <div class="rdoc-name">${f('full_name', 'YOUR FULL NAME', 'tutorial_grammar')}</div>
            <div class="rdoc-contact">
                ${f('email',   'your@email.com',             'tutorial_grammar')}
                <span class="rdoc-sep">·</span>
                ${f('phone',   '+00 (00) 0 0000-0000',       'tutorial_grammar')}
                <span class="rdoc-sep">·</span>
                ${f('linkedin','linkedin.com/in/yourprofile', 'tutorial_grammar')}
            </div>
        </div>

        <!-- Professional Summary -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">PROFESSIONAL SUMMARY</div>
            <p class="rdoc-text">
                I am a ${f('summary_kw1','[keyword 1]','persona')},
                ${f('summary_kw2','[keyword 2]','persona')} and
                ${f('summary_kw3','[keyword 3]','persona')} professional.
            </p>
            <p class="rdoc-text rdoc-mt">${f('summary_text','[Write your summary sentence here...]','persona')}</p>
        </div>

        <!-- Self-Introduction -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">SELF-INTRODUCTION</div>
            <p class="rdoc-text">${f('intro_paragraph','[Write a brief self-introduction in English (2–3 sentences)...]','introduction')}</p>
        </div>

        <!-- Work Experience -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">WORK EXPERIENCE</div>
            <div class="rdoc-exp-header">
                <span class="rdoc-exp-title">${f('job_title','[Job Title]','experience')}</span>
                <span class="rdoc-sep">—</span>
                ${f('company','[Company Name]','experience')}
                <span class="rdoc-exp-period">${f('exp_period','[Period]','experience')}</span>
            </div>
            <p class="rdoc-text rdoc-mt">${f('achievement','[Describe your key achievement in this role...]','experience')}</p>
        </div>

        <!-- Communication -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">COMMUNICATION & MEETINGS</div>
            <div class="rdoc-skills-row">
                ${f('comm_skill1','[Communication Skill 1]','meetings')}
                <span class="rdoc-sep">·</span>
                ${f('comm_skill2','[Communication Skill 2]','meetings')}
            </div>
            <p class="rdoc-text rdoc-quote">"${f('meeting_phrase','[Your favourite meeting phrase...]','meetings')}"</p>
        </div>

        <!-- Interview Prep -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">INTERVIEW PREPARATION</div>
            <div class="rdoc-qa-block">
                <span class="rdoc-q">Why should we hire you?</span>
                <p class="rdoc-text">${f('why_hire','[Your answer here...]','classic_questions')}</p>
            </div>
            <div class="rdoc-qa-block">
                <span class="rdoc-q">Greatest strength?</span>
                <p class="rdoc-text">${f('strength','[Your answer here...]','classic_questions')}</p>
            </div>
            <div class="rdoc-qa-block">
                <span class="rdoc-q">Main weakness?</span>
                <p class="rdoc-text">${f('weakness','[Your answer here...]','classic_questions')}</p>
            </div>
        </div>

        <!-- Soft Skills -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">SOFT SKILLS</div>
            <div class="rdoc-skills-row rdoc-skills-pills">
                ${f('soft1','[Skill 1]','soft_skills')}
                <span class="rdoc-sep">·</span>
                ${f('soft2','[Skill 2]','soft_skills')}
                <span class="rdoc-sep">·</span>
                ${f('soft3','[Skill 3]','soft_skills')}
            </div>
        </div>

        <!-- Salary -->
        <div class="rdoc-section">
            <div class="rdoc-section-title">SALARY EXPECTATION</div>
            <p class="rdoc-text">
                <span class="rdoc-salary-range">${f('salary_range','[Expected Salary Range]','salary_negotiation')}</span>
            </p>
            <p class="rdoc-text rdoc-mt">${f('salary_justify','[Justification for your salary expectation...]','salary_negotiation')}</p>
        </div>
    `;
}

function updateResumePreview() {
    const previewContent = document.querySelector('.rdoc');
    if (previewContent) {
        previewContent.innerHTML = buildResumePreviewHTML();
    }
}

// ---------------------------------------------------------------------------
// MODAL RENDERING
// ---------------------------------------------------------------------------

function buildResumeModal() {
    const data = getResumeData();

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'resume-overlay';
    overlay.className = 'resume-overlay';

    // Modal
    const modal = document.createElement('div');
    modal.className = 'resume-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'resume-modal-header';
    header.innerHTML = `
        <div class="resume-header-title">
            <span class="resume-icon-doc">📄</span>
            <h2>My Resume</h2>
        </div>
        <button class="resume-close-btn" id="resume-close-btn" title="Close">✕</button>
    `;

    // Progress bar
    const unlockedCount = RESUME_SECTIONS.filter(s => isTopicUnlocked(s.topic)).length;
    const totalCount    = RESUME_SECTIONS.length;
    const progressPct   = Math.round((unlockedCount / totalCount) * 100);

    const progressWrap = document.createElement('div');
    progressWrap.className = 'resume-progress-wrap';
    progressWrap.innerHTML = `
        <div class="resume-progress-label">
            <span>${unlockedCount} of ${totalCount} sections unlocked</span>
            <span>${progressPct}%</span>
        </div>
        <div class="resume-progress-track">
            <div class="resume-progress-bar" style="width: ${progressPct}%"></div>
        </div>
    `;

    // Body — two columns
    const body = document.createElement('div');
    body.className = 'resume-modal-body';

    // ── Left panel: form sections ──────────────────────────────────────────
    const formPanel = document.createElement('div');
    formPanel.className = 'resume-form-panel';

    RESUME_SECTIONS.forEach(section => {
        const unlocked = isTopicUnlocked(section.topic);
        const sectionEl = document.createElement('div');
        sectionEl.className = 'resume-section' + (unlocked ? ' unlocked' : ' locked');
        sectionEl.id = 'resume-section-' + section.id;

        if (!unlocked) {
            const wins = getWins();
            const submodes = TOPIC_SUBMODES[section.topic] || [];
            const missing = submodes.filter(id => !wins[id]);
            const modeLabels = {
                '_vocab': 'Vocabulary', '_audio': 'Audio Quiz',
                '_quiz': 'Quiz', '_interview': 'Interview',
            };
            const missingLabels = missing.map(id => {
                for (const [suffix, label] of Object.entries(modeLabels)) {
                    if (id.endsWith(suffix)) return label;
                }
                return id;
            });

            sectionEl.innerHTML = `
                <div class="resume-section-header locked-header">
                    <span class="resume-section-title">${section.title}</span>
                    <span class="resume-lock-badge">🔒 LOCKED</span>
                </div>
                <div class="resume-locked-hint">
                    Complete all game modes for this topic to unlock.<br>
                    <span class="resume-missing-modes">Still needed: ${missingLabels.join(', ')}</span>
                </div>
            `;
        } else {
            const fieldsHTML = section.fields.map(field => {
                const value = data[field.id] || '';
                const escapedValue = value.replace(/"/g, '&quot;');
                if (field.type === 'textarea') {
                    return `
                        <div class="resume-field">
                            <label class="resume-field-label" for="rf-${field.id}">${field.label}</label>
                            <textarea
                                id="rf-${field.id}"
                                class="resume-field-input resume-textarea"
                                placeholder="${field.placeholder}"
                                data-field="${field.id}"
                                rows="3"
                            >${value}</textarea>
                        </div>
                    `;
                }
                return `
                    <div class="resume-field">
                        <label class="resume-field-label" for="rf-${field.id}">${field.label}</label>
                        <input
                            id="rf-${field.id}"
                            type="text"
                            class="resume-field-input"
                            placeholder="${field.placeholder}"
                            value="${escapedValue}"
                            data-field="${field.id}"
                        />
                    </div>
                `;
            }).join('');

            sectionEl.innerHTML = `
                <div class="resume-section-header">
                    <span class="resume-section-title">${section.title}</span>
                    <span class="resume-unlocked-badge">✅ UNLOCKED</span>
                </div>
                <div class="resume-fields">
                    ${fieldsHTML}
                </div>
            `;
        }

        formPanel.appendChild(sectionEl);
    });

    // ── Right panel: live resume preview ──────────────────────────────────
    const previewPanel = document.createElement('div');
    previewPanel.className = 'resume-preview-panel';

    const previewLabel = document.createElement('div');
    previewLabel.className = 'resume-preview-label';
    previewLabel.innerHTML = `<span>📋 Document Preview</span><span class="resume-preview-hint">Updates as you type</span>`;

    const rdoc = document.createElement('div');
    rdoc.className = 'rdoc';
    rdoc.innerHTML = buildResumePreviewHTML();

    previewPanel.appendChild(previewLabel);
    previewPanel.appendChild(rdoc);

    body.appendChild(formPanel);
    body.appendChild(previewPanel);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'resume-modal-footer';
    footer.innerHTML = `
        <span class="resume-save-hint">✍️ Fields are saved automatically as you type.</span>
    `;

    modal.appendChild(header);
    modal.appendChild(progressWrap);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Auto-save + live preview update on input
    overlay.addEventListener('input', e => {
        const target = e.target;
        if (!target.dataset.field) return;
        const resumeData = getResumeData();
        resumeData[target.dataset.field] = target.value;
        saveResumeData(resumeData);
        updateResumePreview();
    });

    // Close on button
    document.getElementById('resume-close-btn').addEventListener('click', closeResumeModal);

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeResumeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', handleEscapeKey);

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') closeResumeModal();
}

function openResumeModal() {
    const existing = document.getElementById('resume-overlay');
    if (existing) existing.remove();
    buildResumeModal();
}

function closeResumeModal() {
    const overlay = document.getElementById('resume-overlay');
    if (!overlay) return;

    document.removeEventListener('keydown', handleEscapeKey);

    overlay.classList.remove('active');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

// ---------------------------------------------------------------------------
// FLOATING BUTTON
// ---------------------------------------------------------------------------

function initResumeButton() {
    const btn = document.getElementById('resume-fab');
    if (!btn) return;

    const unlockedCount = RESUME_SECTIONS.filter(s => isTopicUnlocked(s.topic)).length;
    const badge = btn.querySelector('.resume-fab-badge');
    if (badge) {
        badge.textContent = unlockedCount + '/' + RESUME_SECTIONS.length;
    }

    btn.addEventListener('click', openResumeModal);
}

document.addEventListener('DOMContentLoaded', initResumeButton);

// Expose globally so other scripts can call it
window.markSubModeWon = markSubModeWon;

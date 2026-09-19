let score = 0;
let totalAnswered = 0;
let availableQuestions = [];
let activeChapter = 'all';
let currentQuestion = null;

// --- STORIA DELLE DOMANDE (per tornare indietro) ---
// Ogni entry: { question, mappedOptions, answered, isCorrect, selectedIndex }
let history = [];
let historyIndex = -1; // indice della domanda ATTUALMENTE visualizzata nella storia

const elements = {
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    chapterInfo: document.getElementById('chapter-info'),
    feedbackContainer: document.getElementById('feedback-container'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    nextBtn: document.getElementById('next-btn'),
    prevBtn: document.getElementById('prev-btn'),
    scoreDisplay: document.getElementById('score'),
    totalDisplay: document.getElementById('total-answered'),
    themeToggle: document.getElementById('theme-toggle'),
    resetBtn: document.getElementById('reset-btn'),
    statsBtn: document.getElementById('stats-btn'),
    statsContainer: document.getElementById('stats-container'),
    statsContent: document.getElementById('stats-content'),
    closeStatsBtn: document.getElementById('close-stats-btn'),
    progressBar: document.getElementById('progress-bar')
};

function initQuiz() {
    initTheme();
    loadProgress();

    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.resetBtn.addEventListener('click', resetQuiz);
    elements.nextBtn.addEventListener('click', handleNext);
    elements.prevBtn.addEventListener('click', handlePrev);
    elements.statsBtn.addEventListener('click', showStats);
    elements.closeStatsBtn.addEventListener('click', () => {
        elements.statsContainer.classList.add('hidden');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterQuestions(btn.dataset.chapter));
    });

    if (availableQuestions.length === 0 && totalAnswered === 0) {
        availableQuestions = [...questions];
    }

    // Se la storia ha un'ultima domanda, la mostriamo; altrimenti ne carichiamo una nuova
    if (history.length > 0 && historyIndex >= 0) {
        renderHistoryEntry(historyIndex);
    } else {
        loadRandomQuestion();
    }
}

// --- NAVIGAZIONE ---
function handleNext() {
    // Se siamo nel mezzo della storia (stiamo rivedendo), andiamo avanti
    if (historyIndex < history.length - 1) {
        historyIndex++;
        renderHistoryEntry(historyIndex);
    } else {
        // Siamo all'ultima domanda: carica una nuova
        loadRandomQuestion();
    }
}

function handlePrev() {
    if (historyIndex > 0) {
        historyIndex--;
        renderHistoryEntry(historyIndex);
    }
}

// Aggiorna lo stato dei pulsanti prev/next e la progress bar
function updateNavUI() {
    // Indietro: disabilitato se siamo alla prima domanda della storia
    elements.prevBtn.disabled = (historyIndex <= 0);

    // Avanti: testo diverso se siamo a fine storia o nel mezzo
    if (historyIndex < history.length - 1) {
        elements.nextBtn.textContent = 'Avanti →';
    } else {
        elements.nextBtn.textContent = 'Prossima Domanda →';
    }

    // Progress bar: basata sulle domande già usate nella sessione corrente
    const totalInPool = activeChapter === 'all' ? questions.length : history.length + availableQuestions.length;
    const done = history.length;
    const pct = totalInPool > 0 ? Math.min(100, Math.round((done / totalInPool) * 100)) : 0;
    elements.progressBar.style.width = pct + '%';
}

// --- FILTRO CAPITOLI ---
function filterQuestions(chapter) {
    activeChapter = chapter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chapter === chapter);
    });

    if (chapter === 'all') {
        availableQuestions = [...questions];
    } else {
        availableQuestions = questions.filter(q => q.c.startsWith(chapter + '.'));
        if (availableQuestions.length === 0) {
            availableQuestions = questions.filter(q => q.c.charAt(0) === chapter);
        }
    }

    // Resetta sessione e storia per il nuovo filtro
    score = 0;
    totalAnswered = 0;
    history = [];
    historyIndex = -1;
    updateScoreDisplay();
    elements.statsContainer.classList.add('hidden');

    loadRandomQuestion();
    saveProgress();
}

// --- TEMA SCURO ---
function initTheme() {
    const savedTheme = localStorage.getItem('istqb-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        elements.themeToggle.textContent = '☀️';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('istqb-theme', isDark ? 'dark' : 'light');
}

// --- SALVATAGGIO PROGRESSI ---
function saveProgress() {
    const state = {
        score,
        totalAnswered,
        availableQuestions,
        activeChapter,
        history,
        historyIndex
    };
    localStorage.setItem('istqb-progress', JSON.stringify(state));
}

function loadProgress() {
    const savedState = localStorage.getItem('istqb-progress');
    if (savedState) {
        const state = JSON.parse(savedState);
        score = state.score || 0;
        totalAnswered = state.totalAnswered || 0;
        availableQuestions = state.availableQuestions || [];
        history = state.history || [];
        historyIndex = state.historyIndex !== undefined ? state.historyIndex : -1;
        if (state.activeChapter) {
            activeChapter = state.activeChapter;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.chapter === activeChapter);
            });
        }
        updateScoreDisplay();
    }
}

function resetQuiz() {
    if (confirm("Vuoi davvero azzerare i tuoi progressi e ricominciare da capo?")) {
        score = 0;
        totalAnswered = 0;
        activeChapter = 'all';
        availableQuestions = [...questions];
        history = [];
        historyIndex = -1;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chapter === 'all');
        });
        updateScoreDisplay();
        saveProgress();
        loadRandomQuestion();
    }
}

function updateScoreDisplay() {
    elements.scoreDisplay.textContent = score;
    elements.totalDisplay.textContent = totalAnswered;
}

// --- LOGICA QUIZ ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadRandomQuestion() {
    if (availableQuestions.length === 0) {
        const label = activeChapter === 'all'
            ? 'tutte le domande'
            : `le domande del Capitolo ${activeChapter}`;
        alert(`Hai completato ${label}! Si ricomincia.`);
        if (activeChapter === 'all') {
            availableQuestions = [...questions];
        } else {
            availableQuestions = questions.filter(q => q.c.charAt(0) === activeChapter);
        }
        // Manteniamo la storia per la navigazione indietro
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    currentQuestion = question;
    availableQuestions.splice(randomIndex, 1);

    // Crea le opzioni mescolate e le salva nella storia
    const mappedOptions = question.o.map((text, index) => {
        const correctA = question.a;
        const correctIndices = Array.isArray(correctA) ? correctA : [correctA];
        return {
            text,
            originalIdx: index,
            isCorrect: correctIndices.includes(index)
        };
    });
    shuffleArray(mappedOptions);

    // Aggiungi la nuova domanda alla storia
    const entry = {
        question,
        mappedOptions,
        answered: false,
        isCorrect: null,
        selectedIdx: null
    };
    history.push(entry);
    historyIndex = history.length - 1;

    saveProgress();
    renderHistoryEntry(historyIndex);
}

// Renderizza la domanda in base a un entry della storia
function renderHistoryEntry(idx) {
    const entry = history[idx];
    currentQuestion = entry.question;

    const isMulti = Array.isArray(entry.question.a);
    const correctIndices = isMulti ? entry.question.a : [entry.question.a];

    elements.feedbackContainer.classList.add('hidden');
    elements.optionsContainer.innerHTML = '';

    elements.chapterInfo.textContent = `Capitolo: ${entry.question.c}`;
    elements.questionText.textContent = entry.question.q;

    // Label "Seleziona N risposte" per domande multi
    let multiLabel = document.getElementById('multi-label');
    if (isMulti) {
        if (!multiLabel) {
            multiLabel = document.createElement('p');
            multiLabel.id = 'multi-label';
            elements.optionsContainer.parentNode.insertBefore(multiLabel, elements.optionsContainer);
        }
        multiLabel.textContent = `⚠️ Seleziona ${correctIndices.length} risposte`;
        multiLabel.className = 'multi-label';
    } else {
        if (multiLabel) multiLabel.remove();
    }

    entry.mappedOptions.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.text;
        btn.dataset.originalIdx = option.originalIdx;
        btn.dataset.correct = correctIndices.includes(option.originalIdx);

        if (entry.answered) {
            btn.disabled = true;
            if (correctIndices.includes(option.originalIdx)) btn.classList.add('correct');
            if (entry.selectedIndices && entry.selectedIndices.includes(option.originalIdx) && !correctIndices.includes(option.originalIdx)) {
                btn.classList.add('incorrect');
            }
        } else if (isMulti) {
            btn.onclick = () => handleMultiSelect(btn, entry, idx);
        } else {
            btn.onclick = () => handleAnswer(option.isCorrect, entry.question.e, btn, option.originalIdx, idx);
        }

        elements.optionsContainer.appendChild(btn);
    });

    // Per domande multi non ancora risposta, aggiungi pulsante Conferma
    if (isMulti && !entry.answered) {
        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-multi-btn';
        confirmBtn.textContent = 'Conferma selezione';
        confirmBtn.className = 'confirm-multi-btn';
        confirmBtn.disabled = true;
        confirmBtn.onclick = () => confirmMultiAnswer(entry, idx, correctIndices);
        elements.optionsContainer.appendChild(confirmBtn);
    }

    // Se era già stata risposta, mostra il feedback
    if (entry.answered) {
        elements.feedbackTitle.textContent = entry.isCorrect ? '✅ Risposta Corretta!' : '❌ Risposta Sbagliata';
        elements.feedbackTitle.className = entry.isCorrect ? 'correct-text' : 'incorrect-text';
        elements.feedbackExplanation.textContent = entry.question.e;
        elements.feedbackContainer.classList.remove('hidden');
    }

    updateNavUI();
}

// Gestione selezione multipla: toggle selezione bottone
function handleMultiSelect(btn, entry, entryIdx) {
    const isMulti = Array.isArray(entry.question.a);
    const correctIndices = entry.question.a;
    const maxSelections = correctIndices.length;

    btn.classList.toggle('selected');

    const selected = elements.optionsContainer.querySelectorAll('.option-btn.selected');
    const confirmBtn = document.getElementById('confirm-multi-btn');

    // Abilita il pulsante conferma solo quando sono selezionate esattamente N opzioni
    if (confirmBtn) {
        confirmBtn.disabled = selected.length !== maxSelections;
    }
}

// Conferma la selezione multipla e valuta la risposta
function confirmMultiAnswer(entry, entryIdx, correctIndices) {
    const selectedBtns = elements.optionsContainer.querySelectorAll('.option-btn.selected');
    const selectedOriginalIndices = Array.from(selectedBtns).map(b => parseInt(b.dataset.originalIdx));

    const allButtons = elements.optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => {
        btn.disabled = true;
        const origIdx = parseInt(btn.dataset.originalIdx);
        if (correctIndices.includes(origIdx)) btn.classList.add('correct');
        if (selectedOriginalIndices.includes(origIdx) && !correctIndices.includes(origIdx)) btn.classList.add('incorrect');
        btn.classList.remove('selected');
    });

    // Rimuovi pulsante conferma
    const confirmBtn = document.getElementById('confirm-multi-btn');
    if (confirmBtn) confirmBtn.remove();

    // Verifica correttezza: tutte le risposte selezionate devono essere quelle giuste
    const isCorrect = selectedOriginalIndices.length === correctIndices.length &&
        correctIndices.every(ci => selectedOriginalIndices.includes(ci));

    entry.answered = true;
    entry.isCorrect = isCorrect;
    entry.selectedIndices = selectedOriginalIndices;

    totalAnswered++;
    if (isCorrect) score++;

    if (currentQuestion) saveChapterStats(currentQuestion.c, isCorrect);

    updateScoreDisplay();
    saveProgress();

    elements.feedbackTitle.textContent = isCorrect ? '✅ Risposta Corretta!' : '❌ Risposta Sbagliata';
    elements.feedbackTitle.className = isCorrect ? 'correct-text' : 'incorrect-text';
    elements.feedbackExplanation.textContent = entry.question.e;
    elements.feedbackContainer.classList.remove('hidden');

    updateNavUI();
}

function handleAnswer(isCorrect, explanation, selectedBtn, selectedOriginalIdx, entryIdx) {
    const entry = history[entryIdx];
    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');

    buttons.forEach((btn) => {
        btn.disabled = true;
        if (btn.dataset.correct === 'true') btn.classList.add('correct');
    });

    if (!isCorrect) selectedBtn.classList.add('incorrect');

    entry.answered = true;
    entry.isCorrect = isCorrect;
    entry.selectedIndices = [selectedOriginalIdx];

    totalAnswered++;
    if (isCorrect) score++;

    if (currentQuestion) saveChapterStats(currentQuestion.c, isCorrect);

    updateScoreDisplay();
    saveProgress();

    elements.feedbackTitle.textContent = isCorrect ? '✅ Risposta Corretta!' : '❌ Risposta Sbagliata';
    elements.feedbackTitle.className = isCorrect ? 'correct-text' : 'incorrect-text';
    elements.feedbackExplanation.textContent = explanation;
    elements.feedbackContainer.classList.remove('hidden');

    updateNavUI();
}

// --- STATISTICHE PER CAPITOLO ---
function getChapterNumber(sectionLabel) {
    const match = sectionLabel.match(/^(\d)/);
    return match ? match[1] : 'altro';
}

function saveChapterStats(sectionLabel, isCorrect) {
    const chapterNum = getChapterNumber(sectionLabel);
    const stats = JSON.parse(localStorage.getItem('istqb-stats') || '{}');
    if (!stats[chapterNum]) stats[chapterNum] = { answered: 0, correct: 0 };
    stats[chapterNum].answered++;
    if (isCorrect) stats[chapterNum].correct++;
    localStorage.setItem('istqb-stats', JSON.stringify(stats));
}

function showStats() {
    const stats = JSON.parse(localStorage.getItem('istqb-stats') || '{}');
    const chapterNames = {
        '1': 'Cap. 1 — Fondamenti',
        '2': 'Cap. 2 — Ciclo di vita',
        '3': 'Cap. 3 — Test Statico',
        '4': 'Cap. 4 — Tecniche',
        '5': 'Cap. 5 — Gestione',
        '6': 'Cap. 6 — Strumenti'
    };

    const chapterKeys = Object.keys(stats).sort();

    if (chapterKeys.length === 0) {
        elements.statsContent.innerHTML = '<p class="stats-empty">Nessuna statistica disponibile. Rispondi ad alcune domande!</p>';
    } else {
        let totalAnsw = 0, totalCorr = 0;
        chapterKeys.forEach(k => {
            totalAnsw += stats[k].answered;
            totalCorr += stats[k].correct;
        });
        const globalPct = totalAnsw > 0 ? Math.round((totalCorr / totalAnsw) * 100) : 0;

        let html = `
        <table>
            <thead>
                <tr>
                    <th>Capitolo</th>
                    <th>Risp.</th>
                    <th>Corr.</th>
                    <th>% Esattezza</th>
                </tr>
            </thead>
            <tbody>`;

        chapterKeys.forEach(k => {
            const s = stats[k];
            const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
            const label = chapterNames[k] || `Cap. ${k}`;
            const barColor = pct >= 75 ? '#28a745' : pct >= 50 ? '#ffc107' : '#dc3545';
            html += `
                <tr>
                    <td>${label}</td>
                    <td>${s.answered}</td>
                    <td>${s.correct}</td>
                    <td>
                        <span>${pct}%</span>
                        <div class="stats-bar-wrap">
                            <div class="stats-bar" style="width:${pct}%; background-color:${barColor}"></div>
                        </div>
                    </td>
                </tr>`;
        });

        html += `
            </tbody>
            <tfoot>
                <tr>
                    <th>Totale</th>
                    <th>${totalAnsw}</th>
                    <th>${totalCorr}</th>
                    <th>${globalPct}%</th>
                </tr>
            </tfoot>
        </table>`;

        elements.statsContent.innerHTML = html;
    }

    elements.statsContainer.classList.remove('hidden');
    elements.statsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.onload = initQuiz;

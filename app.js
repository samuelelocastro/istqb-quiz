let score = 0;
let totalAnswered = 0;
let availableQuestions = [];
let activeChapter = 'all';
// Manteniamo riferimento alla domanda corrente per le statistiche
let currentQuestion = null;

const elements = {
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    chapterInfo: document.getElementById('chapter-info'),
    feedbackContainer: document.getElementById('feedback-container'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    nextBtn: document.getElementById('next-btn'),
    scoreDisplay: document.getElementById('score'),
    totalDisplay: document.getElementById('total-answered'),
    themeToggle: document.getElementById('theme-toggle'),
    resetBtn: document.getElementById('reset-btn'),
    statsBtn: document.getElementById('stats-btn'),
    statsContainer: document.getElementById('stats-container'),
    statsContent: document.getElementById('stats-content'),
    closeStatsBtn: document.getElementById('close-stats-btn')
};

function initQuiz() {
    initTheme();
    loadProgress();

    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.resetBtn.addEventListener('click', resetQuiz);
    elements.nextBtn.addEventListener('click', loadRandomQuestion);
    elements.statsBtn.addEventListener('click', showStats);
    elements.closeStatsBtn.addEventListener('click', () => {
        elements.statsContainer.classList.add('hidden');
    });

    // Listener filtri capitolo
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterQuestions(btn.dataset.chapter));
    });

    // Se non ci sono domande salvate (primo avvio)
    if (availableQuestions.length === 0 && totalAnswered === 0) {
        availableQuestions = [...questions];
        loadRandomQuestion();
    } else {
        // Riprendiamo dallo stato salvato, carichiamo una nuova domanda
        // solo se non c'è già una in corso nel container
        if (elements.optionsContainer.innerHTML.trim() === '') {
            loadRandomQuestion();
        }
    }
}

// --- FILTRO CAPITOLI ---
function filterQuestions(chapter) {
    activeChapter = chapter;

    // Aggiorna UI bottoni filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chapter === chapter);
    });

    // Filtra il pool completo
    if (chapter === 'all') {
        availableQuestions = [...questions];
    } else {
        availableQuestions = questions.filter(q => q.c.startsWith(chapter + '.'));
        // Gestione capitoli con prefisso singolo cifra (es. "1.x", "2.x" ecc.)
        if (availableQuestions.length === 0) {
            // fallback più ampio: la sezione inizia con il numero del capitolo
            availableQuestions = questions.filter(q => q.c.charAt(0) === chapter);
        }
    }

    // Resetta score sessione
    score = 0;
    totalAnswered = 0;
    updateScoreDisplay();

    // Nasconde le stats se aperte
    elements.statsContainer.classList.add('hidden');

    // Carica nuova domanda dal pool filtrato
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
        activeChapter
    };
    localStorage.setItem('istqb-progress', JSON.stringify(state));
}

function loadProgress() {
    const savedState = localStorage.getItem('istqb-progress');
    if (savedState) {
        const state = JSON.parse(savedState);
        score = state.score;
        totalAnswered = state.totalAnswered;
        availableQuestions = state.availableQuestions;
        if (state.activeChapter) {
            activeChapter = state.activeChapter;
            // Ripristina bottone attivo
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
        // Ripristina filtro "Tutti"
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
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    currentQuestion = question;

    // Rimuovi la domanda dalla lista corrente
    availableQuestions.splice(randomIndex, 1);
    saveProgress();

    displayQuestion(question);
}

function displayQuestion(q) {
    elements.feedbackContainer.classList.add('hidden');
    elements.optionsContainer.innerHTML = '';

    elements.chapterInfo.textContent = `Capitolo: ${q.c}`;
    elements.questionText.textContent = q.q;

    // Crea un array mappato per poter randomizzare mantenendo traccia della corretta
    const mappedOptions = q.o.map((text, index) => ({
        text,
        isCorrect: index === q.a
    }));

    // Randomizza le opzioni per questa domanda
    shuffleArray(mappedOptions);

    mappedOptions.forEach((option) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.text;
        btn.dataset.correct = option.isCorrect;
        btn.onclick = () => handleAnswer(option.isCorrect, q.e, btn);
        elements.optionsContainer.appendChild(btn);
    });
}

function handleAnswer(isCorrect, explanation, selectedBtn) {
    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');

    // Disabilita tutti i bottoni e mostra quale era quello corretto
    buttons.forEach((btn) => {
        btn.disabled = true;
        if (btn.dataset.correct === "true") {
            btn.classList.add('correct');
        }
    });

    totalAnswered++;

    if (isCorrect) {
        score++;
        elements.feedbackTitle.textContent = "✅ Risposta Corretta!";
        elements.feedbackTitle.className = 'correct-text';
    } else {
        selectedBtn.classList.add('incorrect');
        elements.feedbackTitle.textContent = "❌ Risposta Sbagliata";
        elements.feedbackTitle.className = 'incorrect-text';
    }

    // Salva statistiche per capitolo
    if (currentQuestion) {
        saveChapterStats(currentQuestion.c, isCorrect);
    }

    updateScoreDisplay();
    saveProgress();

    elements.feedbackExplanation.textContent = explanation;
    elements.feedbackContainer.classList.remove('hidden');
}

// --- STATISTICHE PER CAPITOLO ---
function getChapterNumber(sectionLabel) {
    // Estrae il numero del capitolo (es. "4.2.1 EP" → "4")
    const match = sectionLabel.match(/^(\d)/);
    return match ? match[1] : 'altro';
}

function saveChapterStats(sectionLabel, isCorrect) {
    const chapterNum = getChapterNumber(sectionLabel);
    const stats = JSON.parse(localStorage.getItem('istqb-stats') || '{}');
    if (!stats[chapterNum]) {
        stats[chapterNum] = { answered: 0, correct: 0 };
    }
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
        // Totali globali
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
                    <th>Risposte</th>
                    <th>Corrette</th>
                    <th>% Esattezza</th>
                </tr>
            </thead>
            <tbody>`;

        chapterKeys.forEach(k => {
            const s = stats[k];
            const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
            const label = chapterNames[k] || `Cap. ${k}`;
            html += `
                <tr>
                    <td>${label}</td>
                    <td>${s.answered}</td>
                    <td>${s.correct}</td>
                    <td>
                        <span>${pct}%</span>
                        <div class="stats-bar-wrap">
                            <div class="stats-bar" style="width:${pct}%"></div>
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
    // Scroll alla sezione statistiche
    elements.statsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.onload = initQuiz;


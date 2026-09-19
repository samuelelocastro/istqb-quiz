let score = 0;
let totalAnswered = 0;
let availableQuestions = [];

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
    resetBtn: document.getElementById('reset-btn')
};

function initQuiz() {
    initTheme();
    loadProgress();
    
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.resetBtn.addEventListener('click', resetQuiz);
    elements.nextBtn.addEventListener('click', loadRandomQuestion);

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
        availableQuestions
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
        updateScoreDisplay();
    }
}

function resetQuiz() {
    if (confirm("Vuoi davvero azzerare i tuoi progressi e ricominciare da capo?")) {
        score = 0;
        totalAnswered = 0;
        availableQuestions = [...questions];
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
        alert("Hai completato tutte le domande! Ricominciamo dal primo capitolo.");
        availableQuestions = [...questions];
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    
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

    updateScoreDisplay();
    saveProgress();

    elements.feedbackExplanation.textContent = explanation;
    elements.feedbackContainer.classList.remove('hidden');
}

window.onload = initQuiz;

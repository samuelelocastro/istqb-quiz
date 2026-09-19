let currentQuestionIndex = 0;
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
    totalDisplay: document.getElementById('total-answered')
};

function initQuiz() {
    availableQuestions = [...questions];
    loadRandomQuestion();
}

function loadRandomQuestion() {
    if (availableQuestions.length === 0) {
        // Ricarica la lista per rendere il quiz infinito
        availableQuestions = [...questions];
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    
    // Rimuovi la domanda dalla lista corrente per non ripeterla finché non finiscono
    availableQuestions.splice(randomIndex, 1);
    
    displayQuestion(question);
}

function displayQuestion(q) {
    elements.feedbackContainer.classList.add('hidden');
    elements.optionsContainer.innerHTML = '';
    
    elements.chapterInfo.textContent = `Capitolo: ${q.c}`;
    elements.questionText.textContent = q.q;

    q.o.forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = optionText;
        btn.onclick = () => handleAnswer(index, q.a, q.e, btn);
        elements.optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, correctIndex, explanation, selectedBtn) {
    // Disabilita tutti i pulsanti dopo la risposta
    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIndex) {
            btn.classList.add('correct');
        }
    });

    totalAnswered++;
    elements.totalDisplay.textContent = totalAnswered;

    if (selectedIndex === correctIndex) {
        score++;
        elements.scoreDisplay.textContent = score;
        selectedBtn.classList.add('correct');
        elements.feedbackTitle.textContent = "✅ Risposta Corretta!";
        elements.feedbackTitle.className = 'correct-text';
    } else {
        selectedBtn.classList.add('incorrect');
        elements.feedbackTitle.textContent = "❌ Risposta Sbagliata";
        elements.feedbackTitle.className = 'incorrect-text';
    }

    elements.feedbackExplanation.textContent = explanation;
    elements.feedbackContainer.classList.remove('hidden');
}

elements.nextBtn.addEventListener('click', loadRandomQuestion);

// Avvia il quiz all'apertura
window.onload = initQuiz;

// ניהול מסכים
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// מערכת שמע
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isMuted = false;
    }

    initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            this.oscillator.frequency.value = 800;
            this.gainNode.gain.value = 0;
            
            this.oscillator.start();
        }
    }

    playBeep() {
        if (!this.isMuted && this.gainNode) {
            this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            this.gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + 0.1
            );
        }
    }

    speakText(text, lang = 'he-IL') {
        if (!this.isMuted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.volume = 1;
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        }
    }

    stopAll() {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
        window.speechSynthesis.cancel();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAll();
        }
        return this.isMuted;
    }

    cleanup() {
        if (this.oscillator) {
            this.oscillator.stop();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// מערכת החייאה
class CPRSystem {
    constructor(isTeamMode = false) {
        this.isTeamMode = isTeamMode;
        this.isRunning = false;
        this.compressionCount = 0;
        this.currentPhase = 'compressions';
        this.cycleTimer = 120; // 2 דקות
        this.cycles = [];
        this.currentCycleCompressions = 0;
        
        this.audioSystem = new AudioSystem();
        
        this.compressionInterval = null;
        this.cycleInterval = null;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateDisplay(elementsPrefix) {
        const counter = document.getElementById(`${elementsPrefix}CompressionsCounter`);
        const phaseText = document.getElementById(`${elementsPrefix}PhaseText`);
        const cycleTimer = document.getElementById(`${elementsPrefix}CycleTimer`);
        const currentCycle = document.getElementById(`${elementsPrefix}CurrentCycle`);
        const completedCycles = document.getElementById(`${elementsPrefix}CompletedCycles`);

        if (this.currentPhase === 'compressions') {
            counter.textContent = this.compressionCount;
            phaseText.textContent = 'עיסויים';
        } else {
            counter.textContent = 'נשימות';
            phaseText.textContent = 'תן 2 נשימות';
        }

        cycleTimer.textContent = `זמן: ${this.formatTime(this.cycleTimer)}`;

        // עדכון סיכום סבב נוכחי
        currentCycle.innerHTML = `
            <div class="cycle-info">
                סבב נוכחי: ${this.currentCycleCompressions} עיסויים
                <br>
                זמן שעבר: ${this.formatTime(120 - this.cycleTimer)}
            </div>
        `;

        // עדכון סבבים קודמים
        completedCycles.innerHTML = this.cycles
            .map((cycle, index) => `
                <div class="cycle-info">
                    סבב ${cycle.number}: ${cycle.compressions} עיסויים
                    <br>
                    זמן: ${cycle.timestamp}
                </div>
            `)
            .join('');
    }start(elementsPrefix) {
        if (!this.isRunning) {
            this.audioSystem.initialize();
            this.isRunning = true;

            // אתחול טיימר עיסויים
            this.compressionInterval = setInterval(() => {
                if (this.currentPhase === 'compressions') {
                    this.audioSystem.playBeep();
                    this.compressionCount++;
                    this.currentCycleCompressions++;

                    const maxCount = this.isTeamMode ? 15 : 30;
                    if (this.compressionCount >= maxCount) {
                        this.currentPhase = 'breaths';
                        this.compressionCount = 0;
                        this.audioSystem.stopAll();
                        this.audioSystem.speakText("תן שתי נשימות עד לעליית בית החזה");

                        setTimeout(() => {
                            this.currentPhase = 'compressions';
                        }, 2000);
                    }
                }
                this.updateDisplay(elementsPrefix);
            }, 600);

            // אתחול טיימר מחזור
            this.cycleInterval = setInterval(() => {
                if (this.cycleTimer > 0) {
                    this.cycleTimer--;
                    if (this.cycleTimer === 0) {
                        // סיום סבב
                        const cycle = {
                            number: this.cycles.length + 1,
                            compressions: this.currentCycleCompressions,
                            timestamp: new Date().toLocaleTimeString()
                        };
                        this.cycles.push(cycle);
                        this.currentCycleCompressions = 0;

                        if (this.isTeamMode) {
                            this.audioSystem.speakText("החלף מבצע עיסויים");
                            setTimeout(() => {
                                this.cycleTimer = 120;
                            }, 5000);
                        } else {
                            this.cycleTimer = 120;
                        }
                    }
                }
                this.updateDisplay(elementsPrefix);
            }, 1000);
        }
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.compressionInterval);
        clearInterval(this.cycleInterval);
        this.audioSystem.stopAll();
    }

    reset(elementsPrefix) {
        this.stop();
        this.compressionCount = 0;
        this.currentPhase = 'compressions';
        this.cycleTimer = 120;
        this.cycles = [];
        this.currentCycleCompressions = 0;
        this.updateDisplay(elementsPrefix);
    }

    toggleMute() {
        return this.audioSystem.toggleMute();
    }

    cleanup() {
        this.stop();
        this.audioSystem.cleanup();
    }
}

// מערכת מדידת דופק
class BPTimerSystem {
    constructor() {
        this.time = 15;
        this.isRunning = false;
        this.interval = null;
    }

    start() {
        if (!this.isRunning && this.time > 0) {
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.time--;
                this.updateDisplay();
                if (this.time === 0) {
                    this.stop();
                    document.getElementById('pulseResult').classList.remove('hidden');
                }
            }, 1000);
        }
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    reset() {
        this.stop();
        this.time = 15;
        this.updateDisplay();
        document.getElementById('pulseResult').classList.add('hidden');
        document.getElementById('pulseCount').value = '';
        document.getElementById('estimatedPulse').textContent = '';
    }

    updateDisplay() {
        document.getElementById('bpCounter').textContent = this.time;
    }
}

// נתוני מתורגמן
const translatorData = {
    categories: [
        { id: 'pain', icon: '🤕', label: 'כאב' },
        { id: 'medical_history', icon: '📋', label: 'רקע רפואי' },
        { id: 'allergies', icon: '💊', label: 'אלרגיות' },
        { id: 'medications', icon: '💉', label: 'תרופות' },
        { id: 'chest_pain', icon: '❤️', label: 'כאבי חזה' },
        { id: 'breathing', icon: '🫁', label: 'נשימה' },
        { id: 'dizzy', icon: '😵', label: 'סחרחורת' },
        { id: 'help', icon: '🚑', label: 'עזרה כללית' }
    ],
    phrases: {
        pain: {
            he: "איפה כואב לך?",
            ru: "Где болит?",
            en: "Where does it hurt?"
        },
        medical_history: {
            he: "יש לך מחלות רקע?",
            ru: "У вас есть хронические заболевания?",
            en: "Do you have any medical conditions?"
        },
        allergies: {
            he: "יש לך אלרגיות לתרופות?",
            ru: "У вас есть аллергия на лекарства?",
            en: "Are you allergic to any medications?"
        },
        medications: {
            he: "אילו תרופות אתה לוקח?",
            ru: "Какие лекарства вы принимаете?",
            en: "What medications are you taking?"
        },
        chest_pain: {
            he: "יש לך כאבים בחזה?",
            ru: "У вас болит грудь?",
            en: "Do you have chest pain?"
        },
        breathing: {
            he: "יש לך קשיי נשימה?",
            ru: "Вам тяжело дышать?",
            en: "Do you have difficulty breathing?"
        },
        dizzy: {
            he: "מרגיש סחרחורת?",
            ru: "У вас кружится голова?",
            en: "Are you feeling dizzy?"
        },
        help: {
            he: "אנחנו כאן לעזור לך",
            ru: "Мы здесь, чтобы помочь вам",
            en: "We're here to help you"
        }
    }
};

// אתחול המערכות
document.addEventListener('DOMContentLoaded', () => {
    // אתחול מערכות CPR
    const singleCPR = new CPRSystem(false);
    const teamCPR = new CPRSystem(true);
    const bpTimer = new BPTimerSystem();
    const audioSystem = new AudioSystem();

    // אתחול אירועי CPR מציל בודד
    document.getElementById('singleStartStop').addEventListener('click', function() {
        if (!singleCPR.isRunning) {
            this.innerHTML = '<i class="ri-pause-fill"></i>';
            this.classList.add('active');
            singleCPR.start('single');
        } else {
            this.innerHTML = '<i class="ri-play-fill"></i>';
            this.classList.remove('active');
            singleCPR.stop();
        }
    });

    document.getElementById('singleReset').addEventListener('click', () => {
        document.getElementById('singleStartStop').textContent = 'התחל';
        document.getElementById('singleStartStop').classList.remove('active');
        singleCPR.reset('single');
    });

    document.getElementById('singleMute').addEventListener('click', function() {
        const isMuted = singleCPR.toggleMute();
        this.innerHTML = isMuted ? 
            '<i class="ri-volume-mute-fill"></i>' : 
            '<i class="ri-volume-up-fill"></i>';
        this.classList.toggle('active', isMuted);
    });

    // אתחול אירועי CPR צוות
    document.getElementById('teamStartStop').addEventListener('click', function() {
        if (!teamCPR.isRunning) {
            this.textContent = 'עצור';
            this.classList.add('active');
            teamCPR.start('team');
        } else {
            this.textContent = 'התחל';
            this.classList.remove('active');
            teamCPR.stop();
        }
    });

    document.getElementById('teamReset').addEventListener('click', () => {
        document.getElementById('teamStartStop').textContent = 'התחל';
        document.getElementById('teamStartStop').classList.remove('active');
        teamCPR.reset('team');
    });

    document.getElementById('teamMute').addEventListener('click', function() {
        const isMuted = teamCPR.toggleMute();
        this.classList.toggle('active', isMuted);
    });

    // אתחול אירועי מדידת דופק
    document.getElementById('bpStartStop').addEventListener('click', function() {
        if (!bpTimer.isRunning) {
            this.textContent = 'עצור';
            this.classList.add('active');
            bpTimer.start();
        } else {
           this.textContent = 'התחל';
            this.classList.remove('active');
            bpTimer.stop();
        }
    });

    document.getElementById('bpReset').addEventListener('click', () => {
        document.getElementById('bpStartStop').textContent = 'התחל';
        document.getElementById('bpStartStop').classList.remove('active');
        bpTimer.reset();
    });

    document.getElementById('pulseCount').addEventListener('input', function() {
        const count = parseInt(this.value) || 0;
        const estimated = count * 4;
        document.getElementById('estimatedPulse').textContent = 
            `דופק משוער: ${estimated} לדקה`;
    });

    // אתחול מתורגמן
    const categoriesGrid = document.querySelector('.categories-grid');
    const translationDisplay = document.getElementById('translationDisplay');
    let selectedCategory = null;

    // יצירת כפתורי קטגוריות
    translatorData.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-button';
        button.innerHTML = `
            <span class="icon">${category.icon}</span>
            <span>${category.label}</span>
        `;
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(btn => 
                btn.classList.remove('selected')
            );
            button.classList.add('selected');
            selectedCategory = category.id;
            showTranslations(category.id);
        });
        categoriesGrid.appendChild(button);
    });

    function showTranslations(categoryId) {
        const phrases = translatorData.phrases[categoryId];
        translationDisplay.innerHTML = '';
        
        Object.entries(phrases).forEach(([lang, text]) => {
            const div = document.createElement('div');
            div.className = 'translation-item';
            div.innerHTML = `
                <span>${text}</span>
                <button class="play-button" onclick="playTranslation('${text}', '${lang}')">
                    🔊
                </button>
            `;
            translationDisplay.appendChild(div);
        });
    }

    // פונקציית השמעה גלובלית למתורגמן
    window.playTranslation = (text, lang) => {
        const utterance = new SpeechSynthesisUtterance(text);
        switch(lang) {
            case 'ru':
                utterance.lang = 'ru-RU';
                break;
            case 'en':
                utterance.lang = 'en-US';
                break;
            default:
                utterance.lang = 'he-IL';
        }
        utterance.volume = 1;
        utterance.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    // ניקוי בעת יציאה
    window.addEventListener('beforeunload', () => {
        singleCPR.cleanup();
        teamCPR.cleanup();
    });
});
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // מסתיר/מציג את ה-footer בהתאם למסך
    const footer = document.querySelector('.app-footer');
    if (screenId === 'mainMenu') {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'flex';
    }
}

// ניהול מסכים
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
// JavaScript לדף הבית
const mainMenuButtons = [
    {
        id: 'cprButton',
        icon: 'ri-heart-pulse-fill',
        label: 'החייאת מציל בודד',
        screen: 'singleCPR',
        color: '#ef4444'
    },
    {
        id: 'teamButton',
        icon: 'ri-team-fill',
        label: 'החייאת צוות',
        screen: 'teamCPR',
        color: '#3b82f6'
    },
    {
        id: 'timerButton',
        icon: 'ri-timer-fill',
        label: 'מדידת דופק',
        screen: 'bpTimer',
        color: '#10b981'
    },
    {
        id: 'translatorButton',
        icon: 'ri-translate-2',
        label: 'מתורגמן רפואי',
        screen: 'translator',
        color: '#8b5cf6'
    }
];

function initializeMainMenu() {
    const grid = document.querySelector('.main-grid');
    grid.innerHTML = '';

    mainMenuButtons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.id = button.id;
        buttonElement.className = 'menu-button';
        buttonElement.style.setProperty('--button-color', button.color);
        
        buttonElement.innerHTML = `
            <i class="${button.icon}"></i>
            <span>${button.label}</span>
        `;
        
        buttonElement.addEventListener('click', () => {
            showScreen(button.screen);
        });
        
        grid.appendChild(buttonElement);
    });
}

// הפעלה בטעינת הדף
document.addEventListener('DOMContentLoaded', initializeMainMenu);

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
            phaseText.classList.remove('blinking-text');  // מסיר את האנימציה במצב עיסויים
        } else {
            counter.textContent = 'הנשמות';
            phaseText.textContent = ' תן שני הנשמות עד לעליית בית חזה הקפד על חזרה מלאה';
            phaseText.classList.add('blinking-text');  // מוסיף אנימציה במצב הנשמות
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
                    שעה: ${cycle.timestamp}
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

                    const maxCount = this.isTeamMode ? 16 : 30;
                    if (this.compressionCount >= maxCount) {
                        this.currentPhase = 'breaths';
                        this.compressionCount = 0;
                        this.audioSystem.stopAll();
                        this.audioSystem.speakText("תן שתי הנשמות עד לעליית בית החזה");

                        setTimeout(() => {
                            this.currentPhase = 'compressions';
                        }, 3000);
                    }
                }
                this.updateDisplay(elementsPrefix);
            }, 500);

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
        this.time = 16;
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
        { id: 'emergency', icon: 'ri-alarm-warning-fill', label: 'חירום מיידי', color: '#ef4444' },
        { id: 'stroke', icon: 'ri-brain-fill', label: 'חשד לשבץ', color: '#8b5cf6' },
        { id: 'heart', icon: 'ri-heart-pulse-fill', label: 'חשד ללב', color: '#ec4899' },
        { id: 'basic', icon: 'ri-message-3-fill', label: 'בסיסי', color: '#3b82f6' },
        { id: 'pain', icon: 'ri-medicine-bottle-fill', label: 'כאב', color: '#f59e0b' },
        { id: 'medical', icon: 'ri-hospital-fill', label: 'רקע רפואי', color: '#10b981' },
        { id: 'neuro', icon: 'ri-mental-health-fill', label: 'בדיקה נוירולוגית', color: '#6366f1' },
        { id: 'breathing', icon: 'ri-lungs-fill', label: 'נשימה', color: '#0ea5e9' },
        { id: 'trauma', icon: 'ri-service-fill', label: 'חבלה', color: '#f43f5e' }
    ],
    phrases: {
        emergency: [
            {
                he: "אתה שומע אותי?",
                ru: "Вы меня слышите?",
                en: "Can you hear me?"
            },
            {
                he: "אתה יכול לדבר?",
                ru: "Вы можете говорить?",
                en: "Can you speak?"
            },
            {
                he: "אל תזוז",
                ru: "Не двигайтесь",
                en: "Don't move"
            },
            {
                he: "אנחנו פה כדי לעזור",
                ru: "Мы здесь, чтобы помочь",
                en: "We're here to help"
            }
        ],
        stroke: [
            {
                he: "תחייך בבקשה",
                ru: "Улыбнитесь, пожалуйста",
                en: "Please smile"
            },
            {
                he: "תרים את שתי הידיים",
                ru: "Поднимите обе руки",
                en: "Raise both arms"
            },
            {
                he: "תחזור אחרי: שלום, תודה, בוקר טוב",
                ru: "Повторите за мной: привет, спасибо, доброе утро",
                en: "Repeat after me: hello, thank you, good morning"
            },
            {
                he: "תוציא לשון",
                ru: "Покажите язык",
                en: "Stick out your tongue"
            },
            {
                he: "יש לך חולשה בצד אחד?",
                ru: "Есть слабость с одной стороны?",
                en: "Do you have weakness on one side?"
            },
            {
                he: "אתה מרגיש נימול?",
                ru: "Чувствуете онемение?",
                en: "Do you feel numbness?"
            }
        ],
        heart: [
            {
                he: "יש לך כאבים בחזה?",
                ru: "Болит в груди?",
                en: "Do you have chest pain?"
            },
            {
                he: "הכאב מקרין ליד שמאל?",
                ru: "Боль отдает в левую руку?",
                en: "Does the pain spread to your left arm?"
            },
            {
                he: "יש לך קוצר נשימה?",
                ru: "Вам тяжело дышать?",
                en: "Are you short of breath?"
            },
            {
                he: "אתה מזיע?",
                ru: "Вы потеете?",
                en: "Are you sweating?"
            },
            {
                he: "יש לך בחילה?",
                ru: "Вас тошнит?",
                en: "Do you feel nauseous?"
            },
            {
                he: "לקחת ניטרו?",
                ru: "Принимали нитроглицерин?",
                en: "Did you take nitro?"
            }
        ],
        basic: [
            {
                he: "איך קוראים לך?",
                ru: "Как вас зовут?",
                en: "What is your name?"
            },
            {
                he: "בן כמה אתה?",
                ru: "Сколько вам лет?",
                en: "How old are you?"
            },
            {
                he: "אתה מדבר עברית?",
                ru: "Вы говорите на иврите?",
                en: "Do you speak Hebrew?"
            },
            {
                he: "תנשום עמוק",
                ru: "Глубоко вдохните",
                en: "Take a deep breath"
            },
            {
                he: "תפתח את העיניים",
                ru: "Откройте глаза",
                en: "Open your eyes"
            }
        ],
        pain: [
            {
                he: "איפה כואב?",
                ru: "Где болит?",
                en: "Where does it hurt?"
            },
            {
                he: "מתי זה התחיל?",
                ru: "Когда это началось?",
                en: "When did it start?"
            },
            {
                he: "הכאב חזק או חלש?",
                ru: "Боль сильная или слабая?",
                en: "Is the pain strong or weak?"
            },
            {
                he: "הכאב מקרין למקום אחר?",
                ru: "Боль отдает куда-нибудь?",
                en: "Does the pain spread anywhere?"
            },
            {
                he: "זה כואב כל הזמן?",
                ru: "Болит постоянно?",
                en: "Does it hurt all the time?"
            }
        ],
        medical: [
            {
                he: "יש לך מחלות רקע?",
                ru: "Есть хронические заболевания?",
                en: "Do you have any medical conditions?"
            },
            {
                he: "אתה לוקח תרופות?",
                ru: "Принимаете лекарства?",
                en: "Do you take medications?"
            },
            {
                he: "יש לך אלרגיות?",
                ru: "Есть аллергия?",
                en: "Do you have allergies?"
            },
            {
                he: "יש לך לחץ דם גבוה?",
                ru: "У вас высокое давление?",
                en: "Do you have high blood pressure?"
            },
            {
                he: "יש לך סוכרת?",
                ru: "У вас диабет?",
                en: "Do you have diabetes?"
            }
        ],
        neuro: [
            {
                he: "אתה יודע איפה אתה?",
                ru: "Вы знаете, где вы находитесь?",
                en: "Do you know where you are?"
            },
            {
                he: "איזה יום היום?",
                ru: "Какой сегодня день?",
                en: "What day is it?"
            },
            {
                he: "כמה אצבעות אני מרים?",
                ru: "Сколько пальцев я показываю?",
                en: "How many fingers am I holding up?"
            },
            {
                he: "תלחץ את היד שלי",
                ru: "Сожмите мою руку",
                en: "Squeeze my hand"
            },
            {
                he: "אתה רואה טוב?",
                ru: "Хорошо видите?",
                en: "Can you see clearly?"
            }
        ],
        breathing: [
            {
                he: "קשה לך לנשום?",
                ru: "Тяжело дышать?",
                en: "Is it hard to breathe?"
            },
            {
                he: "יש לך שיעול?",
                ru: "Есть кашель?",
                en: "Do you have a cough?"
            },
            {
                he: "יש לך ליחה?",
                ru: "Есть мокрота?",
                en: "Do you have phlegm?"
            },
            {
                he: "יש לך אסטמה?",
                ru: "У вас астма?",
                en: "Do you have asthma?"
            },
            {
                he: "השתמשת במשאף?",
                ru: "Пользовались ингалятором?",
                en: "Did you use an inhaler?"
            }
        ],
        trauma: [
            {
                he: "איפה נחבלת?",
                ru: "Где ударились?",
                en: "Where were you hurt?"
            },
            {
                he: "נפלת?",
                ru: "Вы упали?",
                en: "Did you fall?"
            },
            {
                he: "איבדת הכרה?",
                ru: "Теряли сознание?",
                en: "Did you lose consciousness?"
            },
            {
                he: "אתה יכול להזיז את היד/רגל?",
                ru: "Можете двигать рукой/ногой?",
                en: "Can you move your arm/leg?"
            },
            {
                he: "יש דימום?",
                ru: "Есть кровотечение?",
                en: "Is there bleeding?"
            }
        ]
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
            this.innerHTML = '<i class="ri-pause-fill"></i>';
            this.classList.add('active');
            teamCPR.start('team');
        } else {
            this.innerHTML = '<i class="ri-play-fill"></i>';
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
        this.innerHTML = isMuted ? 
            '<i class="ri-volume-mute-fill"></i>' : 
            '<i class="ri-volume-up-fill"></i>';
        this.classList.toggle('active', isMuted);
    });

    // אתחול אירועי מדידת דופק
    document.getElementById('bpStartStop').addEventListener('click', function() {
        if (!bpTimer.isRunning) {
            this.innerHTML = '<i class="ri-pause-fill"></i>';
            this.classList.add('active');
            bpTimer.start();
        } else {
            this.innerHTML = '<i class="ri-play-fill"></i>';
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
    // אתחול מתורגמן
const categoriesGrid = document.querySelector('.categories-grid');
const translationDisplay = document.getElementById('translationDisplay');
let selectedCategory = null;

// יצירת כפתורי קטגוריות
translatorData.categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-button';
    // מגדיר את הצבע הייחודי לקטגוריה
    button.style.setProperty('--category-color', category.color);
    
    button.innerHTML = `
        <i class="${category.icon} category-icon"></i>
        <span class="category-label">${category.label}</span>
    `;
    
    button.addEventListener('click', () => {
        // מסיר את הסלקציה מכל הכפתורים
        document.querySelectorAll('.category-button').forEach(btn => 
            btn.classList.remove('selected')
        );
        // מוסיף סלקציה לכפתור הנוכחי
        button.classList.add('selected');
        selectedCategory = category.id;
        showTranslations(category.id);
    });
    
    categoriesGrid.appendChild(button);
});

function showTranslations(categoryId) {
    // עדכון כותרת
    document.getElementById('translationsTitle').textContent = 
        translatorData.categories.find(cat => cat.id === categoryId).label;
    
    // עדכון התוכן
    const translationsContent = document.getElementById('translationsContent');
    translationsContent.innerHTML = '';
    
    const phrases = translatorData.phrases[categoryId];
    phrases.forEach(phrase => {
        const translationCard = document.createElement('div');
        translationCard.className = 'translation-group';
        
        translationCard.innerHTML = `
            <div class="translation-row">
                <span class="lang-tag">עברית</span>
                <span class="translation-text">${phrase.he}</span>
                <button class="play-button" onclick="playTranslation('${phrase.he}', 'he')">
                    <i class="ri-volume-up-fill"></i>
                </button>
            </div>
            <div class="translation-row">
                <span class="lang-tag">RU</span>
                <span class="translation-text">${phrase.ru}</span>
                <button class="play-button" onclick="playTranslation('${phrase.ru}', 'ru')">
                    <i class="ri-volume-up-fill"></i>
                </button>
            </div>
            <div class="translation-row">
                <span class="lang-tag">EN</span>
                <span class="translation-text">${phrase.en}</span>
                <button class="play-button" onclick="playTranslation('${phrase.en}', 'en')">
                    <i class="ri-volume-up-fill"></i>
                </button>
            </div>
        `;
        
        translationsContent.appendChild(translationCard);
    });

    // מעבר למסך התרגומים
    showScreen('translationsList');
}
    function getLangLabel(lang) {
        switch(lang) {
            case 'he': return 'עברית';
            case 'ru': return 'РУС';
            case 'en': return 'ENG';
            default: return lang;
        }
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
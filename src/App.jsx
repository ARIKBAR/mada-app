import React, { useState, useEffect, useRef } from 'react';
import { Heart, Users2, Timer, ArrowRight, Home, Pause, Play, RefreshCw, Volume2, VolumeX, MessageSquare } from 'lucide-react';

// משפטים נפוצים למתורגמן
const commonPhrases = {
    pain: {
      he: "איפה כואב לך?",
      ru: "Где болит?",
      en: "Where does it hurt?",
    },
    medical_history: {
      he: "יש לך מחלות רקע?",
      ru: "У вас есть хронические заболевания?",
      en: "Do you have any medical conditions?",
    },
    allergies: {
      he: "יש לך אלרגיות לתרופות?",
      ru: "У вас есть аллергия на лекарства?",
      en: "Are you allergic to any medications?",
    },
    medications: {
      he: "אילו תרופות אתה לוקח?",
      ru: "Какие лекарства вы принимаете?",
      en: "What medications are you taking?",
    },
    chest_pain: {
      he: "יש לך כאבים בחזה?",
      ru: "У вас болит грудь?",
      en: "Do you have chest pain?",
    },
    breathing: {
      he: "יש לך קשיי נשימה?",
      ru: "Вам тяжело дышать?",
      en: "Do you have difficulty breathing?",
    },
    dizzy: {
      he: "מרגיש סחרחורת?",
      ru: "У вас кружится голова?",
      en: "Are you feeling dizzy?",
    },
    help: {
      he: "אנחנו כאן לעזור לך",
      ru: "Мы здесь, чтобы помочь вам",
      en: "We're here to help you",
    },
  };
  
  const categories = [
    { id: "pain", icon: "🤕", label: "כאב" },
    { id: "medical_history", icon: "📋", label: "רקע רפואי" },
    { id: "allergies", icon: "💊", label: "אלרגיות" },
    { id: "medications", icon: "💉", label: "תרופות" },
    { id: "chest_pain", icon: "❤️", label: "כאבי חזה" },
    { id: "breathing", icon: "🫁", label: "נשימה" },
    { id: "dizzy", icon: "😵", label: "סחרחורת" },
    { id: "help", icon: "🚑", label: "עזרה כללית" },
  ];
  
  const TranslatorScreen = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [voices, setVoices] = useState([]);
  
    // טוען את רשימת הקולות
    useEffect(() => {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log("Available voices:", availableVoices);
        setVoices(availableVoices);
      };
  
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);
  
    const getVoice = (lang) => {
      switch (lang) {
        case "ru":
          return (
            voices.find((voice) => voice.lang === "ru-RU") ||
            voices.find((voice) => voice.name.includes("Google русский"))
          );
        case "en":
          return voices.find((voice) => voice.lang === "en-US");
        default:
          return voices.find((voice) => voice.lang === "he-IL");
      }
    };
  
    const speak = async (text, lang) => {
      if (!("speechSynthesis" in window)) {
        console.error("Speech synthesis is not supported in this browser.");
        return;
      }
  
      window.speechSynthesis.cancel();
  
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "he-IL";
      utterance.voice = getVoice(lang);
  
      if (!utterance.voice) {
        console.error(`No voice found for language: ${lang}`);
        return;
      }
  
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
      };
  
      console.log(`Speaking in ${lang}:`, text);
      console.log("Selected voice:", utterance.voice);
  
      window.speechSynthesis.speak(utterance);
    };
  
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-white shadow p-4 space-y-4 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">מתורגמן רפואי</h2>
  
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`h-32 flex flex-col items-center justify-center p-4 border-2 rounded-lg ${
                  selectedCategory === category.id ? "border-red-600" : "border-gray-200"
                }`}
              >
                <span className="text-2xl mb-2">{category.icon}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
  
          {selectedCategory && (
            <div className="mt-6 space-y-4">
              {Object.entries(commonPhrases[selectedCategory]).map(([lang, text]) => (
                <div key={lang} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">{text}</span>
                  <button
                    onClick={() => speak(text, lang)}
                    className="p-2 text-red-600 bg-white shadow rounded-full"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

const BPTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const reset = () => {
    setIsRunning(false);
    setSeconds(15);
    setPulseCount(0);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-white shadow p-4 space-y-4 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">מדידת דופק</h2>
        <div className="flex flex-col items-center space-y-4">
          <div className="text-5xl font-bold text-red-600">{seconds}</div>
          {seconds === 0 && (
            <div className="flex flex-col items-center space-y-2">
              <input
                type="number"
                value={pulseCount}
                onChange={(e) => setPulseCount(parseInt(e.target.value) || 0)}
                className="w-24 text-center text-2xl p-2 border rounded-lg"
                min="0"
              />
              <div className="text-xl">
                דופק משוער: {(pulseCount * 4)} לדקה
              </div>
            </div>
          )}
          <div className="flex space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-4 ${isRunning ? 'bg-red-500' : 'bg-green-500'} text-white rounded-full`}
              disabled={seconds === 0}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={reset}
              className="p-4 bg-gray-500 text-white rounded-full"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CPRScreen = ({ isTeamMode = false }) => {
  const [isRunningCPR, setIsRunningCPR] = useState(false);
  const [compressionCount, setCompressionCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('compressions');
  const [isMuted, setIsMuted] = useState(false);
  const [switchTimer, setSwitchTimer] = useState(120);
  const [showSwitchAlert, setShowSwitchAlert] = useState(false);
  const [breathingInstructionShown, setBreathingInstructionShown] = useState(false);
  

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();
      
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      oscillatorRef.current.frequency.value = 800;
      gainNodeRef.current.gain.value = 0;
      
      oscillatorRef.current.start();
    }
  };
  const stopAllAudio = () => {
    // עצירת המטרונום
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    }
    // עצירת הנחיות קוליות קודמות
    window.speechSynthesis.cancel();
    // המתנה קצרה לוודא שכל הצלילים נעצרו
    return new Promise(resolve => setTimeout(resolve, 100));
  };

  const speakInstruction = async (text) => {
    if ('speechSynthesis' in window && !isMuted) {
      await stopAllAudio();  // מחכים שכל הצלילים ייעצרו
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.volume = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };


  const playBeep = () => {
    if (!isMuted && gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.1
      );
    }
  };

  const stopAudio = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    }
    window.speechSynthesis.cancel();
  };

  const toggleCPR = () => {
    if (!isRunningCPR) {
      initializeAudio();
      setSwitchTimer(120);
      setShowSwitchAlert(false);
    } else {
      stopAudio();
    }
    setIsRunningCPR(!isRunningCPR);
  };

  const resetCPR = () => {
    setIsRunningCPR(false);
    setCompressionCount(0);
    setCurrentPhase('compressions');
    setSwitchTimer(120);
    setShowSwitchAlert(false);
    stopAudio();
  };

  useEffect(() => {
  let interval;
  let breathingTimeout;
  
  if (isRunningCPR) {
    interval = setInterval(() => {
      if (currentPhase === 'compressions') {
        setCompressionCount(prev => {
          const maxCount = isTeamMode ? 15 : 30;
          if (prev >= maxCount) {
            setCurrentPhase('breaths');
            setBreathingInstructionShown(true);
            
            // קודם נעצור את כל הצלילים ורק אז נפעיל את ההנחיה הקולית
            stopAllAudio().then(() => {
              speakInstruction("תן שתי הנשמות");
            });
            
            breathingTimeout = setTimeout(() => {
              setBreathingInstructionShown(false);
              setCurrentPhase('compressions');
              setCompressionCount(0);
            }, 2000);
            
            return 0;
          }
          return prev + 1;
        });
        playBeep();
      }
    }, 600);
  }
  
  return () => {
    clearInterval(interval);
    if (breathingTimeout) clearTimeout(breathingTimeout);
    stopAllAudio();
  };
}, [isRunningCPR, currentPhase, isTeamMode, isMuted]);
  useEffect(() => {
    let interval;
    let resetTimeout;
    
    if (isRunningCPR && switchTimer > 0) {
      interval = setInterval(() => {
        setSwitchTimer(prev => {
          const newTime = prev - 1;
          if (newTime === 0) {
            setShowSwitchAlert(true);
            speakInstruction("החלף מבצע עיסויים");
            
            // אחרי 5 שניות - איפוס הטיימר והתחלה מחדש
            resetTimeout = setTimeout(() => {
              setSwitchTimer(120);
              setShowSwitchAlert(false);
            }, 5000);
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(interval);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [isRunningCPR, switchTimer]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-white shadow p-4 space-y-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            החייאת {isTeamMode ? 'צוות' : 'מציל בודד'}
          </h2>
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`p-2 ${isMuted ? 'bg-gray-200' : 'bg-blue-100'} rounded-full`}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className={`text-5xl font-bold ${currentPhase === 'compressions' ? 'text-red-600' : 'text-green-600'}`}>
            {currentPhase === 'compressions' ? compressionCount : 'הנשמות'}
          </div>

          <div className="text-lg">
            {currentPhase === 'compressions' ? 'עיסויים' : 'תן 2 הנשמות'}
          </div>

          <div className="text-sm text-gray-600">
            זמן להחלפה: {formatTime(switchTimer)}
          </div>

          {showSwitchAlert && (
            <div className="bg-red-100 text-red-700 p-2 rounded-lg animate-pulse">
            החלף מבצע עיסויים!
          </div>
        )}

        {breathingInstructionShown && (
          <div className="bg-green-100 text-green-700 p-2 text-center rounded-lg animate-pulse">
            תן שתי הנשמות עד לעליית בית החזה
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={toggleCPR}
            className={`p-4 ${isRunningCPR ? 'bg-red-500' : 'bg-green-500'} text-white rounded-full`}
          >
            {isRunningCPR ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={resetCPR}
            className="p-4 bg-gray-500 text-white rounded-full"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 text-center">
        {isTeamMode ? '15 עיסויים, 2 הנשמות' : '30 עיסויים, 2 הנשמות'}
        <br />
        קצב: 100-120 עיסויים לדקה
      </div>
    </div>
  </div>
);
};

// Main App Component
const MDApp = () => {
const [currentScreen, setCurrentScreen] = useState('home');
const [showBackButton, setShowBackButton] = useState(false);

const navigateTo = (screen) => {
  setCurrentScreen(screen);
  setShowBackButton(screen !== 'home');
};

return (
  <div className="min-h-screen bg-gray-100">
    <header className="bg-red-600 text-white p-3 flex justify-between items-center fixed top-0 w-full z-10">
      {showBackButton ? (
        <button 
          onClick={() => navigateTo('home')}
          className="flex items-center text-white"
        >
          <ArrowRight className="ml-2" />
          חזרה
        </button>
      ) : (
        <div />
      )}
      <h1 className="text-lg font-bold">כלי חירום</h1>
    </header>

    <main className="pt-14 pb-16 px-3">
      {currentScreen === 'home' && (
        <div className="grid grid-cols-2 gap-3 p-2">
          <button
            onClick={() => navigateTo('singleCPR')}
            className="bg-white p-4 shadow flex flex-col items-center justify-center gap-2 h-32 border-2 border-gray-200 rounded-lg"
          >
            <Heart className="w-8 h-8 text-red-600" />
            <span className="text-center text-sm font-medium">החייאת מציל בודד</span>
          </button>

          <button
            onClick={() => navigateTo('teamCPR')}
            className="bg-white p-4 shadow flex flex-col items-center justify-center gap-2 h-32 border-2 border-gray-200 rounded-lg"
          >
            <Users2 className="w-8 h-8 text-red-600" />
            <span className="text-center text-sm font-medium">החייאת צוות</span>
          </button>

          <button
            onClick={() => navigateTo('bpTimer')}
            className="bg-white p-4 shadow flex flex-col items-center justify-center gap-2 h-32 border-2 border-gray-200 rounded-lg"
          >
            <Timer className="w-8 h-8 text-red-600" />
            <span className="text-center text-sm font-medium">מדידת דופק</span>
          </button>

          <button
            onClick={() => navigateTo('translator')}
            className="bg-white p-4 shadow flex flex-col items-center justify-center gap-2 h-32 border-2 border-gray-200 rounded-lg"
          >
            <MessageSquare className="w-8 h-8 text-red-600" />
            <span className="text-center text-sm font-medium">מתורגמן רפואי</span>
          </button>
        </div>
      )}

      {currentScreen === 'singleCPR' && <CPRScreen isTeamMode={false} />}
      {currentScreen === 'teamCPR' && <CPRScreen isTeamMode={true} />}
      {currentScreen === 'bpTimer' && <BPTimer />}
      {currentScreen === 'translator' && <TranslatorScreen />}
    </main>

    <footer className="bg-red-600 text-white p-2 fixed bottom-0 w-full flex justify-center">
      <button 
        onClick={() => navigateTo('home')}
        className="flex items-center gap-2"
      >
        <Home className="w-5 h-5" />
        ראשי
      </button>
    </footer>
  </div>
);
};

export default MDApp;
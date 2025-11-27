
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorialProps {
  isActive: boolean;
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  style: React.CSSProperties;
}

interface MascotProps {
  customImage?: string; // Base64 string if user generated one
  tutorialProps?: TutorialProps; // If present, Mascot acts as the tutorial guide
}

const Mascot: React.FC<MascotProps> = ({ customImage, tutorialProps }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random tips array
  const tips = [
    "Tip: Be specific about the output format!",
    "I love a good context. Feed me data!",
    "Chain-of-thought makes me smarter.",
    "Need code? Use the 'Code' format.",
    "Don't forget to check your grammar!",
    "Beep boop! You look great today.",
    "Refining is the key to perfection.",
    "Try the 'Friendly' tone for emails."
  ];

  // -- Standard Mode Logic --
  const handleClick = () => {
    if (tutorialProps) return; // Disable random tips during tutorial

    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 600); // Duration of flip animation

    // Show a random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    speak(randomTip);
  };

  const speak = (text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setMessage(text);
    setIsVisible(true);

    // Auto-hide after 4 seconds
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  };

  // Idle chatter in Standard Mode
  useEffect(() => {
    if (tutorialProps) return;

    const idleTimer = setInterval(() => {
      if (!isVisible && Math.random() > 0.8) {
         speak("I'm ready when you are! 👋");
      }
    }, 30000); // Check every 30s
    return () => clearInterval(idleTimer);
  }, [isVisible, tutorialProps]);


  // -- Render Helpers --
  const isTutorial = !!tutorialProps;
  
  // Use passed style for tutorial, or fixed bottom-right for standard
  const containerStyle = isTutorial 
    ? { ...tutorialProps.style, zIndex: 10000 } 
    : { bottom: '1.5rem', right: '1rem', position: 'fixed' as 'fixed', zIndex: 50 };

  // In tutorial mode, bubble is always visible and contains tutorial content
  const bubbleVisible = isTutorial || isVisible;
  const bubbleContent = isTutorial ? tutorialProps.content : message;
  const bubbleTitle = isTutorial ? tutorialProps.title : null;

  return (
    <div 
      className={`flex flex-col items-end transition-all duration-500 ease-in-out pointer-events-none ${isTutorial ? 'absolute' : 'fixed'}`}
      style={containerStyle}
    >
      
      {/* Speech Bubble */}
      <div 
        className={`bg-white dark:bg-slate-800 border-2 border-brand-500 dark:border-brand-400 text-gray-800 dark:text-gray-100 p-4 rounded-2xl rounded-br-none shadow-xl mb-2 mr-4 text-xs font-medium transition-all duration-300 transform origin-bottom-right pointer-events-auto relative
          ${bubbleVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4 pointer-events-none'}
          ${isTutorial ? 'w-[280px]' : 'max-w-[200px]'}
        `}
      >
        {isTutorial && bubbleTitle && (
          <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-sm text-brand-700 dark:text-brand-300">
              {bubbleTitle}
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
             {tutorialProps.currentStep + 1}/{tutorialProps.totalSteps}
           </span>
          </div>
        )}

        <p className="leading-relaxed relative z-10 text-gray-600 dark:text-gray-300">
          {bubbleContent}
        </p>

        {isTutorial && (
           <div className="flex justify-between items-center mt-4 pt-2">
             <button 
               onClick={tutorialProps.onSkip}
               className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-medium underline decoration-dotted"
             >
               {t('tutorial.skip')}
             </button>
             
             <div className="flex gap-2">
               <button
                 onClick={tutorialProps.onPrev}
                 disabled={tutorialProps.currentStep === 0}
                 className="px-2 py-1 text-[10px] font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                 {t('tutorial.prev')}
               </button>
               <button
                 onClick={tutorialProps.onNext}
                 className="px-3 py-1 text-[10px] font-bold rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
               >
                 {tutorialProps.currentStep === tutorialProps.totalSteps - 1 ? t('tutorial.finish') : t('tutorial.next')}
               </button>
             </div>
           </div>
        )}

        {/* Little bubble arrow */}
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white dark:bg-slate-800 border-r-2 border-b-2 border-brand-500 dark:border-brand-400 transform rotate-45"></div>
      </div>

      {/* Mascot Container */}
      <div 
        className={`w-24 h-24 cursor-pointer pointer-events-auto transition-transform duration-300 select-none 
          ${isHovered ? 'scale-110 -translate-y-2' : ''} 
          ${isClicking ? 'animate-[spin_0.6s_ease-in-out]' : ''}
          ${isTutorial ? 'drop-shadow-xl' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        title="Promptly the Bot"
      >
        {customImage ? (
           <img 
             src={`data:image/png;base64,${customImage}`} 
             alt="Mascot" 
             className="w-full h-full object-contain drop-shadow-2xl rounded-full bg-white/10 backdrop-blur-sm animate-[bounce_3s_infinite]"
           />
        ) : (
          /* Custom SVG Mascot: Promptly with Hands */
          <svg viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl overflow-visible">
            <defs>
              <style>
                {`
                  @keyframes wave-hand {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(20deg); }
                    20% { transform: rotate(-10deg); }
                    30% { transform: rotate(20deg); }
                    40% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                  }
                  @keyframes blink-eyes {
                    0%, 96%, 100% { transform: scaleY(1); }
                    98% { transform: scaleY(0.1); }
                  }
                  @keyframes float-body {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                  }
                  .mascot-hand-right {
                    transform-origin: 105px 65px;
                    animation: wave-hand 4s ease-in-out infinite;
                  }
                  .mascot-hand-right:hover {
                     animation: wave-hand 1s ease-in-out infinite;
                  }
                  .mascot-eyes {
                    transform-origin: 70px 55px;
                    animation: blink-eyes 5s infinite;
                  }
                  .mascot-body-group {
                    animation: float-body 3.5s ease-in-out infinite;
                  }
                `}
              </style>
              <linearGradient id="bodyGradient" x1="70" y1="25" x2="70" y2="95" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED" />
                <stop offset="1" stopColor="#5B21B6" />
              </linearGradient>
            </defs>
            
            <g className="mascot-body-group">
               {/* Left Hand (Static Bob) */}
               <circle cx="35" cy="75" r="9" fill="#8B5CF6" className="dark:fill-brand-500" stroke="white" strokeWidth="2" />

               {/* Right Hand (Waving) */}
               <g className="mascot-hand-right">
                  {/* Arm connection */}
                  <line x1="100" y1="70" x2="115" y2="55" stroke="#7C3AED" className="dark:stroke-brand-400" strokeWidth="4" strokeLinecap="round" />
                  {/* Hand */}
                  <circle cx="118" cy="52" r="10" fill="#8B5CF6" className="dark:fill-brand-500" stroke="white" strokeWidth="2" />
                  {/* Palm details */}
                  <path d="M114 54 Q 118 57 122 54" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
               </g>

               {/* Main Body */}
               <circle cx="70" cy="60" r="35" fill="url(#bodyGradient)" className="shadow-inner"/>
               <circle cx="70" cy="60" r="30" fill="white" className="dark:fill-slate-900"/>
               
               {/* Face Group */}
               <g className="mascot-eyes">
                 {/* Eyes */}
                 <ellipse cx="60" cy="55" rx="5" ry="8" fill="#3B82F6" />
                 <ellipse cx="80" cy="55" rx="5" ry="8" fill="#3B82F6" />
                 {/* Sparkles */}
                 <circle cx="62" cy="53" r="2" fill="white" />
                 <circle cx="82" cy="53" r="2" fill="white" />
               </g>
               
               {/* Glasses/Visor Line connection */}
               <path d="M50 55 Q 70 58 90 55" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3"/>

               {/* Smile */}
               <path d="M58 70 Q 70 80 82 70" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" fill="none" />
               <path d="M56 68 Q 58 70 56 72" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
               <path d="M84 68 Q 82 70 84 72" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
               
               {/* Antenna */}
               <line x1="70" y1="25" x2="70" y2="10" stroke="#7C3AED" strokeWidth="3"/>
               <circle cx="70" cy="10" r="4" fill="#F59E0B" className="animate-pulse"/>
               <circle cx="70" cy="10" r="2" fill="#FEF3C7" />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};

export default Mascot;

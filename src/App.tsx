import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Settings, Play, Home, BarChart2, ShoppingBag, Star, RefreshCw, X, CheckCircle2, Filter, AlignJustify } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type GameState = 'start' | 'playing' | 'result';

interface LevelConfig {
  speed: number;
  targetWidth: number; // Percentage of the bar
}

const LEVELS: LevelConfig[] = [
  { speed: 1.5, targetWidth: 20 },
  { speed: 2.0, targetWidth: 15 },
  { speed: 2.5, targetWidth: 12 },
  { speed: 3.0, targetWidth: 10 },
  { speed: 3.5, targetWidth: 8 },
  { speed: 4.0, targetWidth: 6 },
  { speed: 4.5, targetWidth: 5 },
  { speed: 5.0, targetWidth: 4 },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timing, setTiming] = useState(50);
  const [result, setResult] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const requestRef = useRef<number>(null);
  const timingRef = useRef(50);
  const directionRef = useRef(1);

  // --- Game Logic ---

  const updateTiming = useCallback(() => {
    const currentLevel = LEVELS[Math.min(level, LEVELS.length - 1)];
    timingRef.current += directionRef.current * currentLevel.speed;

    if (timingRef.current >= 100) {
      timingRef.current = 100;
      directionRef.current = -1;
    } else if (timingRef.current <= 0) {
      timingRef.current = 0;
      directionRef.current = 1;
    }

    setTiming(timingRef.current);
    requestRef.current = requestAnimationFrame(updateTiming);
  }, [level]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateTiming);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateTiming]);

  const handleKick = () => {
    if (gameState !== 'playing') return;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const currentLevel = LEVELS[Math.min(level, LEVELS.length - 1)];
    const targetCenter = 50;
    const halfWidth = currentLevel.targetWidth / 2;
    const diff = Math.abs(timingRef.current - targetCenter);

    let outcome: 'perfect' | 'good' | 'miss';
    if (diff <= halfWidth / 2) {
      outcome = 'perfect';
      setScore(s => s + 100);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#005BAE', '#ffffff', '#7c3aed']
      });
    } else if (diff <= halfWidth) {
      outcome = 'good';
      setScore(s => s + 50);
    } else {
      outcome = 'miss';
    }

    setResult(outcome);
    setGameState('result');

    if (outcome !== 'miss') {
      setLevel(l => l + 1);
    }
  };

  const restartGame = () => {
    if (score > highScore) setHighScore(score);
    if (result === 'miss') {
      setScore(0);
      setLevel(0);
    }
    setGameState('playing');
    setResult(null);
    timingRef.current = Math.random() * 100;
    directionRef.current = Math.random() > 0.5 ? 1 : -1;
  };

  const goToStart = () => {
    if (score > highScore) setHighScore(score);
    setGameState('start');
    setScore(0);
    setLevel(0);
    setResult(null);
  };

  // --- UI Components ---

  const Header = () => (
    <header className="flex items-center justify-between px-6 py-4 w-full max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full neo-raised flex items-center justify-center bg-background">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Cruzeiro_Esporte_Clube_logo.svg" 
          alt="Cruzeiro Logo" 
          className="w-8 h-8"
          referrerPolicy="no-referrer"
        />
      </div>
      <h1 className="text-cruzeiro-blue font-bold tracking-widest text-lg">CABULOSO TIRO CERTO</h1>
      <button className="w-10 h-10 rounded-full neo-button flex items-center justify-center text-cruzeiro-blue">
        <Settings size={20} />
      </button>
    </header>
  );

  const Footer = () => (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-background/80 backdrop-blur-md rounded-3xl neo-raised p-2 flex justify-around items-center z-50">
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'ranking', icon: BarChart2, label: 'Ranking' },
        { id: 'store', icon: ShoppingBag, label: 'Loja' }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
            activeTab === tab.id ? 'neo-inset text-cruzeiro-blue' : 'text-slate-400'
          }`}
        >
          <tab.icon size={20} />
          <span className="text-[10px] font-semibold">{tab.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center overflow-hidden pb-32">
      <Header />

      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 gap-8">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div
              key="star"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12 w-full"
            >
              <div className="relative">
                <div className="w-48 h-48 rounded-full neo-raised flex items-center justify-center bg-background relative z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <img
                      src="../assets/estrela-pontiaguda.png"
                      style={{ filter: 'invert(1)' }}
                      className='w-50 justify-self-center '
                      alt="" 
                      />
                    {/* <Star size={180} className="text-cruzeiro-blue opacity-30" /> */}
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src="https://imagens.cruzeiro.com.br/Escudos/Cruzeiro.png" 
                      alt="Cruzeiro" 
                      className="w-20 h-20 "
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                {/* Decorative Stars */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-cruzeiro-blue/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2 + i, repeat: Infinity }}
                    style={{
                      top: `${50 + 60 * Math.sin((i * 2 * Math.PI) / 5)}%`,
                      left: `${50 + 60 * Math.cos((i * 2 * Math.PI) / 5)}%`,
                    }}
                  >
                    <Star size={24} fill="currentColor" />
                  </motion.div>
                ))}
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-cruzeiro-blue tracking-tighter">CRUZEIRO</h2>
                <p className="text-slate-500 font-medium">O TIME DO POVO</p>
                <div className="flex justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#005BAE" className="text-cruzeiro-blue" />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setGameState('playing')}
                className="w-full py-6 neo-button flex items-center justify-center gap-3 text-xl font-bold text-cruzeiro-blue"
              >
                <Play fill="currentColor" size={24} />
                COMEÇAR
              </button>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="neo-raised p-4 rounded-3xl flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recorde</span>
                  <span className="text-xl font-bold text-slate-700">{highScore}</span>
                </div>
                <div className="neo-raised p-4 rounded-3xl flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nível</span>
                  <span className="text-xl font-bold text-slate-700">{level + 1}</span>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center gap-12 w-full"
            >
              <div className="w-full neo-raised p-6 rounded-[2.5rem] flex flex-col items-center gap-6">
                <div className="flex justify-between w-full items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pontuação</span>
                    <span className="text-2xl font-black text-cruzeiro-blue">{score}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Nível</span>
                    <span className="text-2xl font-black text-slate-700">{level + 1}</span>
                  </div>
                </div>

                {/* Timing Bar */}
                <div className="w-full h-16 neo-inset rounded-2xl relative overflow-hidden flex items-center px-2">
                  {/* Target Zone */}
                  <div 
                    className="absolute top-0 bottom-0 bg-cruzeiro-blue/10 border-x-2 border-cruzeiro-blue/20"
                    style={{ 
                      left: `${50 - LEVELS[Math.min(level, LEVELS.length - 1)].targetWidth / 2}%`,
                      width: `${LEVELS[Math.min(level, LEVELS.length - 1)].targetWidth}%`
                    }}
                  />
                  {/* Perfect Zone */}
                  <div 
                    className="absolute top-0 bottom-0 bg-cruzeiro-blue/30"
                    style={{ 
                      left: `${50 - LEVELS[Math.min(level, LEVELS.length - 1)].targetWidth / 4}%`,
                      width: `${LEVELS[Math.min(level, LEVELS.length - 1)].targetWidth / 2}%`
                    }}
                  />
                  
                  {/* Indicator */}
                  <motion.div 
                    className="w-4 h-12 bg-cruzeiro-blue rounded-full shadow-lg z-10"
                    style={{ left: `${timing}%`, position: 'absolute', transform: 'translateX(-50%)' }}
                  />
                </div>

                <p className="text-xs text-slate-400 font-medium text-center">
                  Toque quando o marcador estiver no centro azul!
                </p>
              </div>

              <button
                onClick={handleKick}
                className="w-48 h-48 rounded-full neo-button flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-20 h-20 rounded-full bg-cruzeiro-blue flex items-center justify-center text-white shadow-xl group-active:scale-95 transition-transform">
                  <Play fill="currentColor" size={32} className="ml-1" />
                </div>
                <span className="font-bold text-cruzeiro-blue tracking-widest">CHUTAR!</span>
              </button>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              <div className="w-full neo-raised p-8 rounded-[2.5rem] flex flex-col items-center gap-6 text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  result === 'perfect' ? 'bg-green-100 text-green-600' :
                  result === 'good' ? 'bg-blue-100 text-cruzeiro-blue' :
                  'bg-red-100 text-red-600'
                }`}>
                  {result === 'perfect' ? <CheckCircle2 size={48} /> :
                   result === 'good' ? <CheckCircle2 size={48} /> :
                   <X size={48} />}
                </div>

                <div className="space-y-1">
                  <h3 className={`text-4xl font-black italic uppercase tracking-tighter ${
                    result === 'perfect' ? 'text-green-600' :
                    result === 'good' ? 'text-cruzeiro-blue' :
                    'text-red-600'
                  }`}>
                    {result === 'perfect' ? 'GOLAÇO!' :
                     result === 'good' ? 'GOL!' :
                     'NA TRAVE!'}
                  </h3>
                  <p className="text-slate-500 font-medium">
                    {result === 'perfect' ? 'Tempo perfeito! +100 pts' :
                     result === 'good' ? 'Bom chute! +50 pts' :
                     'Você errou o tempo. Tente novamente!'}
                  </p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 pt-4">
                  <div className="neo-inset p-4 rounded-2xl">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Score</span>
                    <span className="text-xl font-bold text-slate-700">{score}</span>
                  </div>
                  <div className="neo-inset p-4 rounded-2xl">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Nível</span>
                    <span className="text-xl font-bold text-slate-700">{level + 1}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={restartGame}
                  className="w-full py-6 neo-button flex items-center justify-center gap-3 text-xl font-bold text-cruzeiro-blue"
                >
                  <RefreshCw size={24} />
                  {result === 'miss' ? 'TENTAR DE NOVO' : 'PRÓXIMO NÍVEL'}
                </button>
                <button
                  onClick={goToStart}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  VOLTAR AO MENU
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

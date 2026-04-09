import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Settings, Play, Home, BarChart2, ShoppingBag, Star, RefreshCw, X, CheckCircle2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import backgroundPlay from '../assets/backgroundPlay.png';

// --- Types ---
type GameState = 'start' | 'playing' | 'result';

type TabID = 'home' | 'ranking' | 'store';

interface GameStats {
  highScore: number;
  totalShots: number;
  perfectShots: number;
  goodShots: number;
  totalScore: number;
  maxLevel: number;
}

const STORAGE_KEY = 'cabuloso-tiro-certo-stats';

const defaultStats: GameStats = {
  highScore: 0,
  totalShots: 0,
  perfectShots: 0,
  goodShots: 0,
  totalScore: 0,
  maxLevel: 0,
};

const SHOP_ITEMS = [
  { id: 'theme-dark', name: 'Tema Escuro', description: 'Mude para um tema escuro elegante.', price: 500 },
  { id: 'theme-light', name: 'Tema Claro', description: 'Um tema claro e limpo para jogar durante o dia.', price: 500 },
  { id: 'ball-red', name: 'Bola Vermelha', description: 'Troque a bola padrão por uma vermelha vibrante.', price: 300 },
  { id: 'ball-green', name: 'Bola Verde', description: 'Uma bola verde para dar um toque de frescor.', price: 300 },
  { id: 'ball-blue', name: 'Bola Azul', description: 'A clássica bola azul, mas com um visual renovado.', price: 300 },
];

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

const MAX_ATTEMPTS = 3;
const DEFAULT_ROUND_MESSAGE = 'Toque em CHUTAR quando o marcador estiver na faixa azul.';

const FOOTER_TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'ranking', icon: BarChart2, label: 'Ranking' },
  { id: 'store', icon: ShoppingBag, label: 'Loja' },
] as const;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [activeTab, setActiveTab] = useState<TabID>('home');
  const [stats, setStats] = useState<GameStats>(defaultStats);

  const [timing, setTiming] = useState(50);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [attemptFeedback, setAttemptFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [roundMessage, setRoundMessage] = useState(DEFAULT_ROUND_MESSAGE);
  const [result, setResult] = useState<'perfect' | 'good' | 'miss' | null>(null);

  const requestRef = useRef<number | null>(null);
  const timingRef = useRef(50);
  const directionRef = useRef(1);



  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setStats({ ...defaultStats, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);


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

  const resetTiming = useCallback(() => {
    timingRef.current = Math.random() * 100;
    directionRef.current = Math.random() > 0.5 ? 1 : -1;
    setTiming(timingRef.current);
  }, []);

  const resumeRound = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    resetTiming();
    requestRef.current = requestAnimationFrame(updateTiming);
  }, [resetTiming, updateTiming]);

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
    const halfWidth = currentLevel.targetWidth / 2;
    const diff = Math.abs(timingRef.current - 50);

    let outcome: 'perfect' | 'good' | 'miss';
    let addedScore = 0;
    let nextLevel = level;

    if (diff <= halfWidth / 2) {
      outcome = 'perfect';
      addedScore = 100;
      nextLevel = level + 1;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#005BAE', '#ffffff', '#d4af37'] });
    } else if (diff <= halfWidth) {
      outcome = 'good';
      addedScore = 50;
      nextLevel = level + 1;
    } else {
      outcome = 'miss';
    }

    const nextScore = score + addedScore;

    if (outcome === 'miss') {
      const nextAttemptsLeft = attemptsLeft - 1;

      persistOutcome('miss', score, level);
      setAttemptFeedback('miss');

      if (nextAttemptsLeft > 0) {
        setAttemptsLeft(nextAttemptsLeft);
        setRoundMessage(
          nextAttemptsLeft === 1
            ? 'Quase! Você ainda tem 1 tentativa nesta rodada.'
            : `Quase! Você ainda tem ${nextAttemptsLeft} tentativas nesta rodada.`
        );
        resumeRound();
        return;
      }

      setAttemptsLeft(0);
      setResult('miss');
      setRoundMessage('Suas três tentativas acabaram.');
      setGameState('result');
      return;
    }

    persistOutcome(outcome, nextScore, nextLevel);
    setAttemptFeedback(outcome);
    setRoundMessage(outcome === 'perfect' ? 'Perfeito! Bônus máximo garantido.' : 'Boa! Você passou de rodada.');
    setScore(nextScore);
    setLevel(nextLevel);
    setResult(outcome);
    setGameState('result');
  };


  const persistOutcome = (outcome: 'perfect' | 'good' | 'miss', nextScore: number, nextLevel: number) => {
    setStats(cur => ({
      highScore: Math.max(cur.highScore, nextScore),
      totalShots: cur.totalShots + 1,
      perfectShots: cur.perfectShots + (outcome === 'perfect' ? 1 : 0),
      goodShots: cur.goodShots + (outcome === 'good' ? 1 : 0),
      totalScore: cur.totalScore + (outcome === 'perfect' ? 100 : outcome === 'good' ? 50 : 0),
      maxLevel: Math.max(cur.maxLevel, nextLevel),
    }));
  };

  const startRound = (nextLevel: number, nextScore: number) => {
    setActiveTab('home');
    setGameState('playing');
    setResult(null);
    setAttemptFeedback(null);
    setRoundMessage(DEFAULT_ROUND_MESSAGE);
    setAttemptsLeft(MAX_ATTEMPTS);
    setLevel(nextLevel);
    setScore(nextScore);
    resetTiming();
  };

  const beginNewGame = () => startRound(0, 0);

  const goToMenu = () => {
    setGameState('start');
    setActiveTab('home');
    setResult(null);
    setAttemptFeedback(null);
    setRoundMessage(DEFAULT_ROUND_MESSAGE);
    setAttemptsLeft(MAX_ATTEMPTS);
    setTiming(50);
    timingRef.current = 50;
    directionRef.current = 1;
  };

  const handleTabChange = (nextTab: TabID) => {
    if (gameState !== 'start') {
      goToMenu();
    }
    setActiveTab(nextTab);
  };




  // --- UI Components ---

  const Header = () => (
    // Cabecalho principal da pagina.
    <header className="flex items-center justify-between px-6 py-4 w-full max-w-md mx-auto">
      {/* Botao da logo que retorna ao menu inicial. */}
      <div className="w-12 h-12 rounded-full neo-raised flex items-center justify-center bg-background">
        <button
          type="button"
          onClick={goToMenu}
          className="w-full h-full rounded-full flex items-center justify-center"
          aria-label="Voltar ao menu"
        >
          <img
            src="https://www.cruzeiro.com.br/favicon.png"
            alt="Cruzeiro Logo"
            className="w-12 h-12"
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
      {/* Titulo da aplicacao. */}
      <h1 className="text-cruzeiro-blue font-bold tracking-widest text-lg">CABULOSO TIRO CERTO</h1>
      {/* Botao reservado para configuracoes. */}
      <button className="w-10 h-10 rounded-full neo-button flex items-center justify-center text-cruzeiro-blue">
        <Settings size={20} />
      </button>
    </header>
  );

  const Footer = () => (
    // Navegacao fixa inferior entre as abas principais.
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-background/80 backdrop-blur-md rounded-3xl neo-raised p-2 flex justify-around items-center z-50">
      {FOOTER_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${activeTab === tab.id ? 'neo-inset text-cruzeiro-blue' : 'text-slate-400'
            }`}
        >
          <tab.icon size={20} />
          <span className="text-[10px] font-semibold">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
  const RankingTab = () => {
    const accuracy = stats.totalShots
      ? Math.round(((stats.perfectShots + stats.goodShots) / stats.totalShots) * 100)
      : 0;

    return (
      // Tela de ranking com resumo do desempenho do jogador.
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-5">
        {/* Card principal com o melhor score salvo. */}
        <div className="neo-raised rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cruzeiro-blue text-white flex items-center justify-center">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold">Seu melhor desempenho</p>
            <h2 className="text-3xl font-black text-cruzeiro-blue">{stats.highScore}</h2>
          </div>
        </div>

        {/* Grade com metricas gerais da conta. */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Chutes', value: stats.totalShots },
            { label: 'Precisão', value: `${accuracy}%` },
            { label: 'Perfeitos', value: stats.perfectShots },
            { label: 'Melhor nível', value: Math.max(stats.maxLevel, 1) },
          ].map(({ label, value }) => (
            <div key={label} className="neo-raised rounded-3xl p-5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{label}</p>
              <p className="text-2xl font-black text-slate-700 mt-2">{value}</p>
            </div>
          ))}
        </div>

        {/* Painel com barras percentuais de desempenho. */}
        <div className="neo-raised rounded-[2rem] p-6">
          <h3 className="text-lg font-black text-slate-700">Painel de desempenho</h3>
          <div className="mt-5 space-y-4">
            {[
              { label: 'Chutes perfeitos', count: stats.perfectShots, color: 'bg-green-500' },
              { label: 'Chutes bons', count: stats.goodShots, color: 'bg-cruzeiro-blue' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm text-slate-500 font-semibold">
                  <span>{label}</span>
                  <span>{stats.totalShots ? Math.round((count / stats.totalShots) * 100) : 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 mt-2 overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${stats.totalShots ? (count / stats.totalShots) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    );
  };

  const StoreTab = () => (
    // Tela de loja com saldo e itens desbloqueaveis.
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-4">
      {/* Card de saldo acumulado pelas partidas. */}
      <div className="neo-raised rounded-[2rem] p-6">
        <p className="text-sm text-slate-500 font-semibold">Saldo disponível</p>
        <h2 className="text-3xl font-black text-cruzeiro-blue">{stats.totalScore}</h2>
        <p className="text-xs text-slate-400 mt-2">Calculado pela soma de pontos de todas as partidas.</p>
      </div>

      {SHOP_ITEMS.map((item) => {
        const canUnlock = stats.totalScore >= item.price;
        return (
          // Card individual de item da loja.
          <div key={item.id} className="neo-raised rounded-[2rem] p-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-700">{item.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-cruzeiro-blue">{item.price}</p>
              <span className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs font-bold ${canUnlock ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                {canUnlock ? 'Liberado' : 'Bloqueado'}
              </span>
            </div>
          </div>
        );
      })}
    </motion.section>
  );

  const showPlayingBackground = gameState === 'playing';

  const currentLevelConfig = LEVELS[Math.min(level, LEVELS.length - 1)];
  const liveOffsetFromCenter = Math.abs(timing - 50);
  const perfectZoneWidth = currentLevelConfig.targetWidth / 2;
  const insidePerfectZone = liveOffsetFromCenter <= perfectZoneWidth / 2;
  const insideGoodZone = liveOffsetFromCenter <= currentLevelConfig.targetWidth / 2;
  const currentAttempt = MAX_ATTEMPTS - attemptsLeft + 1;
  const liveWindowLabel = insidePerfectZone
    ? 'Agora!'
    : insideGoodZone
      ? 'Boa chance!'
      : 'Espere o centro';
  const liveWindowTone = insidePerfectZone
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : insideGoodZone
      ? 'border-sky-200 bg-sky-50 text-cruzeiro-blue'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  const roundMessageTone = attemptFeedback === 'miss'
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : attemptFeedback === 'perfect'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : attemptFeedback === 'good'
        ? 'border-sky-200 bg-sky-50 text-cruzeiro-blue'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    // Container raiz da pagina, com troca de fundo durante a partida.
    <div className="relative isolate min-h-screen bg-background flex flex-col items-center overflow-x-hidden pb-32">
      {showPlayingBackground && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_58%)]" />
          <img
            src={backgroundPlay}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-contain object-center"
          />
        </div>
      )}

      {/* Cabecalho fixo do app. */}
      <div className="relative z-10 w-full">
        <Header />
      </div>

      {/* Area central que alterna entre menu, partida e resultado. */}
      <main className="relative z-10 flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 gap-8">
        <AnimatePresence mode="wait">
          {gameState === 'start' && activeTab === 'home' && (
            // Tela inicial com identidade visual e botao de entrada.
            <motion.div
              key="star"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-12 w-full"
            >
              {/* Bloco visual central com estrela girando e escudo. */}
              <div className="relative">
                <div className="w-60 h-60 rounded-full neo-raised flex items-center justify-center bg-background relative z-10">
                  {/* Estrela principal com rotacao continua. */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <img
                      src="../assets/estrela-de-6-pontas.png"
                      className='w-60 h-60 justify-self-center '
                      alt=""
                    />
                    {/* <Star size={180} className="text-cruzeiro-blue opacity-30" /> */}
                  </motion.div>
                  {/* Escudo centralizado sobre a estrela. */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="https://imagens.cruzeiro.com.br/Escudos/Cruzeiro.png"
                      alt="Cruzeiro"
                      className="w-25 h-25 "
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                {/* Estrelas decorativas orbitando o bloco central. */}
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

              {/* Bloco de titulo, slogan e estrelas de destaque. */}
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-cruzeiro-blue tracking-tighter">CRUZEIRO</h2>
                <p className="text-slate-500 font-medium">O TIME DO POVO</p>
                {/* Linha de estrelas abaixo do slogan. */}
                <div className="flex justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#005BAE" className="text-cruzeiro-blue" />
                  ))}
                </div>
              </div>

              {/* Botao principal para iniciar uma nova partida. */}
              <button
                onClick={beginNewGame}
                className="w-full py-6 neo-button flex items-center justify-center gap-3 text-xl font-bold text-cruzeiro-blue"
              >
                <Play fill="currentColor" size={24} />
                COMEÇAR
              </button>

              {/* Cards com os indicadores rapidos do menu inicial. */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="neo-raised p-4 rounded-3xl flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recorde</span>
                  <span className="text-xl font-bold text-slate-700">{stats.highScore}</span>
                </div>
                <div className="neo-raised p-4 rounded-3xl flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nível</span>
                  <span className="text-xl font-bold text-slate-700">{level + 1}</span>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'start' && activeTab === 'ranking' && <RankingTab />}

          {gameState === 'start' && activeTab === 'store' && <StoreTab />}

          {gameState === 'playing' && (
            // Tela ativa da partida.
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div className="grid w-full grid-cols-3 gap-5">
                <div className="neo-raised rounded-[2rem] bg-white/84 p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Rodada</span>
                  <p className="mt-2 text-3xl font-black text-slate-800">{level + 1}</p>
                </div>
                <div className="neo-raised rounded-[2rem] bg-white/84 p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Pontuação</span>
                  <p className="mt-2 text-3xl font-black text-cruzeiro-blue">{score}</p>
                </div>
              <div className="w-full neo-raised rounded-[2rem] border border-white/40 bg-white/84 p-3 backdrop-blur-md flex grid grid-cols-1 gap-4">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Tentativas</span>
                  <div className="mt-4 flex justify-center gap-3">
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => {
                      const isActive = index < attemptsLeft;
                      return (
                        <div
                          key={index}
                          className={`flex h-12 w-12 items-center justify-center rounded-full  ${
                            isActive ? ' text-red-500' :'bg-slate-100 text-slate-300'
                          }`}
                        >
                          <Heart size={20} fill={isActive ? 'currentColor' : 'none'} />
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>




              </div>

              <div className="w-full neo-raised rounded-[2rem] border border-white/40 bg-white/84 p-5 backdrop-blur-md">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Como jogar</span>
                  <h3 className="mt-2 text-xl font-black text-slate-800">Pare o marcador no centro azul</h3>
                  <p className="mt-2 text-sm text-slate-500">Se errar, você perde uma vida. Ao acertar, avança para a próxima rodada.</p>
                </div>

                <div className="mt-5 w-full h-20 neo-inset rounded-2xl relative overflow-hidden flex items-center px-2">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.02)_20%,rgba(15,23,42,0.04)_40%,rgba(15,23,42,0.02)_60%,rgba(15,23,42,0.04)_80%,rgba(15,23,42,0.02)_100%)]" />
                  <div
                    className="absolute top-0 bottom-0 bg-cruzeiro-blue/10 border-x-2 border-cruzeiro-blue/20"
                    style={{
                      left: `${50 - currentLevelConfig.targetWidth / 2}%`,
                      width: `${currentLevelConfig.targetWidth}%`
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 bg-cruzeiro-blue/25"
                    style={{
                      left: `${50 - currentLevelConfig.targetWidth / 4}%`,
                      width: `${currentLevelConfig.targetWidth / 2}%`
                    }}
                  />
                  <motion.div
                    className={`absolute z-10 h-12 w-12 rounded-full blur-md ${
                      insidePerfectZone ? 'bg-emerald-400/30' : insideGoodZone ? 'bg-sky-400/25' : 'bg-slate-400/20'
                    }`}
                    style={{ left: `${timing}%`, transform: 'translateX(-50%)' }}
                    animate={{ scale: [0.95, 1.1, 0.95] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                  <motion.div
                    className={`absolute z-20 h-14 w-5 rounded-full shadow-lg ${
                      insidePerfectZone ? 'bg-emerald-500' : insideGoodZone ? 'bg-cruzeiro-blue' : 'bg-slate-600'
                    }`}
                    style={{ left: `${timing}%`, transform: 'translateX(-50%)' }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Inicio</span>
                  <span>Centro</span>
                  <span>Fim</span>
                </div>


              </div>

              <button
                onClick={handleKick}
                className="w-40 h-40 rounded-full neo-button flex flex-col items-center justify-center gap-3"
              >
                <div className="w-20 h-20 rounded-full bg-cruzeiro-blue flex items-center justify-center text-white shadow-xl">
                  <Play fill="currentColor" size={32} className="ml-1" />
                </div>
                <span className="font-bold text-base text-cruzeiro-blue tracking-[0.28em]">CHUTAR</span>
              </button>
            </motion.div>
          )}

          {gameState === 'result' && (
            // Tela de resultado apos a rodada.
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
                     'FIM DE JOGO'}
                  </h3>
                  <p className="text-slate-500 font-medium">
                    {result === 'perfect' ? 'Você acertou em cheio e ganhou 100 pontos.' :
                     result === 'good' ? 'Boa jogada! Você ganhou 50 pontos.' :
                     'Suas três tentativas desta rodada acabaram.'}
                  </p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 pt-4">
                  <div className="neo-inset p-4 rounded-2xl">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Score</span>
                    <span className="text-xl font-bold text-slate-700">{score}</span>
                  </div>
                  <div className="neo-inset p-4 rounded-2xl">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      {result === 'miss' ? 'Rodada alcançada' : 'Próxima rodada'}
                    </span>
                    <span className="text-xl font-bold text-slate-700">{level + 1}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={() => result === 'miss' ? beginNewGame() : startRound(level, score)}
                  className="w-full py-6 neo-button flex items-center justify-center gap-3 text-xl font-bold text-cruzeiro-blue"
                >
                  <RefreshCw size={24} />
                  {result === 'miss' ? 'JOGAR DE NOVO' : 'PRÓXIMA RODADA'}
                </button>
                <button
                  onClick={goToMenu}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  VOLTAR AO MENU
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navegacao inferior visivel em toda a pagina. */}
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
}

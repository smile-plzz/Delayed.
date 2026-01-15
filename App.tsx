
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, History, AlertTriangle, Send, X, ShieldAlert, Timer, Zap, Scale, Activity, Info, EyeOff, Ghost, RefreshCw } from 'lucide-react';
import { Artifact, ArtifactType, ArchiveEntry, UserSystemState, EmotionTag } from './types';
import { BASE_DELAYS_MS, RULES, CANCEL_PHRASE, CANCEL_HOLD_DURATION_MS, EMOTION_TAXES_MS } from './constants';

const App: React.FC = () => {
  // --- Core State ---
  const [input, setInput] = useState('');
  const [artifactType, setArtifactType] = useState<ArtifactType>('message');
  const [backspaces, setBackspaces] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [queue, setQueue] = useState<Artifact[]>([]);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  
  // --- System State ---
  const [systemState, setSystemState] = useState<UserSystemState>({
    dailyCancelsUsed: 0,
    lastCancelDate: new Date().toDateString(),
    weeklyOverridesUsed: 0,
    regretDebtMultiplier: 1.0,
    karma: 100,
    totalArtifacts: 0,
  });

  // --- UI State ---
  const [isCritical, setIsCritical] = useState(false);
  const [justification, setJustification] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingArtifactId, setCancellingArtifactId] = useState<string | null>(null);
  const [cancelTypedPhrase, setCancelTypedPhrase] = useState('');
  const [cancelProgress, setCancelProgress] = useState(0);
  const [echoArtifact, setEchoArtifact] = useState<ArchiveEntry | null>(null);
  const cancelHoldInterval = useRef<number | null>(null);

  // Fix: handleInput function missing at line 328
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!startTime) setStartTime(Date.now());
    setInput(e.target.value);
  };

  // Fix: handleKeyDown function missing at line 329 to track backspaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      setBackspaces(prev => prev + 1);
    }
  };

  // --- Audio Context for "Mechanical Feedback" ---
  const playTick = () => {
    // Subtle deterministic sound simulation would go here if browser allowed
  };

  // --- Logic Helpers ---
  const detectEmotion = (text: string): EmotionTag => {
    const angerWords = ['hate', 'mad', 'angry', 'never', 'worst', 'stupid', 'kill', 'shut'];
    const excitementWords = ['love', 'wow', 'great', 'yes', 'amazing', 'happy', 'cool', 'omg'];
    const sorrowWords = ['sorry', 'sad', 'gone', 'miss', 'cry', 'hurt', 'pain', 'lonely'];
    
    const lower = text.toLowerCase();
    if (angerWords.some(w => lower.includes(w))) return 'anger';
    if (excitementWords.some(w => lower.includes(w))) return 'excitement';
    if (sorrowWords.some(w => lower.includes(w))) return 'sorrow';
    return 'neutral';
  };

  // --- Clocks & Persistence ---
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = localStorage.getItem('delayed_queue_v4');
    const a = localStorage.getItem('delayed_archive_v4');
    const s = localStorage.getItem('delayed_system_v4');
    if (q) setQueue(JSON.parse(q));
    if (a) setArchive(JSON.parse(a));
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.lastCancelDate !== new Date().toDateString()) {
        parsed.dailyCancelsUsed = 0;
        parsed.lastCancelDate = new Date().toDateString();
      }
      setSystemState(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('delayed_queue_v4', JSON.stringify(queue));
    localStorage.setItem('delayed_archive_v4', JSON.stringify(archive));
    localStorage.setItem('delayed_system_v4', JSON.stringify(systemState));
  }, [queue, archive, systemState]);

  // --- Echo System (Reminders of Almosts) ---
  useEffect(() => {
    if (archive.length > 0 && !echoArtifact && Math.random() < 0.001) {
      const randomItem = archive[Math.floor(Math.random() * archive.length)];
      setEchoArtifact(randomItem);
    }
  }, [now, archive, echoArtifact]);

  // --- Execution Monitor ---
  useEffect(() => {
    const ready = queue.filter(a => a.scheduledAt <= now);
    if (ready.length > 0) {
      setArchive(prev => [
        ...prev,
        ...ready.map(r => ({ ...r, status: 'released' as const, finalizedAt: now }))
      ]);
      setQueue(prev => prev.filter(a => a.scheduledAt > now));
    }
  }, [now, queue]);

  // --- Logic Engine ---
  const emotion = useMemo(() => detectEmotion(input), [input]);
  
  const stats = useMemo(() => {
    const hour = new Date().getHours();
    const isNightMode = hour >= 0 && hour < 5;
    const words = input.trim().split(/\s+/).length;
    const minutes = startTime ? (Date.now() - startTime) / 60000 : 0.001;
    const wpm = Math.round(words / minutes);
    const caps = (input.match(/[A-Z]/g) || []).length;
    const capsRatio = input.length > 0 ? caps / input.length : 0;
    const punctuationBursts = (input.match(/[!?]{3,}/g) || []).length;
    const lengthPenalty = input.length > RULES.LENGTH_THRESHOLD;

    let delay = BASE_DELAYS_MS[artifactType] || 3600000;
    
    // Emotion Tax
    delay += EMOTION_TAXES_MS[emotion];

    // Basic Rules
    if (wpm > RULES.WPM_THRESHOLD) delay += RULES.WPM_PENALTY_MS;
    if (backspaces > RULES.BACKSPACE_THRESHOLD) delay *= RULES.BACKSPACE_MULTIPLIER;
    if (capsRatio > RULES.CAPS_RATIO_THRESHOLD) delay *= RULES.CAPS_MULTIPLIER;
    if (isNightMode) delay *= RULES.NIGHT_MODE_MULTIPLIER;
    if (lengthPenalty) delay += RULES.LENGTH_PENALTY_MS;
    delay += punctuationBursts * RULES.PUNCTUATION_PENALTY_MS;

    // Debt & Karma
    delay *= systemState.regretDebtMultiplier;
    const karmaFactor = 1 + (100 - systemState.karma) / 100;
    delay *= karmaFactor;

    if (isCritical) {
      delay = Math.max(RULES.CRITICAL_MIN_DELAY_MS, delay * 0.1);
    }

    const volatility = (wpm / 200) + (capsRatio * 2) + (punctuationBursts * 0.5);

    return { wpm, capsRatio, isNightMode, punctuationBursts, lengthPenalty, delay, volatility };
  }, [input, artifactType, backspaces, startTime, systemState, isCritical, emotion]);

  const queueArtifact = () => {
    if (!input.trim()) return;
    if (isCritical && justification.length < RULES.CRITICAL_JUSTIFICATION_MIN) return;

    const isPhantom = Math.random() < RULES.PHANTOM_CHANCE;

    const newArt: Artifact = {
      id: Math.random().toString(36).substr(2, 9),
      type: artifactType,
      content: input,
      createdAt: Date.now(),
      scheduledAt: Date.now() + stats.delay,
      originalDelay: stats.delay,
      isCritical,
      justification: isCritical ? justification : undefined,
      isReluctant: false,
      isPhantom,
      emotionTag: emotion,
      volatilityScore: stats.volatility,
      stats: { ...stats },
      status: 'pending'
    };

    setQueue(prev => [newArt, ...prev]);
    setSystemState(prev => ({ ...prev, totalArtifacts: prev.totalArtifacts + 1 }));
    setInput('');
    setBackspaces(0);
    setStartTime(null);
    setIsCritical(false);
    setJustification('');
  };

  const startCancelHold = () => {
    setCancelProgress(0);
    cancelHoldInterval.current = window.setInterval(() => {
      setCancelProgress(prev => {
        if (prev >= 100) {
          window.clearInterval(cancelHoldInterval.current!);
          return 100;
        }
        return prev + 1;
      });
    }, 100);
  };

  const stopCancelHold = () => {
    if (cancelHoldInterval.current) {
      window.clearInterval(cancelHoldInterval.current);
      if (cancelProgress < 100) setCancelProgress(0);
    }
  };

  const executeCancellation = () => {
    if (cancelProgress < 100 || cancelTypedPhrase !== CANCEL_PHRASE) return;
    const art = queue.find(a => a.id === cancellingArtifactId);
    if (art) {
      setArchive(prev => [{ ...art, status: 'cancelled', finalizedAt: Date.now() }, ...prev]);
      setQueue(prev => prev.filter(a => a.id !== cancellingArtifactId));
      
      setSystemState(prev => {
        const used = prev.dailyCancelsUsed + 1;
        const multiplier = used > RULES.DAILY_CANCEL_LIMIT 
          ? prev.regretDebtMultiplier + RULES.REGRET_DEBT_INCREMENT 
          : prev.regretDebtMultiplier;
        return {
          ...prev,
          dailyCancelsUsed: used,
          regretDebtMultiplier: parseFloat(multiplier.toFixed(2)),
          karma: Math.max(0, prev.karma - 5)
        };
      });
    }
    closeCancelModal();
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancellingArtifactId(null);
    setCancelTypedPhrase('');
    setCancelProgress(0);
    if (cancelHoldInterval.current) window.clearInterval(cancelHoldInterval.current);
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}D ${h % 24}H ${m % 60}M`;
    return `${h}H ${m % 60}M ${s % 60}S`;
  };

  const isGlitching = systemState.regretDebtMultiplier >= RULES.GLITCH_DEBT_THRESHOLD;

  return (
    <div className={`min-h-screen bg-black text-white p-6 md:p-12 max-w-7xl mx-auto flex flex-col gap-12 selection:bg-white selection:text-black font-mono transition-all duration-1000 ${stats.isNightMode ? 'opacity-80' : 'opacity-100'}`}>
      
      {/* Glitch Overlay if debt too high */}
      {isGlitching && (
        <div className="fixed inset-0 pointer-events-none z-50 mix-blend-difference opacity-10 animate-pulse bg-zinc-900" />
      )}

      {/* Echo Feedback Overlay */}
      {echoArtifact && (
        <div className="fixed top-8 right-8 z-40 max-w-xs p-6 bg-zinc-900 border-2 border-white/20 shadow-2xl animate-in slide-in-from-right fade-in">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin-slow" /> Temporal Echo
            </span>
            <button onClick={() => setEchoArtifact(null)}><X className="w-4 h-4 text-zinc-700 hover:text-white" /></button>
          </div>
          <p className="text-xs text-zinc-400 italic mb-4 leading-relaxed">
            "You almost committed to this {formatDuration(Date.now() - echoArtifact.createdAt)} ago."
          </p>
          <div className="text-[9px] font-bold text-zinc-700 bg-black/50 p-2 truncate">
            {echoArtifact.content}
          </div>
        </div>
      )}

      {/* Header System Status */}
      <header className="border-b-4 border-white pb-8 flex flex-col lg:row justify-between items-start lg:items-end gap-8 relative overflow-hidden">
        {isGlitching && <div className="absolute inset-0 bg-white/5 animate-glitch-h" />}
        <div>
          <h1 className={`text-7xl font-black tracking-tighter leading-none ${isGlitching ? 'animate-glitch-text' : ''}`}>DELAYED.</h1>
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] uppercase font-bold text-zinc-500">Karma: </span>
              <span className={`text-xs font-black ${systemState.karma < 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {systemState.karma}% Zen
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] uppercase font-bold text-zinc-500">Debt: </span>
              <span className="text-xs font-black text-white">
                {systemState.regretDebtMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto flex items-end gap-12">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mb-1">Volatilty Index</div>
            <div className={`text-5xl font-black tabular-nums ${stats.volatility > 2 ? 'text-rose-600' : 'text-zinc-400'}`}>
              {stats.volatility.toFixed(1)}
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Input Pipeline */}
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-8">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(BASE_DELAYS_MS) as ArtifactType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setArtifactType(type)}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${artifactType === type ? 'bg-white text-black border-white' : 'border-zinc-900 text-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute -top-3 left-8 px-4 bg-black text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 z-10 border border-zinc-900">
                Impulse Capture
              </div>
              
              {/* Heat Meter Indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-zinc-900 overflow-hidden">
                <div 
                  className={`w-full transition-all duration-1000 ${emotion === 'anger' ? 'bg-rose-600' : emotion === 'sorrow' ? 'bg-blue-600' : emotion === 'excitement' ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  style={{ height: `${Math.min(100, (stats.volatility * 20))}%`, marginTop: 'auto' }}
                />
              </div>

              <textarea
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="The quieter you become, the more you can hear."
                className={`w-full h-80 bg-black border-2 border-zinc-900 p-10 text-xl font-bold outline-none focus:border-white transition-all resize-none placeholder-zinc-900 leading-tight ${isGlitching ? 'font-mono tracking-widest' : ''}`}
              />
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1">
                     <span className="text-[10px] uppercase font-black text-zinc-700">Taxed Emotion:</span>
                     <span className={`text-[10px] uppercase font-black ${emotion !== 'neutral' ? 'text-white' : 'text-zinc-800'}`}>{emotion}</span>
                   </div>
                </div>
                {stats.lengthPenalty && <span className="text-[9px] font-black text-rose-900 uppercase">Warning: Verbosity Penalty</span>}
              </div>

              {isCritical && (
                <div className="mt-4 p-8 bg-rose-950/10 border-2 border-rose-900/50 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3 text-rose-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Emergency Override Active</span>
                  </div>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder={`Justify this urgency (min ${RULES.CRITICAL_JUSTIFICATION_MIN} chars)...`}
                    className="w-full h-32 bg-transparent border border-rose-900/30 p-4 text-sm outline-none focus:border-rose-500 transition-all resize-none text-rose-100 placeholder-rose-900"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-zinc-900 border border-zinc-900">
              {[
                { label: 'Heat Index', val: `${stats.wpm} WPM`, alert: stats.wpm > RULES.WPM_THRESHOLD },
                { label: 'Indecision', val: backspaces, alert: backspaces > RULES.BACKSPACE_THRESHOLD },
                { label: 'Intensity', val: `${(stats.capsRatio * 100).toFixed(0)}%`, alert: stats.capsRatio > RULES.CAPS_RATIO_THRESHOLD },
                { label: 'Temporal Mod', val: stats.isNightMode ? 'Night' : 'Day', alert: stats.isNightMode },
                { label: 'Impulse Tax', val: EMOTION_TAXES_MS[emotion] > 0 ? `+${Math.round(EMOTION_TAXES_MS[emotion] / 3600000)}H` : 'None', alert: emotion !== 'neutral' },
              ].map((s, i) => (
                <div key={i} className={`p-4 bg-black group hover:bg-zinc-950 transition-colors`}>
                  <div className="text-[8px] font-black uppercase text-zinc-700 mb-2 group-hover:text-zinc-500">{s.label}</div>
                  <div className={`text-xs font-black tracking-widest ${s.alert ? 'text-rose-500' : 'text-white'}`}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <button
                onClick={queueArtifact}
                disabled={!input.trim() || (isCritical && justification.length < RULES.CRITICAL_JUSTIFICATION_MIN)}
                className="flex-[3] py-8 bg-white text-black font-black uppercase tracking-[0.5em] text-2xl hover:bg-zinc-200 transition-all disabled:bg-zinc-950 disabled:text-zinc-800 disabled:cursor-not-allowed border-4 border-white relative overflow-hidden"
              >
                Fossilize ({formatDuration(stats.delay)})
                {stats.volatility > 3 && <div className="absolute inset-0 bg-rose-600/10 pointer-events-none" />}
              </button>
              <button
                onClick={() => setIsCritical(!isCritical)}
                className={`flex-1 py-8 font-black uppercase tracking-widest text-sm border-4 transition-all ${isCritical ? 'bg-rose-600 text-white border-rose-600' : 'bg-transparent border-zinc-900 text-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}`}
              >
                Critical
              </button>
            </div>
          </section>
        </div>

        {/* Fossilization Feed */}
        <div className="lg:col-span-5 space-y-12">
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600 flex items-center gap-4">
              <Timer className="w-5 h-5" /> The Cooling Zone
            </h2>
            
            <div className="space-y-6">
              {queue.length === 0 && (
                <div className="py-32 border-4 border-dashed border-zinc-950 text-center group">
                  <span className="text-zinc-800 text-[10px] uppercase font-black tracking-[0.5em] group-hover:text-zinc-500 transition-colors">Impulse-free zone detected.</span>
                </div>
              )}
              {queue.map(item => (
                <div key={item.id} className={`border-2 border-zinc-900 p-8 space-y-6 bg-zinc-950/20 group relative overflow-hidden transition-all hover:border-zinc-700 ${item.isPhantom ? 'cursor-help' : ''}`}>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                        {item.type} artifact {item.isPhantom && <Ghost className="w-3 h-3 text-zinc-800" />}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-800">{item.id}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setCancellingArtifactId(item.id);
                        setIsCancelModalOpen(true);
                      }}
                      className="text-zinc-800 hover:text-rose-500 transition-colors p-2 -m-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative">
                    <p className={`text-sm text-zinc-600 italic leading-snug fossilized select-none transition-all duration-1000 ${item.emotionTag === 'anger' ? 'text-rose-900' : ''}`}>
                      "{item.content.length > 120 ? item.content.substring(0, 120) + '...' : item.content}"
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-[8px] uppercase font-black text-zinc-800 border border-zinc-900 px-2 py-0.5">{item.emotionTag}</span>
                      {item.isPhantom && <span className="text-[8px] uppercase font-black text-zinc-800 border border-zinc-900 px-2 py-0.5">Phantom Active</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end relative z-10 pt-4 border-t border-zinc-900/50">
                    <div>
                      <div className="text-[9px] font-black uppercase text-zinc-700 tracking-tighter">Cooling...</div>
                      <div className={`text-3xl font-black tabular-nums ticker tracking-tighter leading-none mt-1 ${item.isCritical ? 'text-rose-500' : ''}`}>
                        {formatDuration(Math.max(0, item.scheduledAt - now))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 h-[2px] bg-zinc-900 w-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-700 transition-all duration-1000"
                      style={{ width: `${100 - (Math.max(0, item.scheduledAt - now) / item.originalDelay * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline of Almosts (Simplified List) */}
          <section className="space-y-8 pt-16 border-t-2 border-zinc-950">
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700 flex items-center gap-4">
              <History className="w-5 h-5" /> Artifact History
            </h2>
            <div className="space-y-px bg-zinc-950">
              {archive.slice(0, 20).map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-black hover:bg-zinc-900/40 transition-all group border-b border-zinc-950">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-zinc-800 uppercase tracking-tighter">{item.type}</span>
                      <span className={`text-[7px] font-black uppercase px-1 ${item.status === 'released' ? 'text-emerald-900 border border-emerald-900' : 'text-rose-900 border border-rose-900'}`}>{item.status}</span>
                      {item.isPhantom && <EyeOff className="w-2 h-2 text-zinc-800" />}
                    </div>
                    <span className="text-[11px] text-zinc-600 truncate max-w-[200px] font-medium leading-none mt-2">{item.content}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-zinc-800 uppercase">{new Date(item.finalizedAt).toLocaleDateString()}</div>
                    <div className="text-[8px] font-bold text-zinc-700">{item.emotionTag}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
          <div className="max-w-3xl w-full border-8 border-white p-12 lg:p-20 space-y-16 bg-black relative">
            <div className="space-y-6 text-center">
              <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">The Regret Gateway</h3>
              <p className="text-xs text-zinc-600 uppercase tracking-[0.5em] max-w-lg mx-auto leading-relaxed">
                Deleting an impulse costs Zen. The system remembers what you almost did.
              </p>
            </div>

            <div className="p-8 bg-zinc-950/50 border border-zinc-900 text-sm font-bold italic text-zinc-400 leading-relaxed text-center">
              "{queue.find(a => a.id === cancellingArtifactId)?.content}"
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <input 
                  autoFocus
                  value={cancelTypedPhrase}
                  onChange={(e) => setCancelTypedPhrase(e.target.value)}
                  placeholder={CANCEL_PHRASE}
                  className="w-full bg-transparent border-b-4 border-zinc-900 py-6 text-2xl font-black uppercase outline-none focus:border-white transition-all placeholder:text-zinc-950 text-center tracking-tighter"
                />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onMouseDown={startCancelHold}
                  onMouseUp={stopCancelHold}
                  onMouseLeave={stopCancelHold}
                  onClick={executeCancellation}
                  disabled={cancelTypedPhrase !== CANCEL_PHRASE}
                  className={`py-10 font-black uppercase tracking-[0.4em] text-xl transition-all relative overflow-hidden ${cancelTypedPhrase === CANCEL_PHRASE ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer' : 'bg-zinc-950 text-zinc-900 cursor-not-allowed'}`}
                >
                  <span className="relative z-10">{cancelProgress >= 100 ? 'Confirm Avoidance' : 'Hold 10s to Purge'}</span>
                  <div 
                    className="absolute inset-0 bg-zinc-400/20 transition-all duration-100 ease-linear pointer-events-none"
                    style={{ width: `${cancelProgress}%` }}
                  />
                </button>
                <button onClick={closeCancelModal} className="text-[10px] font-black uppercase text-zinc-700 hover:text-white transition-colors">
                  Nevermind, I'll wait.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-20 border-t-2 border-zinc-950 text-center opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex justify-center gap-12 mb-8">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3 text-zinc-700" />
            <span className="text-[8px] font-black uppercase text-zinc-800">Impulse costs {EMOTION_TAXES_MS['anger'] / 3600000}H of your future life.</span>
          </div>
          <div className="flex items-center gap-2">
            <Ghost className="w-3 h-3 text-zinc-700" />
            <span className="text-[8px] font-black uppercase text-zinc-800">Some artifacts are released but never heard.</span>
          </div>
        </div>
        <div className={`text-[10px] font-black uppercase tracking-[1em] text-zinc-800 ${isGlitching ? 'animate-pulse' : ''}`}>
          You are becoming quieter.
        </div>
      </footer>
    </div>
  );
};

export default App;

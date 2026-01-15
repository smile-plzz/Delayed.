
export type ArtifactType = 'message' | 'decision' | 'request' | 'confession' | 'apology' | 'complaint' | 'yes' | 'no';

export type EmotionTag = 'anger' | 'excitement' | 'sorrow' | 'neutral';

export interface Artifact {
  id: string;
  type: ArtifactType;
  content: string;
  createdAt: number;
  scheduledAt: number;
  originalDelay: number;
  isCritical: boolean;
  justification?: string;
  isReluctant: boolean;
  isPhantom: boolean; // Appears sent but isn't
  emotionTag: EmotionTag;
  volatilityScore: number;
  stats: {
    wpm: number;
    backspaces: number;
    capsRatio: number;
    isNightMode: boolean;
    punctuationBursts: number;
    lengthPenalty: boolean;
  };
  status: 'pending' | 'released' | 'cancelled';
}

export interface ArchiveEntry extends Artifact {
  finalizedAt: number;
  cancelReason?: string;
}

export interface UserSystemState {
  dailyCancelsUsed: number;
  lastCancelDate: string;
  weeklyOverridesUsed: number;
  regretDebtMultiplier: number;
  karma: number; // 0 to 100, 100 is "Zen", 0 is "Impulse Chaos"
  totalArtifacts: number;
  lastEchoAt?: number;
}

// Fix for Error in file components/AgentDebate.tsx: Add missing AgentMessage type
export interface AgentMessage {
  agent: 'rationalist' | 'stoic' | 'emotionalist' | 'hedonist';
  text: string;
}

// Fix for Error in file components/FutureSimulator.tsx: Add missing SimulationData type
export interface SimulationData {
  time: string;
  energy: number;
  regret: number;
  autonomy: number;
}

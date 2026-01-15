
import React from 'react';
import { Brain, Heart, Shield, Zap } from 'lucide-react';

export const BASE_DELAYS_MS: Record<string, number> = {
  'message': 3 * 60 * 60 * 1000,
  'decision': 24 * 60 * 60 * 1000,
  'request': 12 * 60 * 60 * 1000,
  'confession': 48 * 60 * 60 * 1000,
  'apology': 48 * 60 * 60 * 1000,
  'complaint': 72 * 60 * 60 * 1000,
  'yes': 12 * 60 * 60 * 1000,
  'no': 6 * 60 * 60 * 1000,
};

export const EMOTION_TAXES_MS: Record<string, number> = {
  'anger': 24 * 60 * 60 * 1000,
  'excitement': 12 * 60 * 60 * 1000,
  'sorrow': 36 * 60 * 60 * 1000,
  'neutral': 0,
};

export const RULES = {
  WPM_THRESHOLD: 120,
  WPM_PENALTY_MS: 8 * 60 * 60 * 1000,
  BACKSPACE_MULTIPLIER: 1.5,
  BACKSPACE_THRESHOLD: 15,
  CAPS_RATIO_THRESHOLD: 0.3,
  CAPS_MULTIPLIER: 2,
  NIGHT_MODE_MULTIPLIER: 2,
  PUNCTUATION_PENALTY_MS: 6 * 60 * 60 * 1000,
  LENGTH_THRESHOLD: 300,
  LENGTH_PENALTY_MS: 12 * 60 * 60 * 1000,
  
  DAILY_CANCEL_LIMIT: 2,
  WEEKLY_OVERRIDE_LIMIT: 1,
  REGRET_DEBT_INCREMENT: 0.2,
  CRITICAL_MIN_DELAY_MS: 30 * 60 * 1000,
  CRITICAL_JUSTIFICATION_MIN: 200,

  PHANTOM_CHANCE: 0.05, // 5% chance of phantom artifact
  GLITCH_DEBT_THRESHOLD: 2.0, // Multiplier where UI starts glitching
};

export const CANCEL_PHRASE = "I still don’t want this";
export const CANCEL_HOLD_DURATION_MS = 10000;

export const AGENT_CONFIGS: Record<string, { borderColor: string, bgColor: string, color: string, icon: React.ReactNode }> = {
  rationalist: {
    borderColor: 'border-blue-900/50',
    bgColor: 'bg-blue-950/20',
    color: 'text-blue-400',
    icon: <Brain className="w-4 h-4" />
  },
  stoic: {
    borderColor: 'border-zinc-700',
    bgColor: 'bg-zinc-900/40',
    color: 'text-zinc-400',
    icon: <Shield className="w-4 h-4" />
  },
  emotionalist: {
    borderColor: 'border-rose-900/50',
    bgColor: 'bg-rose-950/20',
    color: 'text-rose-400',
    icon: <Heart className="w-4 h-4" />
  },
  hedonist: {
    borderColor: 'border-amber-900/50',
    bgColor: 'bg-amber-950/20',
    color: 'text-amber-400',
    icon: <Zap className="w-4 h-4" />
  }
};

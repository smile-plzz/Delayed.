
import React from 'react';
import { AgentMessage } from '../types';
import { AGENT_CONFIGS } from '../constants';

interface Props {
  messages: AgentMessage[];
}

const AgentDebate: React.FC<Props> = ({ messages }) => {
  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-1">Internal Debate Chamber</h3>
      {messages.map((msg, i) => {
        const config = AGENT_CONFIGS[msg.agent];
        return (
          <div 
            key={i} 
            className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all duration-500 animate-in fade-in slide-in-from-bottom-2`}
            style={{ animationDelay: `${i * 300}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              {config.icon}
              <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{msg.agent}</span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed italic">
              "{msg.text}"
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AgentDebate;

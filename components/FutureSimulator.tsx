
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SimulationData } from '../types';

interface Props {
  data: SimulationData[];
}

const FutureSimulator: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-[300px] w-full bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Future Self Probability Matrix</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <XAxis 
            dataKey="time" 
            stroke="#444" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="energy" 
            stroke="#c084fc" 
            strokeWidth={2} 
            dot={false} 
            name="Potential Energy"
          />
          <Line 
            type="monotone" 
            dataKey="regret" 
            stroke="#fb7185" 
            strokeWidth={2} 
            dot={false} 
            name="Projected Regret"
          />
          <Line 
            type="monotone" 
            dataKey="autonomy" 
            stroke="#818cf8" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false} 
            name="Algorithmic Autonomy"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-4 text-[10px] text-zinc-600 uppercase text-center tracking-widest">
        Data suggests 84% deviation if interventions are ignored.
      </p>
    </div>
  );
};

export default FutureSimulator;

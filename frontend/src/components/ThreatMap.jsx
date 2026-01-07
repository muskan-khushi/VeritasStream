import React from 'react';
import { motion } from 'framer-motion';

const ThreatMap = ({ active }) => {
  // Random dots representing "Servers"
  const nodes = [
    { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 80, y: 35 }, // North America
    { x: 45, y: 60 }, { x: 55, y: 75 },                   // South America
    { x: 110, y: 25 }, { x: 120, y: 40 },                 // Europe
    { x: 150, y: 30 }, { x: 170, y: 50 },                 // Asia
    { x: 130, y: 60 },                                    // Africa
    { x: 180, y: 80 },                                    // Australia
  ];

  return (
    <div className="relative w-full h-full opacity-60">
      <svg viewBox="0 0 200 100" className="w-full h-full fill-slate-800 stroke-slate-700">
        {/* Abstract World Map Outline */}
        <path d="M20,30 Q50,-10 80,30 T140,30 T180,80" fill="none" strokeWidth="0.5" className="opacity-30" />
        
        {/* Connection Lines */}
        {nodes.map((node, i) => (
           nodes.map((target, j) => {
             if (i < j && Math.random() > 0.8) {
               return (
                 <motion.line 
                   key={`${i}-${j}`}
                   x1={node.x} y1={node.y} x2={target.x} y2={target.y}
                   stroke={active ? "#06b6d4" : "#334155"} 
                   strokeWidth="0.2"
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: active ? 0.4 : 0.1 }}
                   transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                 />
               )
             }
             return null;
           })
        ))}

        {/* Server Nodes */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r="1.5" className={active ? "fill-cyan-500" : "fill-slate-600"} />
            {active && (
              <motion.circle 
                cx={node.x} cy={node.y} r="1.5" 
                className="fill-none stroke-cyan-400"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() }}
              />
            )}
          </g>
        ))}
      </svg>
      
      {active && (
        <div className="absolute bottom-2 left-2 text-[8px] font-mono text-cyan-500 animate-pulse">
          LIVE THREAT TELEMETRY: ACTIVE
        </div>
      )}
    </div>
  );
};

export default ThreatMap;
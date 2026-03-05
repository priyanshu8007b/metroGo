
"use client";

import React, { useState, useRef } from "react";
import type { NetworkData, Station, RouteResult } from "@/types/network";
import { cn } from "@/lib/utils";

interface NetworkVisualizerProps {
  data: NetworkData;
  activeRoute: RouteResult | null;
  onUpdateStation: (station: Station) => void;
  onSelectStation: (id: string) => void;
  selectedStationId: string | null;
}

const LINE_COLORS: Record<string, string> = {
  Red: "#EE2E24",
  Yellow: "#FFCD05",
  Blue: "#0072BB",
  Violet: "#802F83",
  Magenta: "#8B2131",
  Pink: "#D51C5C",
  Green: "#00B050",
  Orange: "#F58220",
  Grey: "#808080",
  Aqua: "#00FFFF"
};

export default function NetworkVisualizer({
  data,
  activeRoute,
  onUpdateStation,
  onSelectStation,
  selectedStationId
}: NetworkVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    onSelectStation(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;

    const svg = svgRef.current;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    const station = data.stations.find(s => s.id === draggingId);
    if (station) {
      onUpdateStation({ ...station, x, y });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden border-r">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Regular Background Connections */}
        {data.connections.map((conn, idx) => {
          const s1 = data.stations.find(s => s.id === conn.from);
          const s2 = data.stations.find(s => s.id === conn.to);
          if (!s1 || !s2) return null;

          const lineColor = conn.line ? LINE_COLORS[conn.line] : "hsl(var(--border))";

          return (
            <g key={`reg-conn-${idx}`}>
              <line
                x1={s1.x}
                y1={s1.y}
                x2={s2.x}
                y2={s2.y}
                stroke={lineColor}
                strokeWidth={6}
                strokeOpacity={0.3}
                className="connection-line"
                style={{ strokeLinecap: 'round' }}
              />
            </g>
          );
        })}

        {/* Active Route Segments (Drawn directly from calculated path) */}
        {activeRoute && activeRoute.path.length > 1 && activeRoute.path.map((sid, idx) => {
          if (idx === activeRoute.path.length - 1) return null;
          const s1 = data.stations.find(s => s.id === sid);
          const s2 = data.stations.find(s => s.id === activeRoute.path[idx + 1]);
          if (!s1 || !s2) return null;

          return (
            <g key={`active-seg-${idx}`}>
              <line
                x1={s1.x}
                y1={s1.y}
                x2={s2.x}
                y2={s2.y}
                stroke="hsl(var(--primary))"
                strokeWidth={12}
                strokeLinecap="round"
                className="animate-pulse"
                style={{ filter: 'url(#glow)' }}
              />
            </g>
          );
        })}

        {/* Stations */}
        {data.stations.map((station) => {
          const isSelected = selectedStationId === station.id;
          const isInRoute = activeRoute?.path.includes(station.id);
          const isTerminus = activeRoute?.path[0] === station.id || activeRoute?.path[activeRoute.path.length-1] === station.id;

          return (
            <g
              key={station.id}
              className="group"
              onMouseDown={handleMouseDown(station.id)}
            >
              <circle
                cx={station.x}
                cy={station.y}
                r={isTerminus ? 16 : (station.isInterchange ? 12 : 8)}
                fill={isInRoute ? "hsl(var(--primary))" : (isSelected ? "hsl(var(--primary))" : "hsl(var(--card))")}
                stroke={station.isInterchange ? "hsl(var(--foreground))" : "hsl(var(--primary))"}
                strokeWidth={station.isInterchange ? 4 : 2}
                className={cn(
                  "station-node transition-all shadow-xl",
                  isInRoute && "animate-pulse"
                )}
                style={isInRoute ? { filter: 'url(#glow)' } : {}}
              />
              <text
                x={station.x}
                y={station.y + (isTerminus ? 38 : 34)}
                textAnchor="middle"
                className={cn(
                  "text-[12px] select-none transition-all duration-200 pointer-events-none",
                  isSelected ? "font-black fill-primary" : "font-bold fill-foreground",
                  isInRoute && "fill-primary font-black scale-110"
                )}
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

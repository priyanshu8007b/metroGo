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
  Yellow: "#FFD700",
  Blue: "#0000FF",
  Red: "#FF0000",
  Violet: "#8F00FF",
  Magenta: "#FF00FF",
  Pink: "#FFC0CB",
  Green: "#008000",
  Orange: "#FFA500"
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

  const isEdgeInRoute = (from: string, to: string) => {
    if (!activeRoute) return false;
    const path = activeRoute.path;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === from && path[i+1] === to) || (path[i] === to && path[i+1] === from)) {
        return true;
      }
    }
    return false;
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
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Regular Connections */}
        {data.connections.map((conn, idx) => {
          const s1 = data.stations.find(s => s.id === conn.from);
          const s2 = data.stations.find(s => s.id === conn.to);
          if (!s1 || !s2) return null;

          const inRoute = isEdgeInRoute(conn.from, conn.to);
          const lineColor = conn.line ? LINE_COLORS[conn.line] : "hsl(var(--border))";

          return (
            <g key={`conn-${idx}`}>
              <line
                x1={s1.x}
                y1={s1.y}
                x2={s2.x}
                y2={s2.y}
                stroke={inRoute ? "hsl(var(--accent))" : lineColor}
                strokeWidth={inRoute ? 8 : 4}
                strokeOpacity={inRoute ? 1 : 0.6}
                className="connection-line"
                style={inRoute ? { filter: 'url(#glow)', strokeWidth: 10 } : {}}
              />
              <text
                x={(s1.x + s2.x) / 2}
                y={(s1.y + s2.y) / 2 - 10}
                className="text-[10px] fill-muted-foreground select-none font-bold"
                textAnchor="middle"
              >
                {conn.weight}m
              </text>
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
                r={isTerminus ? 12 : (station.isInterchange ? 10 : 7)}
                fill={isInRoute ? "hsl(var(--accent))" : (isSelected ? "hsl(var(--primary))" : "hsl(var(--card))")}
                stroke={station.isInterchange ? "hsl(var(--foreground))" : "hsl(var(--primary))"}
                strokeWidth={station.isInterchange ? 3 : 2}
                className="station-node shadow-xl"
              />
              <text
                x={station.x}
                y={station.y + 28}
                textAnchor="middle"
                className={cn(
                  "text-[11px] select-none transition-all duration-200 pointer-events-none",
                  isSelected ? "font-black fill-primary" : "font-bold fill-foreground",
                  isInRoute && "fill-accent-foreground font-black scale-110"
                )}
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 p-3 bg-card/90 backdrop-blur-md border rounded-xl shadow-2xl">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-1 mb-1">Network Legend</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(LINE_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-[10px] font-bold">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border-t mt-1 pt-1 col-span-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent border border-accent"></div>
            <span className="text-[10px] font-black text-accent uppercase">Active Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  Train, 
  MapPin, 
  Plus, 
  Settings, 
  Sparkles, 
  Trash2, 
  Route, 
  ChevronRight,
  Clock,
  Navigation,
  Search,
  Zap,
  Info,
  RefreshCw,
  Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import type { NetworkData, Station, Connection, RouteResult } from "@/types/network";
import { getShortestPath, getMinHopsPath } from "@/lib/graph-algorithms";
import NetworkVisualizer from "@/components/NetworkVisualizer";
import { aiNetworkConstructor } from "@/ai/flows/ai-network-constructor";

const INITIAL_DATA: NetworkData = {
  stations: [
    { id: "1", name: "Rajiv Chowk", x: 500, y: 450, isInterchange: true },
    { id: "2", name: "Kashmere Gate", x: 500, y: 200, isInterchange: true },
    { id: "3", name: "New Delhi", x: 500, y: 350, isInterchange: true },
    { id: "4", name: "Central Secretariat", x: 500, y: 550, isInterchange: true },
    { id: "5", name: "Hauz Khas", x: 500, y: 750, isInterchange: true },
    { id: "6", name: "Mandi House", x: 600, y: 450, isInterchange: true },
    { id: "7", name: "Kirti Nagar", x: 300, y: 450, isInterchange: true },
    { id: "8", name: "Botanical Garden", x: 850, y: 750, isInterchange: true },
    { id: "9", name: "Yamuna Bank", x: 750, y: 450, isInterchange: true },
    { id: "10", name: "Inderlok", x: 350, y: 300, isInterchange: true },
    { id: "11", name: "Dwarka Sector 21", x: 100, y: 800, isInterchange: true },
    { id: "12", name: "Noida Electronic City", x: 950, y: 450 },
    { id: "13", name: "Millennium City Centre", x: 500, y: 950 },
    { id: "14", name: "Kalkaji Mandir", x: 750, y: 750, isInterchange: true },
    { id: "15", name: "Lajpat Nagar", x: 650, y: 650, isInterchange: true },
    { id: "16", name: "Janakpuri West", x: 200, y: 650, isInterchange: true },
    { id: "17", name: "Rajouri Garden", x: 250, y: 550, isInterchange: true },
    { id: "18", name: "Azadpur", x: 400, y: 150, isInterchange: true },
    { id: "19", name: "Welcome", x: 700, y: 200, isInterchange: true },
    { id: "20", name: "Anand Vihar", x: 900, y: 300, isInterchange: true },
  ],
  connections: [
    // Yellow Line
    { from: "18", to: "2", weight: 8, line: "Yellow" },
    { from: "2", to: "3", weight: 5, line: "Yellow" },
    { from: "3", to: "1", weight: 3, line: "Yellow" },
    { from: "1", to: "4", weight: 4, line: "Yellow" },
    { from: "4", to: "15", weight: 6, line: "Yellow" },
    { from: "15", to: "5", weight: 5, line: "Yellow" },
    { from: "5", to: "13", weight: 15, line: "Yellow" },
    
    // Blue Line
    { from: "11", to: "16", weight: 12, line: "Blue" },
    { from: "16", to: "17", weight: 8, line: "Blue" },
    { from: "17", to: "7", weight: 5, line: "Blue" },
    { from: "7", to: "1", weight: 10, line: "Blue" },
    { from: "1", to: "6", weight: 3, line: "Blue" },
    { from: "6", to: "9", weight: 8, line: "Blue" },
    { from: "9", to: "8", weight: 15, line: "Blue" },
    { from: "8", to: "12", weight: 10, line: "Blue" },
    { from: "9", to: "20", weight: 10, line: "Blue" },

    // Red Line
    { from: "10", to: "2", weight: 12, line: "Red" },
    { from: "2", to: "19", weight: 15, line: "Red" },

    // Violet Line
    { from: "2", to: "6", weight: 10, line: "Violet" },
    { from: "6", to: "4", weight: 4, line: "Violet" },
    { from: "4", to: "15", weight: 8, line: "Violet" },
    { from: "15", to: "14", weight: 10, line: "Violet" },

    // Magenta Line
    { from: "16", to: "5", weight: 20, line: "Magenta" },
    { from: "5", to: "14", weight: 12, line: "Magenta" },
    { from: "14", to: "8", weight: 8, line: "Magenta" },

    // Pink Line
    { from: "18", to: "10", weight: 10, line: "Pink" },
    { from: "10", to: "17", weight: 8, line: "Pink" },
    { from: "17", to: "15", weight: 15, line: "Pink" },
    { from: "15", to: "19", weight: 25, line: "Pink" },
    { from: "19", to: "20", weight: 5, line: "Pink" },
    
    // Green Line Approx
    { from: "10", to: "7", weight: 5, line: "Green" },
  ]
};

export default function RouteFlow() {
  const [data, setData] = useState<NetworkData>(INITIAL_DATA);
  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [optimizationType, setOptimizationType] = useState<'shortest' | 'min-hops'>('shortest');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState("");

  const activeRoute = useMemo(() => {
    if (!sourceId || !destId || sourceId === destId) return null;
    if (optimizationType === 'shortest') {
      return getShortestPath(data.stations, data.connections, sourceId, destId);
    } else {
      return getMinHopsPath(data.stations, data.connections, sourceId, destId);
    }
  }, [data, sourceId, destId, optimizationType]);

  const handleUpdateStation = useCallback((updated: Station) => {
    setData(prev => ({
      ...prev,
      stations: prev.stations.map(s => s.id === updated.id ? updated : s)
    }));
  }, []);

  const handleAddStation = (name: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newStation: Station = {
      id,
      name: name || `Station ${data.stations.length + 1}`,
      x: 400 + Math.random() * 200,
      y: 400 + Math.random() * 200,
    };
    setData(prev => ({ ...prev, stations: [...prev.stations, newStation] }));
    return id;
  };

  const handleDeleteStation = (id: string) => {
    setData(prev => ({
      stations: prev.stations.filter(s => s.id !== id),
      connections: prev.connections.filter(c => c.from !== id && c.to !== id)
    }));
    if (selectedStationId === id) setSelectedStationId(null);
    if (sourceId === id) setSourceId("");
    if (destId === id) setDestId("");
  };

  const handleAddConnection = (from: string, to: string, weight: number, line?: string) => {
    if (from === to) return;
    const exists = data.connections.find(c => (c.from === from && c.to === to) || (c.to === from && c.from === to));
    if (exists) return;
    
    setData(prev => ({
      ...prev,
      connections: [...prev.connections, { from, to, weight, line }]
    }));
  };

  const handleConstructAiNetwork = async () => {
    if (!aiDescription) return;
    setIsAiLoading(true);
    try {
      const result = await aiNetworkConstructor({ description: aiDescription });
      
      const newStations: Station[] = [];
      const newConnections: Connection[] = [];
      const stationMap = new Map<string, string>();

      const stationNames = Object.keys(result);
      stationNames.forEach((name, i) => {
        const id = (i + 1).toString();
        stationMap.set(name, id);
        
        const angle = (i / stationNames.length) * Math.PI * 2;
        newStations.push({
          id,
          name,
          x: 500 + Math.cos(angle) * 350,
          y: 500 + Math.sin(angle) * 350,
        });
      });

      const processedEdges = new Set<string>();
      stationNames.forEach(name => {
        const fromId = stationMap.get(name)!;
        result[name].forEach(conn => {
          const toId = stationMap.get(conn.station)!;
          if (toId) {
            const edgeKey = [fromId, toId].sort().join('-');
            if (!processedEdges.has(edgeKey)) {
              newConnections.push({ from: fromId, to: toId, weight: conn.time });
              processedEdges.add(edgeKey);
            }
          }
        });
      });

      setData({ stations: newStations, connections: newConnections });
      setSourceId("");
      setDestId("");
      toast({ title: "Network Generated", description: `Successfully loaded ${newStations.length} stations.` });
    } catch (e) {
      toast({ title: "AI Generation Failed", description: "Could not interpret network description.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-body overflow-hidden">
      <Toaster />
      
      {/* Sidebar Controls */}
      <div className="w-96 flex flex-col border-r bg-card z-10 shadow-xl">
        <header className="p-6 border-b flex items-center gap-3 bg-primary/5">
          <div className="bg-primary p-2 rounded-lg shadow-inner">
            <Train className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">DMRC Navigator</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Delhi Metro Rail Corp</p>
          </div>
        </header>

        <Tabs defaultValue="plan" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="plan" className="rounded-lg data-[state=active]:shadow-sm"><Route className="w-4 h-4 mr-2" /> Navigate</TabsTrigger>
            <TabsTrigger value="build" className="rounded-lg data-[state=active]:shadow-sm"><Settings className="w-4 h-4 mr-2" /> Editor</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg data-[state=active]:shadow-sm"><Sparkles className="w-4 h-4 mr-2" /> AI Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Navigation className="w-3 h-3" /> Route Preference
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={optimizationType === 'shortest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptimizationType('shortest')}
                    className="h-12 flex flex-col items-center justify-center transition-all"
                  >
                    <Clock className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">Fastest</span>
                  </Button>
                  <Button 
                    variant={optimizationType === 'min-hops' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptimizationType('min-hops')}
                    className="h-12 flex flex-col items-center justify-center transition-all"
                  >
                    <Zap className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">Fewest Stops</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-xs font-bold uppercase text-muted-foreground">Origin Station</Label>
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger id="source" className="bg-background h-11">
                      <SelectValue placeholder="Select starting point" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.stations.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dest" className="text-xs font-bold uppercase text-muted-foreground">Destination Station</Label>
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger id="dest" className="bg-background h-11">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.stations.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {activeRoute ? (
              <Card className="border-accent/30 bg-accent/5 overflow-hidden shadow-lg animate-in slide-in-from-bottom-2 duration-300">
                <CardHeader className="p-4 bg-accent/10 border-b border-accent/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="w-3 h-3 text-accent" /> Recommended Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b pb-3">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-black mb-1">Time</span>
                      <span className="text-xl font-bold text-primary flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-accent" /> {activeRoute.totalWeight}m
                      </span>
                    </div>
                    <div className="w-px h-10 bg-border mx-4"></div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-black mb-1">Stops</span>
                      <span className="text-xl font-bold text-primary flex items-center">
                        <Navigation className="w-4 h-4 mr-1 text-accent" /> {activeRoute.hops}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Topology</span>
                    <div className="space-y-1 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-accent/40 before:rounded-full">
                      {activeRoute.path.map((sid, idx) => {
                        const station = data.stations.find(s => s.id === sid);
                        return (
                          <div key={idx} className="flex items-center gap-3 relative py-1">
                            <div className={`absolute -left-[22px] w-4 h-4 rounded-full border-2 transition-all ${idx === 0 || idx === activeRoute.path.length - 1 ? 'bg-accent border-accent scale-110 shadow-sm' : 'bg-card border-accent'}`}></div>
                            <span className={`text-sm transition-colors ${idx === 0 || idx === activeRoute.path.length - 1 ? 'font-bold text-primary' : 'font-medium text-muted-foreground'}`}>
                              {station?.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : sourceId && destId && sourceId !== destId ? (
              <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive text-center space-y-3">
                <Search className="w-10 h-10 mx-auto opacity-30" />
                <div>
                  <p className="text-sm font-bold">Inaccessible</p>
                  <p className="text-xs opacity-70 mt-1 leading-relaxed">No path found between terminal points in the current topological layer.</p>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-2xl text-center space-y-4 opacity-50">
                <Info className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-widest">Select route terminals for analysis</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="build" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-xl space-y-3 bg-muted/20">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Create Station</h3>
                <div className="flex gap-2">
                  <Input id="new-station-name" placeholder="Name..." className="flex-1 h-10" />
                  <Button size="sm" className="px-4" onClick={() => {
                    const input = document.getElementById('new-station-name') as HTMLInputElement;
                    if (input.value) {
                      handleAddStation(input.value);
                      input.value = "";
                      toast({ title: "Node Added", description: "New station integrated into topological grid." });
                    }
                  }}>Add</Button>
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-3 bg-muted/20">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ChevronRight className="w-4 h-4 text-primary" /> Track Connection</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select onValueChange={(val) => (window as any)._connFrom = val}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Origin" /></SelectTrigger>
                      <SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(val) => (window as any)._connTo = val}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Target" /></SelectTrigger>
                      <SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] font-bold uppercase">Travel Time (min)</Label>
                      <Input type="number" id="conn-weight" defaultValue="5" className="h-10" />
                    </div>
                    <Button className="w-full h-10" onClick={() => {
                      const from = (window as any)._connFrom;
                      const to = (window as any)._connTo;
                      const weight = parseInt((document.getElementById('conn-weight') as HTMLInputElement).value) || 5;
                      if (from && to) {
                        handleAddConnection(from, to, weight);
                        toast({ title: "Link Defined", description: "Temporal edge established between nodes." });
                      }
                    }}>Link</Button>
                  </div>
                </div>
              </div>

              {selectedStationId && (
                <div className="p-4 border-destructive/20 bg-destructive/5 border rounded-xl space-y-3">
                   <h3 className="text-xs font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Node Removal
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground">Target: {data.stations.find(s => s.id === selectedStationId)?.name}</p>
                  <Button variant="destructive" size="sm" className="w-full h-10" onClick={() => handleDeleteStation(selectedStationId)}>
                    Remove Station
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> AI Network simulation</Label>
                <CardDescription className="text-xs leading-relaxed">
                  Provide a textual description of a metro line or network segment. The AI will reconstruct the adjacency list.
                </CardDescription>
                <Textarea 
                  placeholder="e.g. A new line connects Rajiv Chowk to Pragati Maidan in 5 mins, and then to Supreme Court in 3 mins..." 
                  className="min-h-[200px] text-xs font-code leading-relaxed bg-muted/10 border-accent/20"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />
              </div>
              <Button 
                className="w-full h-11 bg-accent hover:bg-accent/80 text-accent-foreground font-bold shadow-lg" 
                onClick={handleConstructAiNetwork} 
                disabled={isAiLoading || !aiDescription}
              >
                {isAiLoading ? "Constructing Graph..." : "Reconstruct Topo"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <footer className="p-4 border-t text-[10px] text-muted-foreground text-center font-bold uppercase tracking-tighter bg-muted/5">
          DMRC Route Intelligence Unit | v3.6.0
        </footer>
      </div>

      {/* Main Map Visualization */}
      <main className="flex-1 relative bg-background">
        <NetworkVisualizer 
          data={data}
          activeRoute={activeRoute}
          onUpdateStation={handleUpdateStation}
          onSelectStation={setSelectedStationId}
          selectedStationId={selectedStationId}
        />
        
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-none">
          <Card className="shadow-2xl border-primary/20 bg-card/90 backdrop-blur-md">
            <CardContent className="p-3 flex items-center gap-4">
              <div className="text-center px-2">
                <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nodes</span>
                <span className="text-2xl font-black font-code text-primary leading-none">{data.stations.length}</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center px-2">
                <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Edges</span>
                <span className="text-2xl font-black font-code text-primary leading-none">{data.connections.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="absolute bottom-6 right-6 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setData(INITIAL_DATA)} className="shadow-xl bg-card hover:bg-primary/5 transition-all border-primary/20 font-bold gap-2">
            <RefreshCw className="w-3 h-3" /> Reset Network
          </Button>
        </div>
      </main>
    </div>
  );
}

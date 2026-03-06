
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
  Cpu
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
import { Badge } from "@/components/ui/badge";

import type { NetworkData, Station, Connection, RouteResult } from "@/types/network";
import { getShortestPath, getMinHopsPath } from "@/lib/graph-algorithms";
import NetworkVisualizer from "@/components/NetworkVisualizer";
import { aiNetworkConstructor } from "@/ai/flows/ai-network-constructor";

const INITIAL_DATA: NetworkData = {
  stations: [
    // Yellow Line
    { id: "y1", name: "Samaypur Badli", x: 400, y: 50 },
    { id: "y2", name: "Azadpur", x: 450, y: 150, isInterchange: true },
    { id: "y3", name: "Kashmere Gate", x: 500, y: 250, isInterchange: true },
    { id: "y4", name: "New Delhi", x: 500, y: 350, isInterchange: true },
    { id: "y5", name: "Rajiv Chowk", x: 500, y: 450, isInterchange: true },
    { id: "y6", name: "Central Secretariat", x: 500, y: 550, isInterchange: true },
    { id: "y7", name: "Hauz Khas", x: 500, y: 750, isInterchange: true },
    { id: "y8", name: "Millennium City Centre", x: 500, y: 950 },

    // Blue Line
    { id: "b1", name: "Dwarka Sector 21", x: 50, y: 800, isInterchange: true },
    { id: "b2", name: "Janakpuri West", x: 200, y: 650, isInterchange: true },
    { id: "b3", name: "Rajouri Garden", x: 300, y: 550, isInterchange: true },
    { id: "b4", name: "Kirti Nagar", x: 350, y: 450, isInterchange: true },
    // Rajiv Chowk is y5
    { id: "b5", name: "Mandi House", x: 650, y: 450, isInterchange: true },
    { id: "b6", name: "Yamuna Bank", x: 750, y: 450, isInterchange: true },
    { id: "b7", name: "Mayur Vihar-I", x: 800, y: 550, isInterchange: true },
    { id: "b8", name: "Botanical Garden", x: 850, y: 750, isInterchange: true },
    { id: "b9", name: "Noida Electronic City", x: 950, y: 450 },
    { id: "b10", name: "Anand Vihar", x: 900, y: 300, isInterchange: true },

    // Red Line
    { id: "r1", name: "Rithala", x: 200, y: 150 },
    { id: "r2", name: "Netaji Subhash Place", x: 350, y: 200, isInterchange: true },
    { id: "r3", name: "Inderlok", x: 400, y: 250, isInterchange: true },
    // Kashmere Gate is y3
    { id: "r4", name: "Welcome", x: 800, y: 250, isInterchange: true },
    { id: "r5", name: "Shaheed Sthal", x: 950, y: 150 },

    // Violet Line
    // Kashmere Gate is y3
    // Mandi House is b5
    // Central Secretariat is y6
    { id: "v1", name: "Lajpat Nagar", x: 650, y: 650, isInterchange: true },
    { id: "v2", name: "Kalkaji Mandir", x: 750, y: 750, isInterchange: true },

    // Additional Interchanges for Pink/Magenta
    { id: "p1", name: "South Campus", x: 400, y: 650, isInterchange: true },
  ],
  connections: [
    // Yellow Line Segments
    { from: "y1", to: "y2", weight: 8, line: "Yellow" },
    { from: "y2", to: "y3", weight: 10, line: "Yellow" },
    { from: "y3", to: "y4", weight: 5, line: "Yellow" },
    { from: "y4", to: "y5", weight: 3, line: "Yellow" },
    { from: "y5", to: "y6", weight: 4, line: "Yellow" },
    { from: "y6", to: "y7", weight: 12, line: "Yellow" },
    { from: "y7", to: "y8", weight: 20, line: "Yellow" },

    // Blue Line Segments
    { from: "b1", to: "b2", weight: 15, line: "Blue" },
    { from: "b2", to: "b3", weight: 8, line: "Blue" },
    { from: "b3", to: "b4", weight: 5, line: "Blue" },
    { from: "b4", to: "y5", weight: 10, line: "Blue" },
    { from: "y5", to: "b5", weight: 3, line: "Blue" },
    { from: "b5", to: "b6", weight: 8, line: "Blue" },
    { from: "b6", to: "b7", weight: 8, line: "Blue" },
    { from: "b7", to: "b8", weight: 10, line: "Blue" },
    { from: "b8", to: "b9", weight: 12, line: "Blue" },
    { from: "b6", to: "b10", weight: 15, line: "Blue" },

    // Red Line Segments
    { from: "r1", to: "r2", weight: 10, line: "Red" },
    { from: "r2", to: "r3", weight: 5, line: "Red" },
    { from: "r3", to: "y3", weight: 12, line: "Red" },
    { from: "y3", to: "r4", weight: 15, line: "Red" },
    { from: "r4", to: "r5", weight: 15, line: "Red" },

    // Violet Line Segments
    { from: "y3", to: "b5", weight: 10, line: "Violet" },
    { from: "b5", to: "y6", weight: 5, line: "Violet" },
    { from: "y6", to: "v1", weight: 12, line: "Violet" },
    { from: "v1", to: "v2", weight: 8, line: "Violet" },

    // Magenta Line Segments
    { from: "b2", to: "y7", weight: 25, line: "Magenta" },
    { from: "y7", to: "v2", weight: 12, line: "Magenta" },
    { from: "v2", to: "b8", weight: 8, line: "Magenta" },

    // Pink Line Segments
    { from: "y2", to: "r2", weight: 6, line: "Pink" },
    { from: "r2", to: "b3", weight: 10, line: "Pink" },
    { from: "b3", to: "p1", weight: 12, line: "Pink" },
    { from: "p1", to: "v1", weight: 15, line: "Pink" },
    { from: "v1", to: "b7", weight: 15, line: "Pink" },
    { from: "b7", to: "b10", weight: 8, line: "Pink" },
    { from: "b10", to: "r4", weight: 10, line: "Pink" },
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

  const handleResetNetwork = useCallback(() => {
    setData({
      stations: JSON.parse(JSON.stringify(INITIAL_DATA.stations)),
      connections: JSON.parse(JSON.stringify(INITIAL_DATA.connections))
    });
    setSourceId("");
    setDestId("");
    setSelectedStationId(null);
    setOptimizationType('shortest');
    toast({ 
      title: "Network Reset", 
      description: "Map topology and selections have been restored to default DMRC configuration." 
    });
  }, []);

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
                    <span className="text-[10px] font-bold">Fastest Route</span>
                    <span className="text-[8px] opacity-50 font-code mt-0.5">Dijkstra's</span>
                  </Button>
                  <Button 
                    variant={optimizationType === 'min-hops' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptimizationType('min-hops')}
                    className="h-12 flex flex-col items-center justify-center transition-all"
                  >
                    <Zap className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">Fewest Stops</span>
                    <span className="text-[8px] opacity-50 font-code mt-0.5">BFS Algorithm</span>
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
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Navigation className="w-3 h-3 text-accent" /> Journey Summary
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] h-4 bg-background/50 border-accent/30 gap-1 uppercase">
                      <Cpu className="w-2 h-2" /> {optimizationType === 'shortest' ? 'Dijkstra' : 'BFS'} Optimized
                    </Badge>
                  </div>
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
                  
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Station Topology Flow</span>
                    <div className="space-y-2 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-accent/40 before:rounded-full">
                      {activeRoute.path.map((sid, idx) => {
                        const station = data.stations.find(s => s.id === sid);
                        return (
                          <div key={idx} className="flex items-center gap-3 relative py-0.5">
                            <div className={`absolute -left-[22px] w-4 h-4 rounded-full border-2 transition-all ${idx === 0 || idx === activeRoute.path.length - 1 ? 'bg-accent border-accent scale-110 shadow-sm' : 'bg-card border-accent'}`}></div>
                            <div className="flex flex-col">
                              <span className={`text-sm transition-colors ${idx === 0 || idx === activeRoute.path.length - 1 ? 'font-bold text-primary' : 'font-medium text-muted-foreground'}`}>
                                {station?.name}
                              </span>
                            </div>
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
                  <p className="text-xs opacity-70 mt-1 leading-relaxed">No path found between terminals in current topological layer.</p>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-2xl text-center space-y-4 opacity-50">
                <Info className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-widest">Select terminal points to view path flow</p>
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
                <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> AI Network Simulation</Label>
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
          DMRC Route Intelligence Unit | v4.2.0
        </footer>
      </div>

      <main className="flex-1 relative bg-background">
        <NetworkVisualizer 
          data={data}
          activeRoute={activeRoute}
          onUpdateStation={handleUpdateStation}
          onSelectStation={setSelectedStationId}
          selectedStationId={selectedStationId}
        />
        
        <div className="absolute bottom-6 right-6 flex gap-2 z-20 pointer-events-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetNetwork} 
            className="shadow-xl bg-card hover:bg-primary/5 transition-all border-primary/20 font-bold gap-2 pointer-events-auto"
          >
            <RefreshCw className="w-3 h-3" /> Reset Network
          </Button>
        </div>
      </main>
    </div>
  );
}

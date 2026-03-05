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
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
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
    { id: "1", name: "Rajiv Chowk", x: 500, y: 500 },
    { id: "2", name: "Kashmere Gate", x: 500, y: 300 },
    { id: "3", name: "New Delhi", x: 500, y: 420 },
    { id: "4", name: "Noida Electronic City", x: 850, y: 500 },
    { id: "5", name: "Hauz Khas", x: 500, y: 750 },
    { id: "6", name: "Central Secretariat", x: 500, y: 580 },
    { id: "7", name: "Dwarka Sector 21", x: 150, y: 500 },
    { id: "8", name: "Huda City Centre", x: 500, y: 900 },
  ],
  connections: [
    { from: "2", to: "3", weight: 5 },
    { from: "3", to: "1", weight: 3 },
    { from: "1", to: "6", weight: 4 },
    { from: "6", to: "5", weight: 12 },
    { from: "5", to: "8", weight: 20 },
    { from: "1", to: "4", weight: 45 },
    { from: "1", to: "7", weight: 50 },
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

  const handleAddConnection = (from: string, to: string, weight: number) => {
    if (from === to) return;
    const exists = data.connections.find(c => (c.from === from && c.to === to) || (c.to === from && c.from === to));
    if (exists) return;
    
    setData(prev => ({
      ...prev,
      connections: [...prev.connections, { from, to, weight }]
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
          const edgeKey = [fromId, toId].sort().join('-');
          if (!processedEdges.has(edgeKey)) {
            newConnections.push({ from: fromId, to: toId, weight: conn.time });
            processedEdges.add(edgeKey);
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
        <header className="p-6 border-b flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Train className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">Delhi Metro</h1>
            <p className="text-xs text-muted-foreground font-medium">Official Route Planner</p>
          </div>
        </header>

        <Tabs defaultValue="plan" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="plan" className="rounded-lg data-[state=active]:shadow-sm"><Route className="w-4 h-4 mr-2" /> Navigate</TabsTrigger>
            <TabsTrigger value="build" className="rounded-lg data-[state=active]:shadow-sm"><Settings className="w-4 h-4 mr-2" /> Editor</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg data-[state=active]:shadow-sm"><Sparkles className="w-4 h-4 mr-2" /> AI Builder</TabsTrigger>
          </TabsList>

          {/* Planning Tab */}
          <TabsContent value="plan" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Navigation className="w-3 h-3" /> Trip Settings
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={optimizationType === 'shortest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptimizationType('shortest')}
                    className="h-12 flex flex-col items-center justify-center"
                  >
                    <Clock className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">Fastest Route</span>
                  </Button>
                  <Button 
                    variant={optimizationType === 'min-hops' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptimizationType('min-hops')}
                    className="h-12 flex flex-col items-center justify-center"
                  >
                    <Zap className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">Fewest Changes</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-medium">From</Label>
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger id="source" className="bg-background">
                      <SelectValue placeholder="Origin station" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.stations.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dest" className="text-sm font-medium">To</Label>
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger id="dest" className="bg-background">
                      <SelectValue placeholder="Destination station" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.stations.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {activeRoute ? (
              <Card className="border-accent/30 bg-accent/5 overflow-hidden">
                <CardHeader className="p-4 bg-accent/10 border-b border-accent/20">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-accent" /> Journey Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b pb-3">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">Time</span>
                      <span className="text-lg font-bold text-primary flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-accent" /> {activeRoute.totalWeight}m
                      </span>
                    </div>
                    <div className="w-px h-10 bg-border mx-4"></div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">Stations</span>
                      <span className="text-lg font-bold text-primary flex items-center">
                        <Navigation className="w-4 h-4 mr-1 text-accent" /> {activeRoute.hops}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Travel Chain</span>
                    <div className="space-y-1 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-accent/40 before:rounded-full">
                      {activeRoute.path.map((sid, idx) => {
                        const station = data.stations.find(s => s.id === sid);
                        return (
                          <div key={idx} className="flex items-center gap-3 relative">
                            <div className={`absolute -left-[22px] w-4 h-4 rounded-full border-2 ${idx === 0 || idx === activeRoute.path.length - 1 ? 'bg-accent border-accent' : 'bg-card border-accent'}`}></div>
                            <span className={`text-sm ${idx === 0 || idx === activeRoute.path.length - 1 ? 'font-bold' : 'font-medium text-muted-foreground'}`}>
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
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-center space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">No direct path found.</p>
                <p className="text-xs opacity-70">The selected stations are not connected in the current graph.</p>
              </div>
            ) : null}
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="build" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> New Station</h3>
                <div className="flex gap-2">
                  <Input id="new-station-name" placeholder="Station name..." className="flex-1" />
                  <Button size="sm" onClick={() => {
                    const input = document.getElementById('new-station-name') as HTMLInputElement;
                    if (input.value) {
                      handleAddStation(input.value);
                      input.value = "";
                      toast({ title: "Station Added" });
                    }
                  }}>Add</Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2"><ChevronRight className="w-4 h-4 text-primary" /> New Track</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select onValueChange={(val) => (window as any)._connFrom = val}>
                      <SelectTrigger><SelectValue placeholder="From..." /></SelectTrigger>
                      <SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(val) => (window as any)._connTo = val}>
                      <SelectTrigger><SelectValue placeholder="To..." /></SelectTrigger>
                      <SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Time (min)</Label>
                      <Input type="number" id="conn-weight" defaultValue="5" />
                    </div>
                    <Button className="w-full" onClick={() => {
                      const from = (window as any)._connFrom;
                      const to = (window as any)._connTo;
                      const weight = parseInt((document.getElementById('conn-weight') as HTMLInputElement).value) || 5;
                      if (from && to) {
                        handleAddConnection(from, to, weight);
                        toast({ title: "Track Laid", description: "New connection established." });
                      }
                    }}>Link Stations</Button>
                  </div>
                </div>
              </div>

              {selectedStationId && (
                <div className="p-4 border-destructive/20 bg-destructive/5 border rounded-lg space-y-3">
                   <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Management
                  </h3>
                  <p className="text-xs text-muted-foreground">Modify: {data.stations.find(s => s.id === selectedStationId)?.name}</p>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteStation(selectedStationId)}>
                    Remove Station
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Constructor Tab */}
          <TabsContent value="ai" className="flex-1 overflow-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> AI Network Constructor</Label>
                <CardDescription className="text-xs">
                  Describe a metro extension or a custom line. Example: "The Violet Line connects Kashmere Gate to Badarpur Border via Mandi House and Lajpat Nagar. Each stop takes 5 minutes."
                </CardDescription>
                <Textarea 
                  placeholder="Paste line details here..." 
                  className="min-h-[200px] text-xs font-code leading-relaxed"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleConstructAiNetwork} 
                disabled={isAiLoading || !aiDescription}
              >
                {isAiLoading ? "Constructing Graph..." : "Generate from Description"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <footer className="p-4 border-t text-[10px] text-muted-foreground text-center">
          DMRC Route Engine v2.0 • Data based on estimated travel times
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
        
        {/* Map Overlays */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
          <Card className="shadow-2xl border-primary/20 bg-card/90 backdrop-blur-md">
            <CardContent className="p-3 flex items-center gap-4">
              <div className="text-center px-2">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stations</span>
                <span className="text-xl font-bold font-code text-primary">{data.stations.length}</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center px-2">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Links</span>
                <span className="text-xl font-bold font-code text-primary">{data.connections.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="absolute bottom-6 right-6">
          <Button variant="secondary" size="sm" onClick={() => setData(INITIAL_DATA)} className="shadow-lg border">
            Default Network
          </Button>
        </div>
      </main>
    </div>
  );
}

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
  Cpu,
  ArrowRight,
  Code2,
  Database,
  Terminal,
  FileCode,
  Activity
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { NetworkData, Station, Connection, RouteResult } from "@/types/network";
import { getShortestPath, getMinHopsPath, buildAdjacencyList } from "@/lib/graph-algorithms";
import NetworkVisualizer from "@/components/NetworkVisualizer";
import { aiNetworkConstructor } from "@/ai/flows/ai-network-constructor";

const INITIAL_DATA: NetworkData = {
  stations: [
    { id: "y1", name: "Samaypur Badli", x: 400, y: 50 },
    { id: "y2", name: "Azadpur", x: 450, y: 150, isInterchange: true },
    { id: "y3", name: "Kashmere Gate", x: 500, y: 250, isInterchange: true },
    { id: "y4", name: "New Delhi", x: 500, y: 350, isInterchange: true },
    { id: "y5", name: "Rajiv Chowk", x: 500, y: 450, isInterchange: true },
    { id: "y6", name: "Central Secretariat", x: 500, y: 550, isInterchange: true },
    { id: "y7", name: "Hauz Khas", x: 500, y: 750, isInterchange: true },
    { id: "y8", name: "Millennium City Centre", x: 500, y: 950 },
    { id: "b1", name: "Dwarka Sector 21", x: 50, y: 800, isInterchange: true },
    { id: "b2", name: "Janakpuri West", x: 200, y: 650, isInterchange: true },
    { id: "b3", name: "Rajouri Garden", x: 300, y: 550, isInterchange: true },
    { id: "b4", name: "Kirti Nagar", x: 350, y: 450, isInterchange: true },
    { id: "b5", name: "Mandi House", x: 650, y: 450, isInterchange: true },
    { id: "b6", name: "Yamuna Bank", x: 750, y: 450, isInterchange: true },
    { id: "b7", name: "Mayur Vihar-I", x: 800, y: 550, isInterchange: true },
    { id: "b8", name: "Botanical Garden", x: 850, y: 750, isInterchange: true },
    { id: "r2", name: "Netaji Subhash Place", x: 350, y: 200, isInterchange: true },
    { id: "v1", name: "Lajpat Nagar", x: 650, y: 650, isInterchange: true },
    { id: "v2", name: "Kalkaji Mandir", x: 750, y: 750, isInterchange: true },
    { id: "p1", name: "South Campus", x: 400, y: 650, isInterchange: true },
  ],
  connections: [
    { from: "y1", to: "y2", weight: 8, line: "Yellow" },
    { from: "y2", to: "y3", weight: 10, line: "Yellow" },
    { from: "y3", to: "y4", weight: 5, line: "Yellow" },
    { from: "y4", to: "y5", weight: 3, line: "Yellow" },
    { from: "y5", to: "y6", weight: 4, line: "Yellow" },
    { from: "y6", to: "y7", weight: 12, line: "Yellow" },
    { from: "y7", to: "y8", weight: 20, line: "Yellow" },
    { from: "b1", to: "b2", weight: 15, line: "Blue" },
    { from: "b2", to: "b3", weight: 8, line: "Blue" },
    { from: "b3", to: "b4", weight: 5, line: "Blue" },
    { from: "b4", to: "y5", weight: 10, line: "Blue" },
    { from: "y5", to: "b5", weight: 3, line: "Blue" },
    { from: "b5", to: "b6", weight: 8, line: "Blue" },
    { from: "b6", to: "b7", weight: 8, line: "Blue" },
    { from: "b7", to: "b8", weight: 10, line: "Blue" },
    { from: "y2", to: "r2", weight: 6, line: "Pink" },
    { from: "r2", to: "b3", weight: 10, line: "Pink" },
    { from: "b3", to: "p1", weight: 12, line: "Pink" },
    { from: "p1", to: "v1", weight: 15, line: "Pink" },
    { from: "v1", to: "b7", weight: 15, line: "Pink" },
    { from: "b2", to: "y7", weight: 25, line: "Magenta" },
    { from: "y7", to: "v2", weight: 12, line: "Magenta" },
    { from: "v2", to: "b8", weight: 8, line: "Magenta" },
  ]
};

const CPP_DIJKSTRA = `// C++: Dijkstra's Weighted Shortest Path
void dijkstra(int startNode, int endNode, int n) {
  vector<int> dist(n + 1, INF);
  vector<int> parent(n + 1, -1);
  priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

  dist[startNode] = 0;
  pq.push({0, startNode});

  while (!pq.empty()) {
    int d = pq.top().first;
    int u = pq.top().second;
    pq.pop();

    if (d > dist[u]) continue;
    if (u == endNode) break;

    for (auto& edge : adj[u]) {
      int v = edge.to;
      int weight = edge.weight;
      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        parent[v] = u;
        pq.push({dist[v], v});
      }
    }
  }
}`;

const CPP_BFS = `// C++: Breadth-First Search (Fewest Hops)
void bfs(int startNode, int endNode, int n) {
  vector<int> parent(n + 1, -1);
  vector<bool> visited(n + 1, false);
  queue<int> q;

  visited[startNode] = true;
  q.push(startNode);

  while (!q.empty()) {
    int u = q.front();
    q.pop();

    if (u == endNode) break;

    for (int v : adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        parent[v] = u;
        q.push(v);
      }
    }
  }
}`;

export default function RouteFlow() {
  const [data, setData] = useState<NetworkData>(INITIAL_DATA);
  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [optimizationType, setOptimizationType] = useState<'shortest' | 'min-hops'>('shortest');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState("");

  const adjList = useMemo(() => buildAdjacencyList(data.stations, data.connections), [data]);

  const activeRoute = useMemo(() => {
    if (!sourceId || !destId || sourceId === destId) return null;
    return optimizationType === 'shortest' 
      ? getShortestPath(data.stations, data.connections, sourceId, destId)
      : getMinHopsPath(data.stations, data.connections, sourceId, destId);
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
    setData(prev => ({ ...prev, connections: [...prev.connections, { from, to, weight, line }] }));
  };

  const handleResetNetwork = useCallback(() => {
    setData({
      stations: JSON.parse(JSON.stringify(INITIAL_DATA.stations)),
      connections: JSON.parse(JSON.stringify(INITIAL_DATA.connections))
    });
    setSourceId("");
    setDestId("");
    setSelectedStationId(null);
    toast({ title: "Graph Re-initialized", description: "Default adjacency matrix restored." });
  }, []);

  const handleConstructAiNetwork = async () => {
    if (!aiDescription) return;
    setIsAiLoading(true);
    try {
      const result = await aiNetworkConstructor({ description: aiDescription });
      const newStations: Station[] = [];
      const newConnections: Connection[] = [];
      const stationMap = new Map<string, string>();
      const names = Object.keys(result);
      names.forEach((name, i) => {
        const id = (i + 1).toString();
        stationMap.set(name, id);
        const angle = (i / names.length) * Math.PI * 2;
        newStations.push({ id, name, x: 500 + Math.cos(angle) * 350, y: 500 + Math.sin(angle) * 350 });
      });
      const processed = new Set<string>();
      names.forEach(name => {
        const fromId = stationMap.get(name)!;
        result[name].forEach(conn => {
          const toId = stationMap.get(conn.station)!;
          if (toId) {
            const key = [fromId, toId].sort().join('-');
            if (!processed.has(key)) {
              newConnections.push({ from: fromId, to: toId, weight: conn.time });
              processed.add(key);
            }
          }
        });
      });
      setData({ stations: newStations, connections: newConnections });
      setSourceId("");
      setDestId("");
      toast({ title: "Compilation Success", description: `Synthesized ${newStations.length} vertices and ${newConnections.length} edges.` });
    } catch (e) {
      toast({ title: "Parsing Error", variant: "destructive", description: "Malformed network description." });
    } finally { setIsAiLoading(false); }
  };

  return (
    <div className="flex h-screen bg-background font-body overflow-hidden">
      <Toaster />
      <div className="w-[420px] flex flex-col border-r bg-card z-10 shadow-xl relative">
        <header className="p-6 border-b flex items-center gap-3 bg-primary/5 shrink-0">
          <div className="bg-primary p-2 rounded-lg shadow-inner">
            <Train className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">metroGo</h1>
        </header>

        <Tabs defaultValue="plan" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 mx-4 mt-4 bg-muted/50 p-1 rounded-xl shrink-0">
            <TabsTrigger value="plan" className="rounded-lg text-[10px]"><Route className="w-3 h-3 mr-1" /> Nav</TabsTrigger>
            <TabsTrigger value="dsa" className="rounded-lg text-[10px]"><Code2 className="w-3 h-3 mr-1" /> DSA</TabsTrigger>
            <TabsTrigger value="build" className="rounded-lg text-[10px]"><Settings className="w-3 h-3 mr-1" /> Edit</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg text-[10px]"><Sparkles className="w-3 h-3 mr-1" /> AI</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Optimization Engine</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={optimizationType === 'shortest' ? 'default' : 'outline'} size="sm" onClick={() => setOptimizationType('shortest')} className="h-auto py-3 px-2 flex flex-col items-center border-2">
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-bold">Fastest Route</span>
                    <span className="text-[9px] opacity-60">Dijkstra's Algorithm</span>
                  </Button>
                  <Button variant={optimizationType === 'min-hops' ? 'default' : 'outline'} size="sm" onClick={() => setOptimizationType('min-hops')} className="h-auto py-3 px-2 flex flex-col items-center border-2">
                    <Zap className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-bold">Fewest Stops</span>
                    <span className="text-[9px] opacity-60">BFS Algorithm</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Origin</Label>
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger className="h-10 border-2"><SelectValue placeholder="Select Origin" /></SelectTrigger>
                    <SelectContent>{data.stations.sort((a,b) => a.name.localeCompare(b.name)).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Destination</Label>
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger className="h-10 border-2"><SelectValue placeholder="Select Target" /></SelectTrigger>
                    <SelectContent>{data.stations.sort((a,b) => a.name.localeCompare(b.name)).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {activeRoute ? (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="p-4 bg-primary/10 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Navigation className="w-3 h-3 text-primary" /> Journey Summary
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] font-code h-5 uppercase">{optimizationType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/80 p-3 rounded-xl border border-primary/10 text-center">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Time (Est)</p>
                        <p className="text-lg font-bold text-primary">{activeRoute.totalWeight}m</p>
                      </div>
                      <div className="bg-background/80 p-3 rounded-xl border border-primary/10 text-center">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Interchanges</p>
                        <p className="text-lg font-bold text-primary">{activeRoute.hops}</p>
                      </div>
                    </div>
                    <div className="space-y-1 relative pl-6 border-l-2 border-primary/20 ml-2">
                      {activeRoute.path.map((sid, idx) => {
                        const s = data.stations.find(st => st.id === sid);
                        const isTerminus = idx === 0 || idx === activeRoute.path.length - 1;
                        return (
                          <div key={idx} className="flex items-center gap-3 relative py-1.5">
                            <div className={cn(
                              "absolute -left-[23px] w-3 h-3 rounded-full border-2 transition-all z-10",
                              isTerminus ? 'bg-primary border-primary scale-125 shadow-md shadow-primary/20' : 'bg-card border-primary/40'
                            )}></div>
                            <span className={cn(
                              "text-xs transition-all",
                              isTerminus ? "font-bold text-primary scale-105" : "font-medium opacity-80"
                            )}>
                              {s?.name}
                              {isTerminus && <Badge variant="secondary" className="ml-2 text-[8px] h-4 py-0 px-1 opacity-70 uppercase">{idx === 0 ? 'Source' : 'Dest'}</Badge>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : sourceId && destId && (
              <div className="p-8 border-2 border-dashed rounded-3xl text-center opacity-40">
                <Search className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase">No path exists in this graph topology.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dsa" className="flex-1 overflow-hidden p-6 space-y-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Database className="w-4 h-4" /> Adjacency List (Live)
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl font-code text-[10px] border leading-relaxed overflow-x-auto">
                    {Object.entries(adjList).map(([node, neighbors]) => (
                      <div key={node} className="mb-1">
                        <span className="text-primary font-bold">[{data.stations.find(s => s.id === node)?.name}]</span> → 
                        {neighbors.length > 0 ? neighbors.map(n => ` ${n.name}(${n.weight}m)`).join(',') : ' Empty'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <FileCode className="w-4 h-4" /> C++ Implementation Reference
                  </h3>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">Dijkstra.cpp</Label>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-code text-[9px] border-l-4 border-primary overflow-x-auto leading-relaxed">
                        {CPP_DIJKSTRA}
                      </pre>
                    </div>
                    <div className="relative group">
                      <Label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">BFS.cpp</Label>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-code text-[9px] border-l-4 border-accent overflow-x-auto leading-relaxed">
                        {CPP_BFS}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Algorithmic Complexity
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase">Dijkstra</p>
                      <p className="text-[11px] font-code">O((V + E) log V)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-accent uppercase">BFS</p>
                      <p className="text-[11px] font-code">O(V + E)</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="build" className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 border-2 rounded-2xl space-y-4 bg-muted/10">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><Terminal className="w-4 h-4" /> Node Management</h3>
              <div className="flex gap-2">
                <Input id="station-name" placeholder="Vertex Name..." className="h-10 border-2" />
                <Button size="sm" onClick={() => {
                  const input = document.getElementById('station-name') as HTMLInputElement;
                  if (input.value) { handleAddStation(input.value); input.value = ""; }
                }}>Add</Button>
              </div>
            </div>
            <div className="p-4 border-2 rounded-2xl space-y-4 bg-muted/10">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><ArrowRight className="w-4 h-4" /> Edge Constructor</h3>
              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={(v) => (window as any)._f = v}><SelectTrigger className="h-10"><SelectValue placeholder="Vertex U" /></SelectTrigger><SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Select onValueChange={(v) => (window as any)._t = v}><SelectTrigger className="h-10"><SelectValue placeholder="Vertex V" /></SelectTrigger><SelectContent>{data.stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="flex gap-2">
                <Input type="number" id="edge-w" placeholder="Weight (W)" className="h-10 border-2" defaultValue="5" />
                <Button className="flex-1" onClick={() => {
                  const f = (window as any)._f; const t = (window as any)._t;
                  const w = parseInt((document.getElementById('edge-w') as HTMLInputElement).value) || 5;
                  if (f && t) handleAddConnection(f, t, w);
                }}>Connect</Button>
              </div>
            </div>
            {selectedStationId && (
              <div className="p-4 border-2 border-destructive/20 bg-destructive/5 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remove Vertex</h3>
                <p className="text-sm font-bold">{data.stations.find(s => s.id === selectedStationId)?.name}</p>
                <Button variant="destructive" className="w-full" onClick={() => handleDeleteStation(selectedStationId)}>Confirm Deletion</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><Label className="text-xs font-black uppercase">AI Graph Generator</Label></div>
              <CardDescription className="text-xs">Describe nodes and edges in natural language to construct a new graph architecture instantly.</CardDescription>
              <Textarea 
                placeholder="Example: Create a star topology centered at 'Hub Station' connecting to 4 satellite stations A, B, C, and D with 5 min travel times each..." 
                className="min-h-[200px] text-xs font-code bg-muted/10 border-2" 
                value={aiDescription} 
                onChange={(e) => setAiDescription(e.target.value)} 
              />
              <Button className="w-full h-12 font-black uppercase text-[10px] tracking-widest" onClick={handleConstructAiNetwork} disabled={isAiLoading || !aiDescription}>
                {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />} Synthesize Topology
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <footer className="p-4 border-t bg-muted/5 flex justify-between items-center px-6">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-50">metroGo Core v2.0 // DSA LAB</span>
          <Button variant="ghost" size="sm" onClick={handleResetNetwork} className="h-7 text-[8px] font-black uppercase text-primary hover:bg-primary/10"><RefreshCw className="w-3 h-3 mr-1" /> Reset Graph</Button>
        </footer>
      </div>

      <main className="flex-1 relative bg-background">
        <NetworkVisualizer data={data} activeRoute={activeRoute} onUpdateStation={handleUpdateStation} onSelectStation={setSelectedStationId} selectedStationId={selectedStationId} />
      </main>
    </div>
  );
}
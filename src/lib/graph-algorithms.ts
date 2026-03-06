import type { Connection, RouteResult, Station, AdjacencyList } from "@/types/network";

/**
 * Builds a standard Adjacency List from stations and connections.
 * This is the fundamental Data Structure used for all graph traversals.
 */
export function buildAdjacencyList(stations: Station[], connections: Connection[]): AdjacencyList {
  const adj: AdjacencyList = {};
  stations.forEach(s => adj[s.id] = []);
  connections.forEach(c => {
    const s1 = stations.find(s => s.id === c.from);
    const s2 = stations.find(s => s.id === c.to);
    if (s1 && s2) {
      adj[c.from].push({ node: c.to, weight: c.weight, name: s2.name });
      adj[c.to].push({ node: c.from, weight: c.weight, name: s1.name });
    }
  });
  return adj;
}

/**
 * Implementation of Dijkstra's Algorithm for weighted shortest path.
 * 
 * Time Complexity: O((V + E) log V) - Efficient for weighted graphs.
 * Space Complexity: O(V + E) - Stores the graph and distance arrays.
 */
export function getShortestPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  if (!startId || !endId) return null;
  if (startId === endId) return { path: [startId], totalWeight: 0, hops: 0, type: 'shortest' };
  
  const adj = buildAdjacencyList(stations, connections);
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();

  stations.forEach(s => {
    distances[s.id] = Infinity;
    previous[s.id] = null;
  });
  distances[startId] = 0;

  for (let i = 0; i < stations.length; i++) {
    let u: string | null = null;
    for (const node of stations) {
      if (!visited.has(node.id) && (u === null || distances[node.id] < distances[u])) {
        u = node.id;
      }
    }

    if (u === null || distances[u] === Infinity) break;
    if (u === endId) break;
    visited.add(u);

    for (const neighbor of adj[u]) {
      const alt = distances[u] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = u;
      }
    }
  }

  if (distances[endId] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    path,
    totalWeight: distances[endId],
    hops: path.length - 1,
    type: 'shortest'
  };
}

/**
 * Implementation of Breadth-First Search (BFS) for minimum hops.
 * 
 * Time Complexity: O(V + E) - Linear traversal for unweighted distance.
 * Space Complexity: O(V) - Queue and visited set storage.
 */
export function getMinHopsPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  if (!startId || !endId) return null;
  if (startId === endId) return { path: [startId], totalWeight: 0, hops: 0, type: 'min-hops' };

  const adj = buildAdjacencyList(stations, connections);
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous: Record<string, string | null> = { [startId]: null };

  let found = false;
  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === endId) {
      found = true;
      break;
    }
    for (const neighbor of adj[u]) {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        previous[neighbor.node] = u;
        queue.push(neighbor.node);
      }
    }
  }

  if (!found) return null;

  const path: string[] = [];
  let curr: string | null = endId;
  let totalWeight = 0;
  while (curr !== null) {
    path.unshift(curr);
    const prevNode = previous[curr];
    if (prevNode) {
      const edge = connections.find(c => 
        (c.from === curr && c.to === prevNode) || (c.to === curr && c.from === prevNode)
      );
      totalWeight += edge?.weight || 0;
    }
    curr = prevNode;
  }

  return { path, totalWeight, hops: path.length - 1, type: 'min-hops' };
}

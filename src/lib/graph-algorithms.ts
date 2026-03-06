
import type { Connection, RouteResult, Station } from "@/types/network";

/**
 * Implementation of Dijkstra's Algorithm for weighted shortest path (Fastest Route).
 * Complexity: O((V + E) log V) with a priority-queue approach.
 */
export function getShortestPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  if (!startId || !endId) return null;
  if (startId === endId) {
    return { path: [startId], totalWeight: 0, hops: 0, type: 'shortest' };
  }
  
  const adjacencyList: Record<string, { node: string; weight: number }[]> = {};
  
  stations.forEach(s => adjacencyList[s.id] = []);
  connections.forEach(c => {
    if (adjacencyList[c.from] && adjacencyList[c.to]) {
      adjacencyList[c.from].push({ node: c.to, weight: c.weight });
      adjacencyList[c.to].push({ node: c.from, weight: c.weight });
    }
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq: Set<string> = new Set();

  stations.forEach(s => {
    distances[s.id] = s.id === startId ? 0 : Infinity;
    previous[s.id] = null;
    pq.add(s.id);
  });

  while (pq.size > 0) {
    let closestNode: string | null = null;
    let minDistance = Infinity;

    // Find node with minimum distance (Priority Queue behavior)
    for (const node of pq) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        closestNode = node;
      }
    }

    if (closestNode === null || minDistance === Infinity) break;
    if (closestNode === endId) break;

    pq.delete(closestNode);

    for (const neighbor of adjacencyList[closestNode]) {
      if (!pq.has(neighbor.node)) continue;
      const alt = distances[closestNode] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = closestNode;
      }
    }
  }

  if (!previous[endId] && startId !== endId) return null;

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
 * Implementation of Breadth-First Search (BFS) for minimum hops (Fewest Stops).
 * Complexity: O(V + E).
 */
export function getMinHopsPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  if (!startId || !endId) return null;
  if (startId === endId) {
    return { path: [startId], totalWeight: 0, hops: 0, type: 'min-hops' };
  }

  const adjacencyList: Record<string, string[]> = {};
  stations.forEach(s => adjacencyList[s.id] = []);
  connections.forEach(c => {
    if (adjacencyList[c.from] && adjacencyList[c.to]) {
      adjacencyList[c.from].push(c.to);
      adjacencyList[c.to].push(c.from);
    }
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous: Record<string, string | null> = { [startId]: null };

  let found = false;
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) {
      found = true;
      break;
    }

    for (const neighbor of adjacencyList[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        previous[neighbor] = current;
        queue.push(neighbor);
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
        (c.from === curr && c.to === prevNode) || 
        (c.to === curr && c.from === prevNode)
      );
      totalWeight += edge?.weight || 0;
    }
    curr = prevNode;
  }

  return {
    path,
    totalWeight,
    hops: path.length - 1,
    type: 'min-hops'
  };
}

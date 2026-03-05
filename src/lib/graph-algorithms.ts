import type { Connection, RouteResult, Station } from "@/types/network";

export function getShortestPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  const adjacencyList: Record<string, { node: string; weight: number }[]> = {};
  
  stations.forEach(s => adjacencyList[s.id] = []);
  connections.forEach(c => {
    adjacencyList[c.from].push({ node: c.to, weight: c.weight });
    adjacencyList[c.to].push({ node: c.from, weight: c.weight });
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const nodes = new Set<string>();

  stations.forEach(s => {
    distances[s.id] = s.id === startId ? 0 : Infinity;
    previous[s.id] = null;
    nodes.add(s.id);
  });

  while (nodes.size > 0) {
    let closestNode: string | null = null;
    for (const node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    }

    if (closestNode === null || distances[closestNode] === Infinity) break;
    if (closestNode === endId) break;

    nodes.delete(closestNode);

    for (const neighbor of adjacencyList[closestNode]) {
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

export function getMinHopsPath(
  stations: Station[],
  connections: Connection[],
  startId: string,
  endId: string
): RouteResult | null {
  const adjacencyList: Record<string, string[]> = {};
  stations.forEach(s => adjacencyList[s.id] = []);
  connections.forEach(c => {
    adjacencyList[c.from].push(c.to);
    adjacencyList[c.to].push(c.from);
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous: Record<string, string | null> = { [startId]: null };

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) break;

    for (const neighbor of adjacencyList[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        previous[neighbor] = current;
        queue.push(neighbor);
      }
    }
  }

  if (!previous[endId] && startId !== endId) return null;

  const path: string[] = [];
  let curr: string | null = endId;
  let totalWeight = 0;

  while (curr !== null) {
    path.unshift(curr);
    const prevNode = previous[curr];
    if (prevNode) {
      const edge = connections.find(c => (c.from === curr && c.to === prevNode) || (c.to === curr && c.from === prevNode));
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
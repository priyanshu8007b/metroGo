export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  weight: number;
}

export interface NetworkData {
  stations: Station[];
  connections: Connection[];
}

export interface RouteResult {
  path: string[];
  totalWeight: number;
  hops: number;
  type: 'shortest' | 'min-hops';
}
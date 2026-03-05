export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  isInterchange?: boolean;
}

export interface Connection {
  from: string;
  to: string;
  weight: number;
  line?: string;
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

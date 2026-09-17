export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship_type: string;
}

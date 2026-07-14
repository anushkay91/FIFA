// src/types/index.ts

export interface Zone {
  type: string;
  capacity: number;
  occupancy: number;
  flow_rate: number;
  wait_time: number;
  density: number;
  risk_level: string;
}

export interface Volunteer {
  id: string;
  name: string;
  zone: string;
  status: string;
  task: string | null;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  zone: string;
  message: string;
}

export interface PredictionData {
  predicted_occupancy: number;
  predicted_density: number;
  predicted_wait_time: number;
  predicted_risk: string;
  trend: string;
}

export interface BriefingData {
  summary: string;
  recommendations: string[];
  risk_level: string;
  critical_count: number;
  high_count: number;
}

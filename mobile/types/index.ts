export type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL';
export type IncidentStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type MachineType = 'excavator' | 'forklift' | 'haul_truck' | 'crane' | 'loader';

export interface Worker {
  id: string;
  name: string;
  role: string;
  zone: string;
  hasHelmet: boolean;
  hasHighVis: boolean;
}

export interface Machine {
  id: string;
  type: MachineType;
  name: string;
  zone: string;
  isActive: boolean;
  speedKmh: number;
}

export interface Zone {
  id: string;
  name: string;
  status: RiskLevel;
  workerCount: number;
  machineCount: number;
  activeHazards: number;
  cameraIds: string[];
  description: string;
  lastIncidentTime?: string;
}

export interface DeterministicTrigger {
  workerDetected: boolean;
  machineDetected: boolean;
  machineActive: boolean;
  hazardZoneBreached: boolean;
  distanceMeters: number;
  thresholdMeters: number;
  ttcSeconds: number;
  triggerHeadline: string;
  evaluationLatencyMs: number;
}

export interface AIRiskAnalysis {
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  contributingFactors: string[];
  recommendedAction: string;
  applicableRules: string[];
  safetyReference: {
    title: string;
    code: string;
    source: string;
    guidance: string;
  };
  latencySeconds: number;
}

export interface Incident {
  id: string;
  incidentCode: string; // e.g. "HX-1042"
  title: string;
  zone: string;
  zoneId: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  durationSeconds: number;
  riskLevel: RiskLevel;
  status: IncidentStatus;
  workerId: string;
  workerName: string;
  machineId: string;
  machineType: MachineType;
  machineName: string;
  evidenceImageUrl?: string;
  clipUrl?: string;
  clip_url?: string;
  deterministicTrigger: DeterministicTrigger;
  aiRiskAnalysis: AIRiskAnalysis;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface EdgeNode {
  id: string;
  nodeNumber: string; // "NODE 01"
  name: string;
  zone: string;
  zoneId: string;
  isOnline: boolean;
  cameraStatus: 'CONNECTED' | 'DISCONNECTED' | 'STREAMING';
  detectionState: 'ACTIVE' | 'STANDBY' | 'ERROR';
  fps: number;
  cpuPercent: number;
  memoryPercent: number;
  temperatureC: number;
  lastSyncSecondsAgo: number;
  latencyMs: number;
  ipAddress: string;
}

export interface SwarmSignal {
  id: string;
  timestamp: string;
  sourceNodeId: string;
  sourceNodeName: string;
  targetNodeId: string;
  targetNodeName: string;
  eventType: string;
  message: string;
  status: 'DISPATCHED' | 'RECEIVED' | 'AWARENESS_UPDATED';
}

export interface SwarmStatus {
  totalNodes: number;
  onlineNodes: number;
  activeHazardSignals: number;
  meshLatencyMs: number;
  isMeshSynchronized: boolean;
  signals: SwarmSignal[];
}

export interface SiteOverview {
  siteName: string;
  facilityCode: string;
  status: RiskLevel;
  statusMessage: string;
  activeIncidentsCount: number;
  workersMonitoredCount: number;
  machinesDetectedCount: number;
  todayIncidentsCount: number;
  safetyScore: number;
  lastSynchronized: string;
  edgeAiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  cloudStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
}

export interface DemoStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  targetScreen?: string;
  actionLabel?: string;
}

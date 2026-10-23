import {
  SiteOverview,
  Zone,
  Incident,
  EdgeNode,
  SwarmStatus
} from '../types';
import {
  INITIAL_SITE_OVERVIEW,
  INITIAL_ZONES,
  MOCK_INCIDENTS,
  INITIAL_EDGE_NODES,
  INITIAL_SWARM_STATUS
} from '../data/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL configured via Expo environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const FORCE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const STORAGE_KEYS = {
  INCIDENTS: '@hackeye_incidents',
  SITE_OVERVIEW: '@hackeye_site_overview',
  ZONES: '@hackeye_zones',
  DEMO_MODE: '@hackeye_demo_mode'
};

class ApiService {
  private isMockMode: boolean = true; // default to true until live connection verified

  constructor() {
    this.checkLiveBackend();
  }

  public async checkLiveBackend(): Promise<boolean> {
    if (FORCE_MOCK) {
      this.isMockMode = true;
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        this.isMockMode = false;
        return true;
      }
    } catch {
      // Backend not currently reachable, gracefully use mock
    }
    this.isMockMode = true;
    return false;
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  public getApiUrl(): string {
    return API_BASE_URL;
  }

  // --- SITE OVERVIEW ---
  public async getSiteOverview(): Promise<SiteOverview> {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/analytics`);
        if (res.ok) {
          const data = await res.json();
          return {
            siteName: "Hack-Eye Industrial Terminal",
            facilityCode: "FAC-ALPHA-09",
            status: data.critical_incidents_today > 0 ? "CRITICAL" : (data.warnings_today > 0 ? "WARNING" : "SAFE"),
            statusMessage: data.critical_incidents_today > 0 
              ? `${data.critical_incidents_today} Critical Hazard Active` 
              : "All monitored zones operating normally",
            activeIncidentsCount: data.critical_incidents_today + data.warnings_today,
            workersMonitoredCount: data.monitored_workers || 17,
            machinesDetectedCount: data.monitored_machines || 8,
            todayIncidentsCount: data.total_incidents || 6,
            safetyScore: data.safety_score || 85,
            lastSynchronized: "Just now",
            edgeAiStatus: "ONLINE",
            cloudStatus: "CONNECTED"
          };
        }
      } catch {
        // Fall back to local cached storage
      }
    }

    // Local / Mock
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SITE_OVERVIEW);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_SITE_OVERVIEW;
  }

  // --- ZONES ---
  public async getZones(): Promise<Zone[]> {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/zones`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch {}
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ZONES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_ZONES;
  }

  // --- INCIDENTS ---
  public async getIncidents(): Promise<Incident[]> {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Map backend incidents to rich Incident interface
            return data.map((item: any, idx: number) => ({
              id: item.incident_id || `inc-${idx}`,
              incidentCode: item.incident_id?.replace("INC-", "HX-") || `HX-${1042 - idx}`,
              title: item.machine_type ? `${item.machine_type.toUpperCase()} Proximity Breach` : "Safety Hazard",
              zone: item.zone || "Excavation Zone",
              zoneId: "zone-excavation",
              cameraId: "CAM-03",
              cameraName: "Overhead Safety Cam",
              timestamp: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "14:32:18",
              durationSeconds: item.ttc_seconds ? Number(item.ttc_seconds) * 1.5 : 2.4,
              riskLevel: item.risk_level || "CRITICAL",
              status: item.status || "ACTIVE",
              workerId: item.worker_id || "W-104",
              workerName: "Marcus Vance",
              machineId: item.machine_id || "EX-02",
              machineType: item.machine_type || "excavator",
              machineName: "CAT 320 Hydraulic Excavator",
              deterministicTrigger: {
                workerDetected: true,
                machineDetected: true,
                machineActive: true,
                hazardZoneBreached: true,
                distanceMeters: item.distance_m || 2.1,
                thresholdMeters: 3.5,
                ttcSeconds: item.ttc_seconds || 1.4,
                triggerHeadline: "Immediate proximity breach detected by edge safety rule.",
                evaluationLatencyMs: 24
              },
              aiRiskAnalysis: {
                riskLevel: item.risk_level || "CRITICAL",
                confidence: 0.94,
                summary: item.ai_summary || "Worker entered machine operating perimeter while hydraulics active.",
                contributingFactors: ["Blind angle", "High noise", "Trajectory intersection"],
                recommendedAction: "Stop machine operation and move worker outside safety zone.",
                applicableRules: ["OSHA 1926.601", "OSHA 1910.178"],
                safetyReference: {
                  title: "Excavator Operating-Zone Guidance",
                  code: "OSHA 29 CFR 1926.601",
                  source: "Safety Knowledge Base (Firecrawl)",
                  guidance: "Maintain 3m perimeter buffer around rotating heavy equipment."
                },
                latencySeconds: 1.8
              }
            }));
          }
        }
      } catch {}
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return MOCK_INCIDENTS;
  }

  public async getIncidentById(id: string): Promise<Incident | null> {
    const incidents = await this.getIncidents();
    return incidents.find(i => i.id === id || i.incidentCode === id) || null;
  }

  // --- SUPERVISOR ACTIONS ---
  public async acknowledgeIncident(incidentId: string, supervisorName: string = "Supervisor"): Promise<Incident | null> {
    const incidents = await this.getIncidents();
    const target = incidents.find(i => i.id === incidentId || i.incidentCode === incidentId);
    if (!target) return null;

    target.status = 'ACKNOWLEDGED';
    target.acknowledgedBy = supervisorName;
    target.acknowledgedAt = new Date().toLocaleTimeString();

    await AsyncStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));

    // Try posting to backend if live
    if (!this.isMockMode) {
      try {
        await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supervisor: supervisorName })
        });
      } catch {}
    }

    return target;
  }

  public async resolveIncident(incidentId: string, resolutionNote: string): Promise<{ incident: Incident; updatedSite: SiteOverview } | null> {
    const incidents = await this.getIncidents();
    const target = incidents.find(i => i.id === incidentId || i.incidentCode === incidentId);
    if (!target) return null;

    target.status = 'RESOLVED';
    target.resolutionNote = resolutionNote || "Worker moved outside operating zone.";
    target.resolvedAt = new Date().toLocaleTimeString();

    await AsyncStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));

    // Update site status to SAFE if no remaining critical active incidents
    const hasRemainingActiveCritical = incidents.some(i => i.status === 'ACTIVE' && i.riskLevel === 'CRITICAL');
    const updatedSite: SiteOverview = {
      ...INITIAL_SITE_OVERVIEW,
      status: hasRemainingActiveCritical ? "CRITICAL" : "SAFE",
      statusMessage: hasRemainingActiveCritical 
        ? "Active incidents require supervision" 
        : "All monitored zones operating normally. Site is SAFE.",
      activeIncidentsCount: incidents.filter(i => i.status === 'ACTIVE').length
    };
    await AsyncStorage.setItem(STORAGE_KEYS.SITE_OVERVIEW, JSON.stringify(updatedSite));

    // Update corresponding zone to SAFE
    const zones = await this.getZones();
    const targetZone = zones.find(z => z.id === target.zoneId || z.name.toLowerCase().includes(target.zone.toLowerCase()));
    if (targetZone) {
      targetZone.status = hasRemainingActiveCritical ? 'WARNING' : 'SAFE';
      targetZone.activeHazards = Math.max(0, targetZone.activeHazards - 1);
      await AsyncStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
    }

    if (!this.isMockMode) {
      try {
        await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: resolutionNote })
        });
      } catch {}
    }

    return { incident: target, updatedSite };
  }

  // --- EDGE NODES & SWARM ---
  public async getEdgeNodes(): Promise<EdgeNode[]> {
    return INITIAL_EDGE_NODES;
  }

  public async getSwarmStatus(): Promise<SwarmStatus> {
    return INITIAL_SWARM_STATUS;
  }

  public async resetDemoState(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.SITE_OVERVIEW);
    await AsyncStorage.removeItem(STORAGE_KEYS.ZONES);
  }
}

export const apiService = new ApiService();

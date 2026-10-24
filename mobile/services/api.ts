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
const LOCAL_BACKEND_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
const CLOUD_BACKEND_URL = (process.env.EXPO_PUBLIC_RENDER_URL || 'https://hackeye-cloud-platform.onrender.com').replace(/\/$/, "");
const FORCE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const STORAGE_KEYS = {
  INCIDENTS: '@hackeye_incidents',
  SITE_OVERVIEW: '@hackeye_site_overview',
  ZONES: '@hackeye_zones',
  DEMO_MODE: '@hackeye_demo_mode'
};

class ApiService {
  private isMockMode: boolean = true;
  private activeBaseUrl: string = CLOUD_BACKEND_URL;

  constructor() {
    this.checkLiveBackend();
  }

  public getActiveBaseUrl(): string {
    return this.activeBaseUrl;
  }

  public resolveClipUrl(rawClip?: string): string {
    const cloudBase = CLOUD_BACKEND_URL;
    if (!rawClip) return `${cloudBase}/videos/forklift_approaching_entrance.mp4`;
    if (rawClip.startsWith('http://localhost') || rawClip.startsWith('http://127.0.0.1')) {
      const path = rawClip.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, '');
      return `${cloudBase}${path}`;
    }
    if (rawClip.startsWith('/videos')) {
      return `${cloudBase}${rawClip}`;
    }
    return rawClip;
  }

  public async checkLiveBackend(): Promise<boolean> {
    if (FORCE_MOCK) {
      this.isMockMode = true;
      return false;
    }

    // Try Cloud Backend first (accessible from everywhere including physical phones on cellular/wifi)
    const targets = [CLOUD_BACKEND_URL, LOCAL_BACKEND_URL];
    for (const target of targets) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${target}/api/health`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.activeBaseUrl = target;
          this.isMockMode = false;
          return true;
        }
      } catch {
        // Continue to next candidate
      }
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
    return this.activeBaseUrl;
  }

  // --- SITE OVERVIEW ---
  public async getSiteOverview(): Promise<SiteOverview> {
    const baseUrl = this.activeBaseUrl;
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${baseUrl}/api/analytics`);
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
    const baseUrl = this.activeBaseUrl;
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${baseUrl}/api/incidents`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Map backend incidents to rich Incident interface
            return data.map((item: any, idx: number) => {
              const fullClipUrl = this.resolveClipUrl(item.clip_url || item.clipUrl);
              const workerLabel = item.worker_name || (item.worker_id ? `Worker (${item.worker_id})` : "Worker");
              const aiAnalysisObj = item.ai_analysis || {};

              return {
                id: item.incident_id || `inc-${idx}`,
                incidentCode: item.incident_id?.replace("INC-", "HX-") || `HX-${1042 - idx}`,
                title: item.title || (item.machine_type ? `${item.machine_type.toUpperCase()} Proximity Breach` : "Safety Hazard"),
                zone: item.zone || "Zone 01 (Bay Entrance)",
                zoneId: "zone-01",
                cameraId: "CAM-01",
                cameraName: item.zone ? `${item.zone.split(' ')[0]} Safety Cam` : "Loading Bay Safety Cam",
                timestamp: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "14:32:18",
                durationSeconds: item.ttc_seconds ? Number(item.ttc_seconds) * 1.5 : 2.4,
                riskLevel: item.risk_level || "CRITICAL",
                status: item.status || "ACTIVE",
                workerId: item.worker_id || "W-017",
                workerName: workerLabel,
                machineId: item.machine_id || "F-004",
                machineType: item.machine_type || "forklift",
                machineName: item.machine_type === "excavator" ? "CAT 320 Hydraulic Excavator" : (item.machine_id ? `Industrial Unit (${item.machine_id})` : "Toyota Electric Forklift"),
                clipUrl: fullClipUrl,
                deterministicTrigger: {
                  workerDetected: true,
                  machineDetected: true,
                  machineActive: true,
                  hazardZoneBreached: true,
                  distanceMeters: item.distance_m || 1.8,
                  thresholdMeters: 3.5,
                  ttcSeconds: item.ttc_seconds || 1.4,
                  triggerHeadline: "Immediate proximity breach detected by edge deterministic safety engine.",
                  evaluationLatencyMs: 4
                },
                aiRiskAnalysis: {
                  riskLevel: item.risk_level || "CRITICAL",
                  confidence: 0.95,
                  summary: item.ai_summary || (aiAnalysisObj.reason) || `${workerLabel} in proximity (${item.distance_m || 1.8}m) to active equipment.`,
                  contributingFactors: Array.isArray(aiAnalysisObj.contributing_factors) && aiAnalysisObj.contributing_factors.length > 0
                    ? aiAnalysisObj.contributing_factors
                    : [
                      `Clearance distance (${item.distance_m || 1.8}m) below 3.5m exclusion buffer`,
                      `TTC margin of ${item.ttc_seconds || 1.4}s provides minimal reaction time`,
                      "Line-of-sight obstruction at active logistics threshold"
                    ],
                  recommendedAction: (Array.isArray(aiAnalysisObj.recommended_actions) && aiAnalysisObj.recommended_actions[0])
                    ? aiAnalysisObj.recommended_actions[0]
                    : "Acoustic strobe beacon activated. Verify machinery clearance and maintain pedestrian lane.",
                  applicableRules: item.knowledge_cited
                    ? [item.knowledge_cited]
                    : ["OSHA 1910.178(n)(4) - Powered Industrial Trucks", "OSHA 1926.601"],
                  safetyReference: {
                    title: item.knowledge_cited || "Industrial Truck Pedestrian Separation",
                    code: item.knowledge_cited ? item.knowledge_cited.split(' - ')[0] : "OSHA Standard 29 CFR 1910.178(n)(4)",
                    source: "Safety Knowledge Base (Firecrawl Grounding)",
                    guidance: "Operators must maintain safe clearance from pedestrian paths and sound horn at all obstructed doorways."
                  },
                  latencySeconds: 1.4
                }
              };
            });
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
        await fetch(`${this.activeBaseUrl}/api/incidents/${incidentId}/acknowledge`, {
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
        await fetch(`${this.activeBaseUrl}/api/incidents/${incidentId}/resolve`, {
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

  public async simulateIncident(): Promise<Incident | null> {
    try {
      const res = await fetch(`${this.activeBaseUrl}/api/incidents/simulate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data?.incident) {
          const item = data.incident;
          const fullClipUrl = this.resolveClipUrl(item.clip_url || item.clipUrl);
          const workerLabel = item.worker_name || (item.worker_id ? `Worker (${item.worker_id})` : "Worker (W-017)");

          const mapped: Incident = {
            id: item.incident_id,
            incidentCode: item.incident_id?.replace("INC-", "HX-"),
            title: item.title || "Critical Breach: Forklift Entrance",
            zone: item.zone || "Zone 01 (Bay Entrance)",
            zoneId: "zone-01",
            cameraId: "CAM-01",
            cameraName: "Loading Bay Safety Cam",
            timestamp: new Date().toLocaleTimeString(),
            durationSeconds: 2.1,
            riskLevel: (item.risk_level as any) || "CRITICAL",
            status: "ACTIVE",
            workerId: item.worker_id || "W-017",
            workerName: workerLabel,
            machineId: item.machine_id || "F-004",
            machineType: "forklift",
            machineName: "Toyota Electric Forklift",
            clipUrl: fullClipUrl,
            deterministicTrigger: {
              workerDetected: true,
              machineDetected: true,
              machineActive: true,
              hazardZoneBreached: true,
              distanceMeters: item.distance_m || 1.8,
              thresholdMeters: 3.5,
              ttcSeconds: item.ttc_seconds || 1.4,
              triggerHeadline: "Immediate proximity breach detected by edge deterministic safety engine.",
              evaluationLatencyMs: 4
            },
            aiRiskAnalysis: {
              riskLevel: "CRITICAL",
              confidence: 0.96,
              summary: item.ai_analysis?.reason || "Rapid trajectory convergence between worker and machine in entrance threshold.",
              contributingFactors: item.ai_analysis?.contributing_factors || [
                "TTC estimated at 1.4s (< 2.0s threshold)",
                "Distance 1.8m in blind corner doorway",
                "Forklift traveling without sounding horn"
              ],
              recommendedAction: item.ai_analysis?.recommended_actions?.[0] || "Acoustic strobe beacon sounded. Halt machine.",
              applicableRules: ["OSHA 1910.178(n)(4) - Blind Intersections & Cross Aisles"],
              safetyReference: {
                title: "Powered Industrial Trucks - Speed and Blind Spots",
                code: "OSHA 1910.178(n)(4)",
                source: "Safety Knowledge Base (Firecrawl Ingestion)",
                guidance: item.ai_analysis?.knowledge_used || "Slow down and sound horn at cross aisles and obstructed views."
              },
              latencySeconds: 1.4
            }
          };
          return mapped;
        }
      }
    } catch {}

    // Fallback simulation if offline
    return {
      id: `sim-${Date.now()}`,
      incidentCode: `HX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: "Critical Breach: Machine Proximity Incursion",
      zone: "Zone 01 (Bay Entrance)",
      zoneId: "zone-01",
      cameraId: "CAM-01",
      cameraName: "Dock Entrance Cam",
      timestamp: new Date().toLocaleTimeString(),
      durationSeconds: 2.4,
      riskLevel: "CRITICAL",
      status: "ACTIVE",
      workerId: "W-017",
      workerName: "Worker (W-017)",
      machineId: "F-004",
      machineType: "forklift",
      machineName: "Toyota Electric Forklift",
      clipUrl: this.resolveClipUrl('/videos/forklift_approaching_entrance.mp4'),
      deterministicTrigger: {
        workerDetected: true,
        machineDetected: true,
        machineActive: true,
        hazardZoneBreached: true,
        distanceMeters: 1.8,
        thresholdMeters: 3.5,
        ttcSeconds: 1.4,
        triggerHeadline: "Worker-machine trajectory convergence within blind doorway threshold.",
        evaluationLatencyMs: 4
      },
      aiRiskAnalysis: {
        riskLevel: "CRITICAL",
        confidence: 0.96,
        summary: "Rapid trajectory convergence between Worker (W-017) and Toyota Forklift F-004 in Zone 01 entrance.",
        contributingFactors: [
          "TTC estimated at 1.4s (< 2.0s emergency threshold)",
          "Clearance distance reduced to 1.8m in blind corner doorway",
          "Forklift traveling at 6.8 km/h without sounding audible horn"
        ],
        recommendedAction: "Trigger Zone 01 acoustic strobe beacon (<5ms deterministic fast path). Direct worker to designated pathway.",
        applicableRules: ["OSHA 1910.178(n)(4) - Blind Intersections & Cross Aisles"],
        safetyReference: {
          title: "Powered Industrial Trucks - Speed and Blind Spots",
          code: "OSHA 1910.178(n)(4)",
          source: "Safety Knowledge Base (Firecrawl Ingestion)",
          guidance: "The driver shall slow down and sound the horn at cross aisles and other locations where vision is obstructed."
        },
        latencySeconds: 1.4
      }
    };
  }
}

export const apiService = new ApiService();

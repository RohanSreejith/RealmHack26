import {
  SiteOverview,
  Zone,
  Incident,
  EdgeNode,
  SwarmStatus,
  DemoStep
} from '../types';

export const INITIAL_SITE_OVERVIEW: SiteOverview = {
  siteName: "Hack-Eye Industrial Terminal",
  facilityCode: "FAC-ALPHA-09",
  status: "CRITICAL",
  statusMessage: "Worker-Machine Proximity Breach in Excavation Zone",
  activeIncidentsCount: 2,
  workersMonitoredCount: 17,
  machinesDetectedCount: 8,
  todayIncidentsCount: 6,
  safetyScore: 78,
  lastSynchronized: "12 seconds ago",
  edgeAiStatus: "ONLINE",
  cloudStatus: "CONNECTED"
};

export const INITIAL_ZONES: Zone[] = [
  {
    id: "zone-excavation",
    name: "EXCAVATION ZONE",
    status: "CRITICAL",
    workerCount: 4,
    machineCount: 2,
    activeHazards: 1,
    cameraIds: ["CAM-03", "CAM-05"],
    description: "Active excavation and foundation trenching area with heavy earthmovers.",
    lastIncidentTime: "14:32:18"
  },
  {
    id: "zone-loading",
    name: "LOADING ZONE",
    status: "WARNING",
    workerCount: 3,
    machineCount: 1,
    activeHazards: 1,
    cameraIds: ["CAM-01", "CAM-02"],
    description: "Exterior logistics dock with continuous forklift loading and cross-traffic.",
    lastIncidentTime: "13:15:04"
  },
  {
    id: "zone-material",
    name: "MATERIAL STORAGE ZONE",
    status: "SAFE",
    workerCount: 5,
    machineCount: 3,
    activeHazards: 0,
    cameraIds: ["CAM-04"],
    description: "High-bay racking and pallet staging depot with defined pedestrian lanes.",
    lastIncidentTime: "11:04:22"
  },
  {
    id: "zone-assembly",
    name: "ASSEMBLY & FABRICATION",
    status: "SAFE",
    workerCount: 5,
    machineCount: 2,
    activeHazards: 0,
    cameraIds: ["CAM-06", "CAM-07"],
    description: "Component manufacturing floor equipped with optical safety curtains.",
    lastIncidentTime: "09:41:50"
  }
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-1042",
    incidentCode: "HX-1042",
    title: "Worker-Machine Proximity Breach",
    zone: "Excavation Zone",
    zoneId: "zone-excavation",
    cameraId: "CAM-03",
    cameraName: "Excavator North Overhead Cam",
    timestamp: "14:32:18",
    durationSeconds: 2.4,
    riskLevel: "CRITICAL",
    status: "ACTIVE",
    workerId: "W-104",
    workerName: "Worker (W-104)",
    machineId: "EX-02",
    machineType: "excavator",
    machineName: "CAT 320 Hydraulic Excavator",
    clipUrl: "/videos/videos/nearmiss-rgb-00000/001e53453441935632ae_run_1_seed_1288693302.ceiling_00.rgb.mp4",
    deterministicTrigger: {
      workerDetected: true,
      machineDetected: true,
      machineActive: true,
      hazardZoneBreached: true,
      distanceMeters: 2.1,
      thresholdMeters: 3.5,
      ttcSeconds: 1.4,
      triggerHeadline: "Worker entered active machine operating radius while hydraulic boom engaged.",
      evaluationLatencyMs: 24
    },
    aiRiskAnalysis: {
      riskLevel: "CRITICAL",
      confidence: 0.94,
      summary: "Worker entered the active excavator operating zone while the machine was rotating clockwise. The worker remained within the high-hazard crush radius for approximately 2.4 seconds with back turned to the counterweight.",
      contributingFactors: [
        "Machine hydraulic boom actively swinging clockwise at 22 deg/s",
        "Worker entered blind quarter rear quarter of excavator chassis",
        "Closing distance reduced to 2.1 meters (critical threshold: 3.5m)",
        "TTC (Time to Collision) dropped to 1.4 seconds",
        "High ambient acoustic noise level in excavation trench (>88 dB)",
        "Absence of physical perimeter swing-barrier around trench edge"
      ],
      recommendedAction: "Immediately stop excavator swing rotation and direct worker W-104 to step 5 meters back beyond the high-visibility exclusion perimeter.",
      applicableRules: [
        "OSHA 1926.601 - Motor Vehicles & Excavation Equipment",
        "OSHA 1926.21 - Safety Training and Education in Trenching Zones",
        "Hack-Eye Rule R-EXC-03 - Active Swing Arm 4m Exclusion Buffer"
      ],
      safetyReference: {
        title: "Excavator Operating-Zone & Swing Radius Guidance",
        code: "OSHA Standard 29 CFR 1926.601 & NIOSH Pub 2001-109",
        source: "Safety Knowledge Base (Ingested via Firecrawl)",
        guidance: "Employers must maintain marked physical or optical exclusion zones equal to maximum boom outreach plus 1 meter buffer. Workers are strictly prohibited within counterweight swing radius without certified spotter confirmation."
      },
      latencySeconds: 1.8
    }
  },
  {
    id: "inc-1041",
    incidentCode: "HX-1041",
    title: "Forklift Blind Corner Approach",
    zone: "Loading Zone",
    zoneId: "zone-loading",
    cameraId: "CAM-01",
    cameraName: "Dock Door 02 Entrance Cam",
    timestamp: "13:15:04",
    durationSeconds: 3.8,
    riskLevel: "WARNING",
    status: "ACKNOWLEDGED",
    workerId: "W-088",
    workerName: "Worker (W-088)",
    machineId: "FL-05",
    machineType: "forklift",
    machineName: "Toyota Core Electric Forklift",
    clipUrl: "/videos/forklift_approaching_entrance.mp4",
    acknowledgedBy: "Supervisor (Safety Shift A)",
    acknowledgedAt: "13:16:10",
    deterministicTrigger: {
      workerDetected: true,
      machineDetected: true,
      machineActive: true,
      hazardZoneBreached: true,
      distanceMeters: 4.2,
      thresholdMeters: 6.0,
      ttcSeconds: 3.1,
      triggerHeadline: "Forklift approaching pedestrian cross-aisle at 7.2 km/h without sounding horn.",
      evaluationLatencyMs: 18
    },
    aiRiskAnalysis: {
      riskLevel: "WARNING",
      confidence: 0.91,
      summary: "Forklift FL-05 entered dock approach corridor at 7.2 km/h while pedestrian worker was crossing into staging aisle. Visual partition blocked line-of-sight.",
      contributingFactors: [
        "Forklift speed exceeds 5.0 km/h dock speed limit",
        "Blind partition obstruction between bay doors",
        "Pedestrian walking in designated crosswalk but forklift had priority load"
      ],
      recommendedAction: "Audible horn sounded from Swarm Node 02. Forklift decelerated to 3 km/h. Recommend installing convex dome mirror at column B4.",
      applicableRules: [
        "OSHA 1910.178(n)(4) - Blind Intersections & Cross Aisles"
      ],
      safetyReference: {
        title: "Powered Industrial Trucks - Speed and Blind Spots",
        code: "OSHA 1910.178(n)(4)",
        source: "Safety Knowledge Base (Ingested via Firecrawl)",
        guidance: "The driver shall slow down and sound the horn at cross aisles and other locations where vision is obstructed."
      },
      latencySeconds: 1.4
    }
  },
  {
    id: "inc-1040",
    incidentCode: "HX-1040",
    title: "Material Handling PPE Non-Compliance",
    zone: "Material Storage Zone",
    zoneId: "zone-material",
    cameraId: "CAM-04",
    cameraName: "High-Bay Racking Cam 04",
    timestamp: "11:04:22",
    durationSeconds: 14.2,
    riskLevel: "WARNING",
    status: "RESOLVED",
    workerId: "W-042",
    workerName: "Worker (W-042)",
    machineId: "FL-03",
    machineType: "forklift",
    machineName: "Crown Reach Truck",
    clipUrl: "/videos/worker_no_helmet.mp4",
    acknowledgedBy: "Supervisor (Safety Shift A)",
    acknowledgedAt: "11:05:00",
    resolutionNote: "Worker retrieved certified hard hat from PPE station before resuming racking pallet retrieval.",
    resolvedAt: "11:08:45",
    deterministicTrigger: {
      workerDetected: true,
      machineDetected: false,
      machineActive: false,
      hazardZoneBreached: true,
      distanceMeters: 0,
      thresholdMeters: 0,
      ttcSeconds: 0,
      triggerHeadline: "Worker observed inside overhead heavy-rack bay without protective hard hat.",
      evaluationLatencyMs: 15
    },
    aiRiskAnalysis: {
      riskLevel: "WARNING",
      confidence: 0.96,
      summary: "Worker entered level 4 racking bay without certified Type 1 Class E hard hat while reach truck was operating overhead.",
      contributingFactors: [
        "Overhead falling object potential in tier-4 racking bay",
        "Worker headgear classified as standard baseball cap"
      ],
      recommendedAction: "Enforce PPE compliance checkpoint at Aisle 07 entrance.",
      applicableRules: [
        "OSHA 1910.135 - Head Protection Standards"
      ],
      safetyReference: {
        title: "Head Protection in Material Warehousing",
        code: "OSHA 1910.135 & ANSI Z89.1",
        source: "Safety Knowledge Base (Ingested via Firecrawl)",
        guidance: "Workers must wear protective helmets where hazards from falling objects exist."
      },
      latencySeconds: 1.2
    }
  },
  {
    id: "inc-1039",
    incidentCode: "HX-1039",
    title: "Haul Truck Reversing Path Obstruction",
    zone: "Excavation Zone",
    zoneId: "zone-excavation",
    cameraId: "CAM-05",
    cameraName: "Earthwork Haul Road Cam",
    timestamp: "09:41:50",
    durationSeconds: 5.1,
    riskLevel: "CRITICAL",
    status: "RESOLVED",
    workerId: "W-112",
    workerName: "Worker (W-112)",
    machineId: "HT-01",
    machineType: "haul_truck",
    machineName: "Volvo A40G Articulated Hauler",
    clipUrl: "/videos/loading_zone_truck.mp4",
    acknowledgedBy: "Supervisor (Safety Shift A)",
    acknowledgedAt: "09:42:15",
    resolutionNote: "Surveyor escorted to elevated safety berm. Truck driver verified spotter in place.",
    resolvedAt: "09:46:30",
    deterministicTrigger: {
      workerDetected: true,
      machineDetected: true,
      machineActive: true,
      hazardZoneBreached: true,
      distanceMeters: 2.8,
      thresholdMeters: 5.0,
      ttcSeconds: 1.9,
      triggerHeadline: "Surveyor in blind reversing path of articulated hauler without spotter.",
      evaluationLatencyMs: 22
    },
    aiRiskAnalysis: {
      riskLevel: "CRITICAL",
      confidence: 0.93,
      summary: "Articulated haul truck began 3-point reverse turn while surveyor was marking grade pegs directly behind chassis blind spot.",
      contributingFactors: [
        "High blind spot angle on rear axle",
        "Surveyor focused on GPS surveying instrument"
      ],
      recommendedAction: "Edge siren triggered auto-halt. Move surveyor outside haul route perimeter.",
      applicableRules: [
        "OSHA 1926.601 - Haulage Vehicles in Excavations"
      ],
      safetyReference: {
        title: "Motor Vehicles and Mechanized Equipment",
        code: "OSHA 1926.601(b)(4)",
        source: "Safety Knowledge Base (Ingested via Firecrawl)",
        guidance: "No operator shall back up without audible reverse alarm or designated spotter."
      },
      latencySeconds: 1.5
    }
  }
];

export const INITIAL_EDGE_NODES: EdgeNode[] = [
  {
    id: "node-01",
    nodeNumber: "NODE 01",
    name: "Excavation North Edge Unit",
    zone: "Excavation Zone",
    zoneId: "zone-excavation",
    isOnline: true,
    cameraStatus: "CONNECTED",
    detectionState: "ACTIVE",
    fps: 18.4,
    cpuPercent: 62,
    memoryPercent: 41,
    temperatureC: 54,
    lastSyncSecondsAgo: 12,
    latencyMs: 14,
    ipAddress: "192.168.10.101"
  },
  {
    id: "node-02",
    nodeNumber: "NODE 02",
    name: "Loading Dock Gateway Unit",
    zone: "Loading Zone",
    zoneId: "zone-loading",
    isOnline: true,
    cameraStatus: "CONNECTED",
    detectionState: "ACTIVE",
    fps: 18.0,
    cpuPercent: 58,
    memoryPercent: 39,
    temperatureC: 51,
    lastSyncSecondsAgo: 8,
    latencyMs: 11,
    ipAddress: "192.168.10.102"
  },
  {
    id: "node-03",
    nodeNumber: "NODE 03",
    name: "Storage Depot Edge Unit",
    zone: "Material Storage Zone",
    zoneId: "zone-material",
    isOnline: true,
    cameraStatus: "CONNECTED",
    detectionState: "ACTIVE",
    fps: 18.2,
    cpuPercent: 54,
    memoryPercent: 37,
    temperatureC: 48,
    lastSyncSecondsAgo: 15,
    latencyMs: 12,
    ipAddress: "192.168.10.103"
  },
  {
    id: "node-04",
    nodeNumber: "NODE 04",
    name: "Assembly Line Edge Unit",
    zone: "Assembly & Fabrication",
    zoneId: "zone-assembly",
    isOnline: true,
    cameraStatus: "CONNECTED",
    detectionState: "ACTIVE",
    fps: 18.1,
    cpuPercent: 52,
    memoryPercent: 36,
    temperatureC: 47,
    lastSyncSecondsAgo: 9,
    latencyMs: 10,
    ipAddress: "192.168.10.104"
  }
];

export const INITIAL_SWARM_STATUS: SwarmStatus = {
  totalNodes: 4,
  onlineNodes: 4,
  activeHazardSignals: 1,
  meshLatencyMs: 6,
  isMeshSynchronized: true,
  signals: [
    {
      id: "sig-01",
      timestamp: "14:32:19",
      sourceNodeId: "node-01",
      sourceNodeName: "NODE 01 (Excavation)",
      targetNodeId: "node-02",
      targetNodeName: "NODE 02 (Loading)",
      eventType: "INTERZONE_HAZARD_BROADCAST",
      message: "Proximity alert at Sector boundary. Machine EX-02 rotating toward loading haulway.",
      status: "AWARENESS_UPDATED"
    },
    {
      id: "sig-02",
      timestamp: "13:15:05",
      sourceNodeId: "node-02",
      sourceNodeName: "NODE 02 (Loading)",
      targetNodeId: "node-03",
      targetNodeName: "NODE 03 (Storage)",
      eventType: "BLIND_CORNER_WARNING",
      message: "Forklift FL-05 approaching crossway. Staging gate alerted to hold pedestrians.",
      status: "AWARENESS_UPDATED"
    }
  ]
};

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: "1. Baseline Facility State",
    subtitle: "All Zones Normal",
    description: "4 distributed edge nodes independently monitor zones. The overall site status is SAFE.",
    targetScreen: "dashboard",
    actionLabel: "Start Safety Event"
  },
  {
    stepNumber: 2,
    title: "2. Worker Enters Trench",
    subtitle: "Worker W-104 detected",
    description: "Camera CAM-03 captures ground crew member walking into active excavation radius.",
    targetScreen: "live",
    actionLabel: "Simulate Machine Movement"
  },
  {
    stepNumber: 3,
    title: "3. Excavator Hydraulic Swing",
    subtitle: "Machine CAT-320 active",
    description: "Edge computer vision detects hydraulic rotation (22 deg/s) converging toward worker trajectory.",
    targetScreen: "live",
    actionLabel: "Trigger Proximity Alert"
  },
  {
    stepNumber: 4,
    title: "4. Deterministic Rule Triggered",
    subtitle: "<25ms Edge Safety Rule",
    description: "Deterministic Safety Engine detects distance (2.1m < 3.5m threshold) and TTC (1.4s). Local sirens trip immediately without LLM latency.",
    targetScreen: "dashboard",
    actionLabel: "Receive Phone Alert"
  },
  {
    stepNumber: 5,
    title: "5. Real-Time Alert Received",
    subtitle: "Supervisor Phone Notified",
    description: "Prominent emergency banner pops up instantly on the supervisor application with audible chime.",
    targetScreen: "alert",
    actionLabel: "Open Incident Detail"
  },
  {
    stepNumber: 6,
    title: "6. Incident Detail Opened",
    subtitle: "Incident #HX-1042",
    description: "Supervisor inspects the incident context: Excavation Zone, CAM-03, 14:32:18, Duration 2.4s.",
    targetScreen: "incident-detail",
    actionLabel: "View Camera Evidence"
  },
  {
    stepNumber: 7,
    title: "7. Edge Camera Evidence",
    subtitle: "Visual Frame & Vectors",
    description: "Annotated frame displays bounding boxes, worker position, machine counterweight radius, and distance vector.",
    targetScreen: "incident-detail",
    actionLabel: "Compare Edge vs AI"
  },
  {
    stepNumber: 8,
    title: "8. Safety Engine vs AI Risk Agent",
    subtitle: "Instant Rule + Deep AI",
    description: "Clear visual distinction: The deterministic engine triggered in 24ms; the LLM AI agent provided 94% confidence root-cause analysis.",
    targetScreen: "incident-detail",
    actionLabel: "Inspect Recommendation"
  },
  {
    stepNumber: 9,
    title: "9. OSHA Regulatory Grounding",
    subtitle: "Firecrawl Safety Standard",
    description: "AI cites OSHA 1926.601 & NIOSH 2001-109 with concrete actions: 'Halt swing rotation and step worker 5m back'.",
    targetScreen: "incident-detail",
    actionLabel: "Acknowledge Incident"
  },
  {
    stepNumber: 10,
    title: "10. Supervisor Acknowledges",
    subtitle: "Alert Silenced & Audited",
    description: "Supervisor acknowledges incident. Audit record logged to PostgreSQL and forwarded to n8n.",
    targetScreen: "incident-detail",
    actionLabel: "View Swarm Awareness"
  },
  {
    stepNumber: 11,
    title: "11. Swarm Mesh Broadcast",
    subtitle: "Node 01 -> Node 02 Alert",
    description: "Node 01 broadcasts hazard awareness to Node 02 at 0ms cloud latency, warning the adjacent loading corridor.",
    targetScreen: "swarm",
    actionLabel: "Resolve Incident"
  },
  {
    stepNumber: 12,
    title: "12. Incident Resolved",
    subtitle: "Site Returns to SAFE",
    description: "Supervisor enters note: 'Worker moved outside operating zone.' Site status immediately restores to SAFE.",
    targetScreen: "dashboard",
    actionLabel: "Restart Demo"
  }
];

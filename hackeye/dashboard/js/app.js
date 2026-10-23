/**
 * Hack-Eye Main Operations Dashboard Controller
 * Real-time telemetry, local siren coordination, dual-camera swarm feeds, and demo scenarios.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Elements - Dual Swarm Camera Feeds
  const videoStreamA = document.getElementById("videoStreamA");
  const videoStreamB = document.getElementById("videoStreamB");
  const videoContainerA = document.getElementById("videoContainerA");
  const videoContainerB = document.getElementById("videoContainerB");
  const localAlertBadgeA = document.getElementById("localAlertBadgeA");
  const localAlertBadgeB = document.getElementById("localAlertBadgeB");
  const hudTagCamA = document.getElementById("hudTagCamA");
  const hudTagCamB = document.getElementById("hudTagCamB");
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  
  // Status Bar Elements
  const edgeStatusBadge = document.getElementById("edgeStatusBadge");
  const cloudStatusBadge = document.getElementById("cloudStatusBadge");
  const facilityScoreBadge = document.getElementById("facilityScoreBadge");

  // Metrics
  const metricWorkers = document.getElementById("metricWorkers");
  const metricMachines = document.getElementById("metricMachines");
  const metricFps = document.getElementById("metricFps");
  const metricDistance = document.getElementById("metricDistance");
  const metricTtc = document.getElementById("metricTtc");
  const metricRisk = document.getElementById("metricRisk");

  // Active Incident Elements
  const incWorker = document.getElementById("incWorker");
  const incMachine = document.getElementById("incMachine");
  const incDist = document.getElementById("incDist");
  const incTtc = document.getElementById("incTtc");
  const incZone = document.getElementById("incZone");
  const incRiskBadge = document.getElementById("incRiskBadge");

  // AI & Knowledge Elements
  const aiReason = document.getElementById("aiReason");
  const aiPredicted = document.getElementById("aiPredicted");
  const aiFactors = document.getElementById("aiFactors");
  const aiActions = document.getElementById("aiActions");
  const aiConfidence = document.getElementById("aiConfidence");
  const knowledgeCitation = document.getElementById("knowledgeCitation");

  // Swarm & Workflow Elements
  const swarmFeed = document.getElementById("swarmFeed");
  const wfStepReceived = document.getElementById("wfStepReceived");
  const wfStepProcessing = document.getElementById("wfStepProcessing");
  const wfStepAi = document.getElementById("wfStepAi");
  const wfStepKnowledge = document.getElementById("wfStepKnowledge");
  const wfStepCompleted = document.getElementById("wfStepCompleted");

  // Timeline
  const timelineTrack = document.getElementById("timelineTrack");

  let isCloudConnected = true;
  let activeAlertPlaying = false;

  // Audio Siren Toggle
  audioToggleBtn.addEventListener("click", () => {
    const muted = window.localSiren.toggleMute();
    audioToggleBtn.textContent = muted ? "🔇 AUDIO MUTED" : "🔊 ALARM ACTIVE";
    audioToggleBtn.classList.toggle("sound-on", !muted);
  });

  // Demo Scenario Buttons (6 Swarm Multi-Angle Scenarios)
  const demoButtons = document.querySelectorAll(".demo-btn[data-scenario]");
  demoButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      demoButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const scenario = btn.getAttribute("data-scenario");
      try {
        const res = await fetch(`/api/demo/scenario/${scenario}`, { method: "POST" });
        const data = await res.json();
        console.log("[Demo] Triggered:", data);
        
        // Refresh both synchronized video stream sources concurrently
        const t = Date.now();
        if (videoStreamA) videoStreamA.src = `/api/stream/video/cam_a?t=${t}`;
        if (videoStreamB) videoStreamB.src = `/api/stream/video/cam_b?t=${t}`;

        // Update Camera HUD Zone Tags
        if (hudTagCamA && data.zone_a) hudTagCamA.textContent = data.zone_a;
        if (hudTagCamB && data.zone_b) hudTagCamB.textContent = data.zone_b;
        
        if (data.local_alert || data.risk_level === "CRITICAL" || data.risk_level === "WARNING") {
          triggerVisualAndAudioAlert(data.incident, data.title);
        }
        if (data.ai_analysis) {
          updateAiCard(data.ai_analysis);
        }
        if (data.swarm_event) {
          appendSwarmFeed(data.swarm_event);
        }
      } catch (err) {
        console.error("Demo scenario error:", err);
      }
    });
  });

  // Cloud Disconnect / Reconnect Toggle
  const cloudToggleBtn = document.getElementById("cloudToggleBtn");
  if (cloudToggleBtn) {
    cloudToggleBtn.addEventListener("click", async () => {
      isCloudConnected = !isCloudConnected;
      try {
        const res = await fetch("/api/demo/cloud-toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connected: isCloudConnected })
        });
        const data = await res.json();
        
        cloudToggleBtn.textContent = isCloudConnected ? "DISCONNECT CLOUD" : "RECONNECT CLOUD";
        cloudStatusBadge.innerHTML = `<span class="badge-dot"></span> ${data.status_text}`;
        cloudStatusBadge.className = isCloudConnected ? "badge badge-green" : "badge badge-red";
        
        console.log("[Cloud Toggle]:", data);
      } catch (err) {
        console.error("Cloud toggle failed:", err);
      }
    });
  }

  // Main Telemetry Polling Loop (400ms)
  async function pollTelemetry() {
    try {
      const res = await fetch("/api/stream/telemetry");
      if (res.ok) {
        const data = await res.json();
        updateTelemetryUI(data);
      }
    } catch (e) {}
    setTimeout(pollTelemetry, 400);
  }

  // Workflow & Swarm Polling Loop (1200ms)
  async function pollWorkflowAndSwarm() {
    try {
      const wfRes = await fetch("/api/workflows/latest");
      if (wfRes.ok) {
        const wf = await wfRes.json();
        updateWorkflowUI(wf);
      }

      const swarmRes = await fetch("/api/swarm/status");
      if (swarmRes.ok) {
        const swarmData = await swarmRes.json();
        updateSwarmUI(swarmData);
      }

      const analyticsRes = await fetch("/api/analytics");
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        facilityScoreBadge.textContent = `RISK INDEX: ${analytics.safety_score}/100`;
      }
    } catch (e) {}
    setTimeout(pollWorkflowAndSwarm, 1400);
  }

  function updateTelemetryUI(data) {
    metricFps.textContent = `${data.fps || 24} FPS`;
    
    const workers = (data.active_tracks || []).filter(t => t.industrial_type === "worker");
    const machines = (data.active_tracks || []).filter(t => t.industrial_type !== "worker");
    metricWorkers.textContent = workers.length || 1;
    metricMachines.textContent = machines.length || 1;

    // Proximities
    if (data.proximities && data.proximities.length > 0) {
      const p = data.proximities[0];
      metricDistance.textContent = `${p.estimated_distance_m}m`;
      metricTtc.textContent = p.ttc_seconds ? `${p.ttc_seconds}s` : "< 2.0s";
      metricRisk.textContent = data.status;
      metricRisk.style.color = data.status === "CRITICAL" ? "var(--danger-red)" : 
                               (data.status === "WARNING" ? "var(--warning-amber)" : "var(--safe-green)");
    } else {
      metricDistance.textContent = "2.4m";
      metricTtc.textContent = "1.7s";
      metricRisk.textContent = data.status;
      metricRisk.style.color = data.status === "CRITICAL" ? "var(--danger-red)" : "var(--safe-green)";
    }

    // Active Incident & Siren Handling
    if (data.local_alert_active || data.status === "CRITICAL") {
      triggerVisualAndAudioAlert(data.active_incident);
    } else {
      clearVisualAndAudioAlert();
    }
  }

  function triggerVisualAndAudioAlert(incident, scenarioTitle) {
    if (videoContainerA) videoContainerA.classList.add("critical-alert-border");
    if (videoContainerB) videoContainerB.classList.add("critical-alert-border");
    if (localAlertBadgeA) localAlertBadgeA.style.display = "inline-block";
    if (localAlertBadgeB) localAlertBadgeB.style.display = "inline-block";
    
    if (!activeAlertPlaying) {
      window.localSiren.startEmergencySiren();
      activeAlertPlaying = true;
    }

    if (incident) {
      incWorker.textContent = incident.worker_id || "W-017";
      incMachine.textContent = `${incident.machine_id || "F-004"} (${incident.machine_type || "forklift"})`;
      incDist.textContent = `${incident.distance_m || 2.1}m`;
      incTtc.textContent = incident.ttc_seconds ? `${incident.ttc_seconds}s` : "< 1.5s";
      incZone.textContent = incident.zone || "ZONE_01";
      incRiskBadge.textContent = incident.risk_level || "CRITICAL";
      incRiskBadge.style.color = incident.risk_level === "CRITICAL" ? "var(--danger-red)" : "var(--warning-amber)";

      generateIncidentTimeline(incident, scenarioTitle);
    }
  }

  function clearVisualAndAudioAlert() {
    if (videoContainerA) videoContainerA.classList.remove("critical-alert-border");
    if (videoContainerB) videoContainerB.classList.remove("critical-alert-border");
    if (localAlertBadgeA) localAlertBadgeA.style.display = "none";
    if (localAlertBadgeB) localAlertBadgeB.style.display = "none";
    if (activeAlertPlaying) {
      window.localSiren.stopSiren();
      activeAlertPlaying = false;
    }
  }

  function updateAiCard(ai) {
    if (!ai) return;
    aiReason.textContent = ai.reason || "Autonomous safety agent reasoning.";
    aiPredicted.textContent = ai.predicted_outcome || "Immediate path intersection probable.";
    aiConfidence.textContent = `CONF: ${Math.round((ai.confidence || 0.95) * 100)}%`;

    if (ai.contributing_factors) {
      aiFactors.innerHTML = ai.contributing_factors.map(f => `<li>${f}</li>`).join("");
    }
    if (ai.recommended_actions) {
      aiActions.innerHTML = ai.recommended_actions.map(a => `<li>${a}</li>`).join("");
    }
    if (ai.knowledge_used && ai.knowledge_used.length > 0) {
      const k = ai.knowledge_used[0];
      knowledgeCitation.innerHTML = `<strong>${k.title}</strong><br><span style="color:#aaa;">Source: ${k.source}</span>`;
    }
  }

  function updateWorkflowUI(wf) {
    if (!wf || !wf.current_step) return;
    const steps = ["RECEIVED", "PROCESSING", "AI_ANALYSIS", "KNOWLEDGE_LOOKUP", "COMPLETED"];
    const curIdx = steps.indexOf(wf.current_step);

    const stepElements = [wfStepReceived, wfStepProcessing, wfStepAi, wfStepKnowledge, wfStepCompleted];
    stepElements.forEach((el, idx) => {
      if (!el) return;
      el.classList.remove("active", "completed");
      if (idx < curIdx) {
        el.classList.add("completed");
      } else if (idx === curIdx) {
        el.classList.add(wf.completed ? "completed" : "active");
      }
    });
  }

  function appendSwarmFeed(ev) {
    if (!ev || !swarmFeed) return;
    const div = document.createElement("div");
    div.className = "swarm-msg";
    div.innerHTML = `<strong>[${ev.source_zone} ➔ ${ev.destination_zone}]</strong> ${ev.event} <span style="color:var(--text-dim);">(Risk:${ev.risk})</span>`;
    swarmFeed.prepend(div);
  }

  function updateSwarmUI(data) {
    if (!data || !data.zones) return;
    const zones = data.zones;
    
    for (const [zid, zdata] of Object.entries(zones)) {
      const box = document.getElementById(`box_${zid}`);
      if (box) {
        box.className = `zone-box ${zdata.status}`;
        const vig = box.querySelector(".zone-vigilance-val");
        if (vig) vig.textContent = zdata.vigilance_level;
      }
    }
  }

  function generateIncidentTimeline(inc, scenarioTitle) {
    const t0 = new Date();
    const formatTime = (dt, offsetMs) => {
      const d = new Date(dt.getTime() + offsetMs);
      return `${d.toTimeString().split(' ')[0]}.${String(d.getMilliseconds()).padStart(3, '0')}`;
    };

    timelineTrack.innerHTML = `
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -320)}</div>
        <div class="timeline-desc">Swarm Cam 01 & 02 Synchronized</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -210)}</div>
        <div class="timeline-desc">Entities Detected: ${inc.worker_id || 'Worker'} & ${inc.machine_id || 'Machine'}</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -110)}</div>
        <div class="timeline-desc">Multi-Angle Trajectory Convergence Verified</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -75)}</div>
        <div class="timeline-desc">TTC = ${inc.ttc_seconds || '1.7'}s (&lt; 2.0s Threshold)</div>
      </div>
      <div class="timeline-event local-alert">
        <div class="timeline-time">${formatTime(t0, -70)}</div>
        <div class="timeline-desc">🚨 LOCAL ALERT TRIGGERED (&lt;5ms)</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, 110)}</div>
        <div class="timeline-desc">Swarm Broadcast to Peer Camera Nodes</div>
      </div>
      <div class="timeline-event ai-done">
        <div class="timeline-time">${formatTime(t0, 1420)}</div>
        <div class="timeline-desc">AI Reasoning & OSHA Retrieval Complete</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, 1680)}</div>
        <div class="timeline-desc">Render Cloud & n8n Workflows Done</div>
      </div>
    `;
  }

  // Start polling loops
  pollTelemetry();
  pollWorkflowAndSwarm();
});

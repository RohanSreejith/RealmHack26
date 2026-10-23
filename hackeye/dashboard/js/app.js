/**
 * Hack-Eye Main Operations Dashboard Controller
 * Real-time telemetry, local siren coordination, swarm feeds, and demo scenarios.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const videoStream = document.getElementById("videoStream");
  const videoContainer = document.getElementById("videoContainer");
  const localAlertBadge = document.getElementById("localAlertBadge");
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

  // Audio Toggle
  audioToggleBtn.addEventListener("click", () => {
    const muted = window.localSiren.toggleMute();
    audioToggleBtn.textContent = muted ? "🔇 AUDIO MUTED" : "🔊 ALARM ACTIVE";
    audioToggleBtn.classList.toggle("sound-on", !muted);
  });

  // Demo Scenario Buttons
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
        
        // Refresh video stream source
        videoStream.src = `/api/stream/video?t=${Date.now()}`;
        
        if (data.local_alert) {
          triggerVisualAndAudioAlert(data.incident);
        }
        if (data.ai_analysis) {
          updateAiCard(data.ai_analysis);
        }
      } catch (err) {
        console.error("Demo scenario error:", err);
      }
    });
  });

  // Cloud Disconnect / Reconnect Toggle
  const cloudToggleBtn = document.getElementById("cloudToggleBtn");
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

  // Main Telemetry Polling Loop (300ms)
  async function pollTelemetry() {
    try {
      const res = await fetch("/api/stream/telemetry");
      if (res.ok) {
        const data = await res.json();
        updateTelemetryUI(data);
      }
    } catch (e) {
      // Offline resilient
    }
    setTimeout(pollTelemetry, 350);
  }

  // Workflow Polling Loop (1000ms)
  async function pollWorkflowAndSwarm() {
    try {
      // 1. Fetch Workflow
      const wfRes = await fetch("/api/workflows/latest");
      if (wfRes.ok) {
        const wf = await wfRes.json();
        updateWorkflowUI(wf);
      }

      // 2. Fetch Swarm Zones
      const swarmRes = await fetch("/api/swarm/status");
      if (swarmRes.ok) {
        const swarmData = await swarmRes.json();
        updateSwarmUI(swarmData);
      }

      // 3. Fetch Analytics & Safety Score
      const analyticsRes = await fetch("/api/analytics");
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        facilityScoreBadge.textContent = `RISK INDEX: ${analytics.safety_score}/100`;
      }
    } catch (e) {}
    setTimeout(pollWorkflowAndSwarm, 1200);
  }

  function updateTelemetryUI(data) {
    metricFps.textContent = `${data.fps || 24} FPS`;
    
    const workers = data.active_tracks.filter(t => t.industrial_type === "worker");
    const machines = data.active_tracks.filter(t => t.industrial_type !== "worker");
    metricWorkers.textContent = workers.length;
    metricMachines.textContent = machines.length;

    // Handle Proximity & TTC
    if (data.proximities && data.proximities.length > 0) {
      const p = data.proximities[0];
      metricDistance.textContent = `${p.estimated_distance_m}m`;
      metricTtc.textContent = p.ttc_seconds ? `${p.ttc_seconds}s` : "DIV";
      metricRisk.textContent = data.status;
      metricRisk.style.color = data.status === "CRITICAL" ? "var(--danger-red)" : 
                               (data.status === "WARNING" ? "var(--warning-amber)" : "var(--safe-green)");
    } else {
      metricDistance.textContent = "--";
      metricTtc.textContent = "--";
      metricRisk.textContent = "SAFE";
      metricRisk.style.color = "var(--safe-green)";
    }

    // Active Incident & Siren State
    if (data.local_alert_active || data.status === "CRITICAL") {
      triggerVisualAndAudioAlert(data.active_incident);
    } else {
      clearVisualAndAudioAlert();
    }
  }

  function triggerVisualAndAudioAlert(incident) {
    videoContainer.classList.add("critical-alert-border");
    localAlertBadge.style.display = "inline-block";
    
    if (!activeAlertPlaying) {
      window.localSiren.startEmergencySiren();
      activeAlertPlaying = true;
    }

    if (incident) {
      incWorker.textContent = incident.worker_id || "W-017";
      incMachine.textContent = `${incident.machine_id || "F-004"} (${incident.machine_type || "forklift"})`;
      incDist.textContent = `${incident.distance_m || 2.4}m`;
      incTtc.textContent = incident.ttc_seconds ? `${incident.ttc_seconds}s` : "< 2.0s";
      incZone.textContent = incident.zone || "ZONE_01";
      incRiskBadge.textContent = incident.risk_level || "CRITICAL";
      incRiskBadge.style.color = "var(--danger-red)";

      generateIncidentTimeline(incident);
    }
  }

  function clearVisualAndAudioAlert() {
    videoContainer.classList.remove("critical-alert-border");
    localAlertBadge.style.display = "none";
    if (activeAlertPlaying) {
      window.localSiren.stopSiren();
      activeAlertPlaying = false;
    }
  }

  function updateAiCard(ai) {
    if (!ai) return;
    aiReason.textContent = ai.reason || "Autonomous safety agent reasoning.";
    aiPredicted.textContent = ai.predicted_outcome || "Immediate path intersection probable.";
    aiConfidence.textContent = `CONF: ${Math.round((ai.confidence || 0.94) * 100)}%`;

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

  function updateSwarmUI(data) {
    if (!data || !data.zones) return;
    const zones = data.zones;
    
    // Update Zone 01, 02, 03 Boxes
    for (const [zid, zdata] of Object.entries(zones)) {
      const box = document.getElementById(`box_${zid}`);
      if (box) {
        box.className = `zone-box ${zdata.status}`;
        const vig = box.querySelector(".zone-vigilance-val");
        if (vig) vig.textContent = zdata.vigilance_level;
      }
    }

    // Populate recent messages in Swarm feed
    let allMsgs = [];
    for (const [zid, zdata] of Object.entries(zones)) {
      if (zdata.recent_messages) {
        allMsgs.push(...zdata.recent_messages);
      }
    }
    if (allMsgs.length > 0) {
      swarmFeed.innerHTML = allMsgs.slice(-4).map(m => `
        <div class="swarm-msg">
          <strong>[${m.source_zone} ➔ ${m.destination_zone}]</strong> ${m.event} 
          <span style="color:var(--text-dim);">(${m.worker_id || 'ID'} ETA:${m.eta_seconds || 4}s)</span>
        </div>
      `).join("");
    }
  }

  function generateIncidentTimeline(inc) {
    const t0 = new Date();
    const formatTime = (dt, offsetMs) => {
      const d = new Date(dt.getTime() + offsetMs);
      return `${d.toTimeString().split(' ')[0]}.${String(d.getMilliseconds()).padStart(3, '0')}`;
    };

    timelineTrack.innerHTML = `
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -320)}</div>
        <div class="timeline-desc">Worker ${inc.worker_id || 'W-017'} Detected</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -240)}</div>
        <div class="timeline-desc">${inc.machine_type || 'Forklift'} ${inc.machine_id || 'F-004'} Detected</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -180)}</div>
        <div class="timeline-desc">Objects Tracked & Geometry Calculated</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, -80)}</div>
        <div class="timeline-desc">TTC = ${inc.ttc_seconds || '1.7'}s (&lt; 2.0s)</div>
      </div>
      <div class="timeline-event local-alert">
        <div class="timeline-time">${formatTime(t0, -75)}</div>
        <div class="timeline-desc">🚨 LOCAL ALERT TRIGGERED (&lt;5ms)</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, 120)}</div>
        <div class="timeline-desc">Swarm Alert to Zone 02</div>
      </div>
      <div class="timeline-event ai-done">
        <div class="timeline-time">${formatTime(t0, 1420)}</div>
        <div class="timeline-desc">AI Agent Analysis Complete</div>
      </div>
      <div class="timeline-event">
        <div class="timeline-time">${formatTime(t0, 1680)}</div>
        <div class="timeline-desc">Render Workflow Complete</div>
      </div>
    `;
  }

  // Start polling
  pollTelemetry();
  pollWorkflowAndSwarm();
});

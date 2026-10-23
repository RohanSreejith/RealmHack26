/**
 * HAWK Operations Dashboard Controller
 * Real-time dual camera swarm feeds, incident handling, and AI safety intelligence.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Video Stream Elements
  const videoStreamA = document.getElementById("videoStreamA");
  const videoStreamB = document.getElementById("videoStreamB");
  const camNameA = document.getElementById("camNameA");
  const camLocationA = document.getElementById("camLocationA");
  const camNameB = document.getElementById("camNameB");
  const camLocationB = document.getElementById("camLocationB");
  const camTimeA = document.getElementById("camTimeA");
  const camTimeB = document.getElementById("camTimeB");

  // Active Incident Card Elements
  const incidentTitle = document.getElementById("incidentTitle");
  const incidentDescription = document.getElementById("incidentDescription");
  const incidentCountdown = document.getElementById("incidentCountdown");
  const incidentZoneMeta = document.getElementById("incidentZoneMeta");
  const incidentEtaMeta = document.getElementById("incidentEtaMeta");
  const incidentRiskBadge = document.getElementById("incidentRiskBadge");
  const viewDetailsBtn = document.getElementById("viewDetailsBtn");
  const notifySupervisorBtn = document.getElementById("notifySupervisorBtn");

  // Modal Elements
  const incidentModal = document.getElementById("incidentModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalDismissBtn = document.getElementById("modalDismissBtn");
  const modalDispatchN8nBtn = document.getElementById("modalDispatchN8nBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalWorker = document.getElementById("modalWorker");
  const modalMachine = document.getElementById("modalMachine");
  const modalDist = document.getElementById("modalDist");
  const modalConf = document.getElementById("modalConf");
  const modalEscalation = document.getElementById("modalEscalation");
  const modalFactors = document.getElementById("modalFactors");
  const modalActions = document.getElementById("modalActions");
  const modalOshaCode = document.getElementById("modalOshaCode");
  const modalOshaDesc = document.getElementById("modalOshaDesc");

  // Clocks
  const liveDate = document.getElementById("liveDate");
  const liveClock = document.getElementById("liveClock");

  // Controls
  const scenarioPills = document.querySelectorAll(".scenario-pill[data-scenario]");
  const cloudToggleBtn = document.getElementById("cloudToggleBtn");
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  const audioBtnText = document.getElementById("audioBtnText");

  let isCloudConnected = true;
  let activeIncidentData = null;

  // 1. Live Real-Time Digital Clock
  function updateLiveClock() {
    const now = new Date();
    const dateOpts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    if (liveDate) liveDate.textContent = now.toLocaleDateString('en-GB', dateOpts);
    
    const timeStr = now.toTimeString().split(' ')[0];
    if (liveClock) liveClock.textContent = timeStr;
    if (camTimeA) camTimeA.textContent = timeStr;
    if (camTimeB) camTimeB.textContent = timeStr;
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // 2. Fullscreen & Snapshot Handlers
  const setupCamControls = (btnId, videoId) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const vid = document.getElementById(videoId);
      if (vid && vid.requestFullscreen) {
        vid.requestFullscreen();
      }
    });
  };
  setupCamControls("fullscreenBtnA", "videoStreamA");
  setupCamControls("fullscreenBtnB", "videoStreamB");

  // 3. Audio Alarm Toggle
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", () => {
      const muted = window.localSiren.toggleMute();
      if (audioBtnText) {
        audioBtnText.textContent = muted ? "Audio Muted" : "Monitoring Live...";
      }
    });
  }

  // 4. Scenario Switching (6 Dual-Camera Scenarios)
  scenarioPills.forEach(pill => {
    pill.addEventListener("click", async () => {
      scenarioPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      const scenario = pill.getAttribute("data-scenario");
      try {
        const res = await fetch(`/api/demo/scenario/${scenario}`, { method: "POST" });
        const data = await res.json();
        console.log("[HAWK Scenario Activated]:", data);
        activeIncidentData = data;

        // Refresh streams
        const t = Date.now();
        if (videoStreamA) videoStreamA.src = `/api/stream/video/cam_a?t=${t}`;
        if (videoStreamB) videoStreamB.src = `/api/stream/video/cam_b?t=${t}`;

        // Update Cam labels
        if (data.zone_a && camLocationA) camLocationA.textContent = data.zone_a;
        if (data.zone_b && camLocationB) camLocationB.textContent = data.zone_b;

        // Update Incident Card
        updateIncidentCard(data);

        // Play brief alarm if critical
        if (data.risk_level === "CRITICAL" && window.localSiren && !window.localSiren.muted) {
          window.localSiren.triggerTone(0.6);
        }
      } catch (err) {
        console.error("Scenario switch error:", err);
      }
    });
  });

  function updateIncidentCard(data) {
    const inc = data.incident || {};
    const ai = data.ai_analysis || {};

    if (incidentTitle) incidentTitle.textContent = data.title || "Active Safety Breach";
    if (incidentDescription && ai.reason) incidentDescription.textContent = ai.reason;
    if (incidentZoneMeta) incidentZoneMeta.textContent = inc.zone || "Zone A / B";
    if (incidentEtaMeta) incidentEtaMeta.textContent = `${inc.ttc_seconds || 2.4} seconds`;
    if (incidentCountdown) incidentCountdown.textContent = `In ~ ${inc.ttc_seconds || 2.4} seconds`;

    if (incidentRiskBadge) {
      incidentRiskBadge.textContent = `RISK: ${data.risk_level || 'MEDIUM'}`;
      incidentRiskBadge.className = data.risk_level === 'CRITICAL' ? 'risk-badge-critical' : 'risk-badge-medium';
    }
  }

  // 5. Cloud Disconnect Toggle
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
        cloudToggleBtn.textContent = isCloudConnected ? "Disconnect Cloud" : "Reconnect Cloud";
        cloudToggleBtn.style.backgroundColor = isCloudConnected ? "#FEF2F2" : "#ECFDF5";
        cloudToggleBtn.style.color = isCloudConnected ? "#DC2626" : "#059669";
        console.log("[Cloud Toggle]:", data);
      } catch (err) {
        console.error("Cloud toggle error:", err);
      }
    });
  }

  // 6. View Details Modal
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener("click", () => {
      populateModal();
      if (incidentModal) incidentModal.classList.add("active");
    });
  }

  const closeModal = () => {
    if (incidentModal) incidentModal.classList.remove("active");
  };
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener("click", closeModal);

  // Click outside to close modal
  if (incidentModal) {
    incidentModal.addEventListener("click", (e) => {
      if (e.target === incidentModal) closeModal();
    });
  }

  function populateModal() {
    if (!activeIncidentData) {
      // Default initial data
      if (modalTitle) modalTitle.textContent = "Incident Analysis: Vehicle Approaching Zone B";
      if (modalWorker) modalWorker.textContent = "Worker P12 (Interior Entrance)";
      if (modalMachine) modalMachine.textContent = "Forklift V01 (Toyota Core Electric)";
      if (modalDist) modalDist.textContent = "2.4 meters";
      if (modalConf) modalConf.textContent = "94%";
      return;
    }

    const inc = activeIncidentData.incident || {};
    const ai = activeIncidentData.ai_analysis || {};

    if (modalTitle) modalTitle.textContent = `Incident Analysis: ${activeIncidentData.title}`;
    if (modalWorker) modalWorker.textContent = inc.worker_id || "Worker W-017";
    if (modalMachine) modalMachine.textContent = inc.machine_id ? `${inc.machine_id} (${inc.machine_type})` : "Forklift F-004";
    if (modalDist) modalDist.textContent = `${inc.distance_m || 2.4} meters`;
    if (modalConf) modalConf.textContent = `${Math.round((ai.confidence || 0.94) * 100)}%`;

    if (modalEscalation) modalEscalation.textContent = ai.predicted_outcome || "Imminent blind-corner crush hazard within 1.7 seconds if pedestrian does not yield.";

    if (modalFactors && ai.contributing_factors) {
      modalFactors.innerHTML = ai.contributing_factors.map(f => `<li>${f}</li>`).join("");
    }

    if (modalActions && ai.recommended_actions) {
      modalActions.innerHTML = ai.recommended_actions.map(a => `<li>${a}</li>`).join("");
    }

    if (ai.knowledge_used && ai.knowledge_used.length > 0) {
      const k = ai.knowledge_used[0];
      if (modalOshaCode) modalOshaCode.textContent = k.title || "OSHA 1910.178 - Industrial Safety";
      if (modalOshaDesc) modalOshaDesc.textContent = k.summary || "Mandatory audible warning horn and 3m pedestrian clearance.";
    }
  }

  // 7. Notify Supervisor Action Button
  if (notifySupervisorBtn) {
    notifySupervisorBtn.addEventListener("click", async () => {
      // Visual feedback
      const originalText = notifySupervisorBtn.innerHTML;
      notifySupervisorBtn.innerHTML = `<span>Dispatching n8n Alert...</span>`;
      
      // Sound local tone
      if (window.localSiren && !window.localSiren.muted) {
        window.localSiren.triggerTone(0.8);
      }

      try {
        const res = await fetch("/api/n8n/trigger-test", { method: "POST" });
        const data = await res.json();
        console.log("[n8n Alert Dispatched]:", data);
        notifySupervisorBtn.innerHTML = `<span>✓ Dispatched to Slack &amp; Phone!</span>`;
        setTimeout(() => {
          notifySupervisorBtn.innerHTML = originalText;
        }, 2500);
      } catch (err) {
        console.error("n8n dispatch error:", err);
        notifySupervisorBtn.innerHTML = originalText;
      }
    });
  }

  if (modalDispatchN8nBtn) {
    modalDispatchN8nBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/n8n/trigger-test", { method: "POST" });
        alert("🚨 Incident successfully escalated to supervisor via n8n webhook and SMS!");
        closeModal();
      } catch (e) {
        closeModal();
      }
    });
  }

  // Load initial scenario 1 on startup
  fetch("/api/demo/scenario/scenario_1_entrance", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      activeIncidentData = data;
      updateIncidentCard(data);
    })
    .catch(() => {});
});

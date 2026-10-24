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
        console.log("[HACK-EYE Scenario Activated]:", data);
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

  // --- 8. Safety Rules Modal & Dynamic Configuration ---
  const rulesModal = document.getElementById("rulesModal");
  const openRulesBtn = document.getElementById("openRulesBtn");
  const rulesModalCloseBtn = document.getElementById("rulesModalCloseBtn");
  const rulesModalDismissBtn = document.getElementById("rulesModalDismissBtn");
  const saveRulesBtn = document.getElementById("saveRulesBtn");

  const sliderForkliftDist = document.getElementById("sliderForkliftDist");
  const valForkliftDist = document.getElementById("valForkliftDist");
  const sliderStackHeight = document.getElementById("sliderStackHeight");
  const valStackHeight = document.getElementById("valStackHeight");
  const sliderAisleClear = document.getElementById("sliderAisleClear");
  const valAisleClear = document.getElementById("valAisleClear");
  const sliderOccupancy = document.getElementById("sliderOccupancy");
  const valOccupancy = document.getElementById("valOccupancy");
  const toggleRestrictedZone = document.getElementById("toggleRestrictedZone");
  const togglePPE = document.getElementById("togglePPE");

  const openRulesModal = () => { if (rulesModal) rulesModal.classList.add("active"); };
  const closeRulesModal = () => { if (rulesModal) rulesModal.classList.remove("active"); };

  if (openRulesBtn) openRulesBtn.addEventListener("click", openRulesModal);
  if (rulesModalCloseBtn) rulesModalCloseBtn.addEventListener("click", closeRulesModal);
  if (rulesModalDismissBtn) rulesModalDismissBtn.addEventListener("click", closeRulesModal);

  // Sync sliders text
  if (sliderForkliftDist) {
    sliderForkliftDist.addEventListener("input", (e) => {
      if (valForkliftDist) valForkliftDist.textContent = `${parseFloat(e.target.value).toFixed(1)}m`;
    });
  }
  if (sliderStackHeight) {
    sliderStackHeight.addEventListener("input", (e) => {
      if (valStackHeight) valStackHeight.textContent = `${parseFloat(e.target.value).toFixed(1)}m`;
    });
  }
  if (sliderAisleClear) {
    sliderAisleClear.addEventListener("input", (e) => {
      if (valAisleClear) valAisleClear.textContent = `${parseFloat(e.target.value).toFixed(1)}m`;
    });
  }
  if (sliderOccupancy) {
    sliderOccupancy.addEventListener("input", (e) => {
      if (valOccupancy) valOccupancy.textContent = `${e.target.value} Workers`;
    });
  }

  // Fetch initial rules config from API
  fetch("/api/rules/config")
    .then(res => res.json())
    .then(cfg => {
      if (sliderForkliftDist) sliderForkliftDist.value = cfg.min_forklift_worker_distance_m || 3.0;
      if (valForkliftDist) valForkliftDist.textContent = `${(cfg.min_forklift_worker_distance_m || 3.0).toFixed(1)}m`;
      if (sliderStackHeight) sliderStackHeight.value = cfg.max_stack_height_m || 2.2;
      if (valStackHeight) valStackHeight.textContent = `${(cfg.max_stack_height_m || 2.2).toFixed(1)}m`;
      if (sliderAisleClear) sliderAisleClear.value = cfg.min_aisle_clearance_m || 1.5;
      if (valAisleClear) valAisleClear.textContent = `${(cfg.min_aisle_clearance_m || 1.5).toFixed(1)}m`;
      if (sliderOccupancy) sliderOccupancy.value = cfg.max_zone_occupancy || 6;
      if (valOccupancy) valOccupancy.textContent = `${cfg.max_zone_occupancy || 6} Workers`;
      if (toggleRestrictedZone) toggleRestrictedZone.checked = cfg.restricted_zone_enabled !== false;
      if (togglePPE) togglePPE.checked = cfg.ppe_helmet_required !== false;
    })
    .catch(() => {});

  // Save rules config to Edge Gateway
  if (saveRulesBtn) {
    saveRulesBtn.addEventListener("click", async () => {
      const payload = {
        min_forklift_worker_distance_m: parseFloat(sliderForkliftDist.value),
        max_stack_height_m: parseFloat(sliderStackHeight.value),
        min_aisle_clearance_m: parseFloat(sliderAisleClear.value),
        max_zone_occupancy: parseInt(sliderOccupancy.value),
        restricted_zone_enabled: toggleRestrictedZone.checked,
        ppe_helmet_required: togglePPE.checked
      };

      try {
        const res = await fetch("/api/rules/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        saveRulesBtn.textContent = "✓ Applied to Edge!";
        setTimeout(() => {
          saveRulesBtn.textContent = "Apply to Edge Gateway";
          closeRulesModal();
        }, 1200);
      } catch (err) {
        console.error("Rules save error:", err);
      }
    });
  }

  // --- 9. Multi-Agent Intelligence Graph Modal ---
  const agentGraphModal = document.getElementById("agentGraphModal");
  const openAgentGraphBtn = document.getElementById("openAgentGraphBtn");
  const agentModalCloseBtn = document.getElementById("agentModalCloseBtn");
  const agentModalDismissBtn = document.getElementById("agentModalDismissBtn");

  const openAgentModal = () => { if (agentGraphModal) agentGraphModal.classList.add("active"); };
  const closeAgentModal = () => { if (agentGraphModal) agentGraphModal.classList.remove("active"); };

  if (openAgentGraphBtn) openAgentGraphBtn.addEventListener("click", openAgentModal);
  if (agentModalCloseBtn) agentModalCloseBtn.addEventListener("click", closeAgentModal);
  if (agentModalDismissBtn) agentModalDismissBtn.addEventListener("click", closeAgentModal);

  // --- 10. Physical Safety Nodes Hardware Polling ---
  window.acknowledgeNode = async (nodeId) => {
    try {
      await fetch(`/api/nodes/${nodeId}/acknowledge`, { method: "POST" });
      pollPhysicalNodes();
    } catch (e) {
      console.error(e);
    }
  };

  async function pollPhysicalNodes() {
    try {
      const res = await fetch("/api/nodes");
      if (!res.ok) return;
      const nodes = await res.json();

      nodes.forEach(node => {
        if (node.node_id === "NODE_ZONE_01") {
          updateNodeCard("node01Led", "node01Speaker", "node01Oled", node);
        } else if (node.node_id === "NODE_ZONE_02") {
          updateNodeCard("node02Led", "node02Speaker", "node02Oled", node);
        }
      });
    } catch (e) {
      // Offline fallback
    }
  }

  function updateNodeCard(ledId, speakerId, oledId, node) {
    const ledEl = document.getElementById(ledId);
    const spkEl = document.getElementById(speakerId);
    const oledEl = document.getElementById(oledId);

    if (ledEl) {
      ledEl.className = "actuator-badge";
      if (node.led_state === "RED_STROBE") {
        ledEl.classList.add("badge-red-strobe");
        ledEl.textContent = "RED STROBE";
      } else if (node.led_state === "YELLOW_PULSE") {
        ledEl.classList.add("badge-yellow-pulse");
        ledEl.textContent = "YELLOW PULSE";
      } else {
        ledEl.classList.add("badge-green");
        ledEl.textContent = "GREEN NORMAL";
      }
    }

    if (spkEl) {
      spkEl.className = "actuator-badge";
      if (node.speaker_state === "CRITICAL_SIREN") {
        spkEl.classList.add("badge-red-strobe");
        spkEl.textContent = "SIREN CRITICAL";
      } else if (node.speaker_state === "WARN_CHIME") {
        spkEl.classList.add("badge-yellow-pulse");
        spkEl.textContent = "AUDIBLE CHIME";
      } else {
        spkEl.classList.add("badge-gray");
        spkEl.textContent = "SILENT";
      }
    }

    if (oledEl && node.oled_display_lines) {
      oledEl.innerHTML = node.oled_display_lines.map(line => `<div>${line}</div>`).join("");
    }
  }

  setInterval(pollPhysicalNodes, 2000);
  pollPhysicalNodes();

  // --- 11. Distributed Edge Inference Cluster Telemetry Polling ---
  const clusterNodesVal = document.getElementById("clusterNodesVal");
  const clusterLowCompVal = document.getElementById("clusterLowCompVal");
  const clusterVisionVal = document.getElementById("clusterVisionVal");
  const clusterSavingsVal = document.getElementById("clusterSavingsVal");

  async function pollClusterTelemetry() {
    try {
      const res = await fetch("/api/cluster/nodes");
      if (!res.ok) return;
      const data = await res.json();
      if (clusterNodesVal) clusterNodesVal.textContent = `${data.total_edge_nodes || 5} Edge Nodes (${data.total_cameras_monitored || 50} Cams)`;
      if (clusterLowCompVal) clusterLowCompVal.textContent = `${data.cameras_in_low_compute || 42} Cams (<1ms Activity Filter)`;
      if (clusterVisionVal) clusterVisionVal.textContent = `${data.cameras_in_vision_analysis || 8} Cams (YOLO + ByteTrack)`;
      if (clusterSavingsVal) clusterSavingsVal.textContent = data.cluster_gpu_savings_pct || "84.0%";
    } catch (e) {
      // Offline fallback
    }
  }
  setInterval(pollClusterTelemetry, 3000);
  pollClusterTelemetry();

  // --- 12. Human-in-the-Loop AI Suggested Rules (Pending Review) ---
  const pendingRulesModal = document.getElementById("pendingRulesModal");
  const openPendingRulesBtn = document.getElementById("openPendingRulesBtn");
  const pendingRulesModalCloseBtn = document.getElementById("pendingRulesModalCloseBtn");
  const pendingRulesModalDismissBtn = document.getElementById("pendingRulesModalDismissBtn");
  const pendingRulesList = document.getElementById("pendingRulesList");
  const pendingRulesBadge = document.getElementById("pendingRulesBadge");

  const openPendingRules = () => {
    fetchPendingRules();
    if (pendingRulesModal) pendingRulesModal.classList.add("active");
  };
  const closePendingRules = () => {
    if (pendingRulesModal) pendingRulesModal.classList.remove("active");
  };

  if (openPendingRulesBtn) openPendingRulesBtn.addEventListener("click", openPendingRules);
  if (pendingRulesModalCloseBtn) pendingRulesModalCloseBtn.addEventListener("click", closePendingRules);
  if (pendingRulesModalDismissBtn) pendingRulesModalDismissBtn.addEventListener("click", closePendingRules);

  async function fetchPendingRules() {
    try {
      const res = await fetch("/api/rules/pending");
      if (!res.ok) return;
      const rules = await res.json();

      const pendingOnly = rules.filter(r => r.status === "PENDING_SUPERVISOR_APPROVAL");
      if (pendingRulesBadge) pendingRulesBadge.textContent = pendingOnly.length;

      if (!pendingRulesList) return;

      if (rules.length === 0) {
        pendingRulesList.innerHTML = `<div style="padding:16px; text-align:center; color:#64748B;">No candidate rules currently proposed.</div>`;
        return;
      }

      pendingRulesList.innerHTML = rules.map(r => {
        const isApproved = r.status === "APPROVED_BY_SUPERVISOR";
        const isRejected = r.status === "REJECTED_BY_SUPERVISOR";

        return `
          <div style="background:#FFFFFF; border:1px solid ${isApproved ? '#86EFAC' : (isRejected ? '#FCA5A5' : '#FCD34D')}; border-radius:10px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div>
                <strong style="font-size:14px; color:#1E293B;">${r.title}</strong>
                <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; background:#EFF6FF; color:#1D4ED8;">${r.category}</span>
              </div>
              <span style="font-size:11px; padding:2px 8px; border-radius:4px; font-weight:600; ${isApproved ? 'background:#DCFCE7; color:#166534;' : (isRejected ? 'background:#FEE2E2; color:#991B1B;' : 'background:#FEF3C7; color:#92400E;')}">
                ${r.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p style="font-size:13px; color:#475569; margin-bottom:8px; line-height:1.4;">${r.description}</p>
            <div style="font-size:12px; color:#64748B; margin-bottom:12px;">
              <span>Suggested Threshold: <strong style="color:#1E293B;">${r.suggested_threshold}</strong></span> • 
              <span>Source: ${r.proposed_by}</span>
            </div>
            ${(!isApproved && !isRejected) ? `
              <div style="display:flex; gap:8px;">
                <button onclick="approveRule('${r.rule_id}')" style="background:#16A34A; color:#FFFFFF; border:none; border-radius:6px; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer;">
                  ✓ Approve into Deterministic Engine
                </button>
                <button onclick="rejectRule('${r.rule_id}')" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer;">
                  Reject
                </button>
              </div>
            ` : (isApproved ? `<div style="font-size:12px; color:#166534; font-weight:600;">✓ In active deterministic enforcement at Edge Gateway.</div>` : '')}
          </div>
        `;
      }).join("");

    } catch (e) {
      console.error("Failed to fetch pending rules:", e);
    }
  }

  window.approveRule = async (ruleId) => {
    try {
      const res = await fetch(`/api/rules/pending/${ruleId}/approve`, { method: "POST" });
      const data = await res.json();
      alert(`Rule Approved! "${data.rule.title}" has been incorporated into active deterministic constraints.`);
      fetchPendingRules();
    } catch (e) {
      console.error(e);
    }
  };

  window.rejectRule = async (ruleId) => {
    try {
      await fetch(`/api/rules/pending/${ruleId}/reject`, { method: "POST" });
      fetchPendingRules();
    } catch (e) {
      console.error(e);
    }
  };

  // --- 13. Render Asynchronous Workflows Modal & Live Visualizer ---
  const renderWorkflowModal = document.getElementById("renderWorkflowModal");
  const openRenderWorkflowBtn = document.getElementById("openRenderWorkflowBtn");
  const renderWorkflowModalCloseBtn = document.getElementById("renderWorkflowModalCloseBtn");
  const renderWorkflowModalDismissBtn = document.getElementById("renderWorkflowModalDismissBtn");
  const triggerWorkflowBtn = document.getElementById("triggerWorkflowBtn");
  const renderWfId = document.getElementById("renderWfId");
  const renderWfStatus = document.getElementById("renderWfStatus");
  const renderWfProgress = document.getElementById("renderWfProgress");
  const renderWorkflowStepsList = document.getElementById("renderWorkflowStepsList");

  let renderPollingInterval = null;

  const openRenderWorkflow = () => {
    fetchLatestWorkflow();
    if (renderWorkflowModal) renderWorkflowModal.classList.add("active");
    if (!renderPollingInterval) {
      renderPollingInterval = setInterval(fetchLatestWorkflow, 1000);
    }
  };

  const closeRenderWorkflow = () => {
    if (renderWorkflowModal) renderWorkflowModal.classList.remove("active");
    if (renderPollingInterval) {
      clearInterval(renderPollingInterval);
      renderPollingInterval = null;
    }
  };

  if (openRenderWorkflowBtn) openRenderWorkflowBtn.addEventListener("click", openRenderWorkflow);
  if (renderWorkflowModalCloseBtn) renderWorkflowModalCloseBtn.addEventListener("click", closeRenderWorkflow);
  if (renderWorkflowModalDismissBtn) renderWorkflowModalDismissBtn.addEventListener("click", closeRenderWorkflow);

  if (triggerWorkflowBtn) {
    triggerWorkflowBtn.addEventListener("click", async () => {
      triggerWorkflowBtn.disabled = true;
      triggerWorkflowBtn.textContent = "⏳ Launching Workflow...";
      try {
        await fetch("/api/incidents/simulate", { method: "POST" });
        await fetchLatestWorkflow();
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => {
          triggerWorkflowBtn.disabled = false;
          triggerWorkflowBtn.textContent = "⚡ Trigger New Incident Workflow";
        }, 1000);
      }
    });
  }

  async function fetchLatestWorkflow() {
    try {
      const res = await fetch("/api/workflows/latest");
      if (!res.ok) return;
      const wf = await res.json();
      if (!wf || wf.status === "idle") return;

      if (renderWfId) renderWfId.textContent = wf.workflow_id;
      if (renderWfStatus) {
        renderWfStatus.textContent = wf.status;
        renderWfStatus.style.background = wf.status === "COMPLETED" ? "#ECFDF5" : "#EFF6FF";
        renderWfStatus.style.color = wf.status === "COMPLETED" ? "#059669" : "#1D4ED8";
        renderWfStatus.style.borderColor = wf.status === "COMPLETED" ? "#A7F3D0" : "#BFDBFE";
      }
      if (renderWfProgress) renderWfProgress.textContent = `${wf.progress_pct || 0}%`;

      if (renderWorkflowStepsList && Array.isArray(wf.steps)) {
        renderWorkflowStepsList.innerHTML = wf.steps.map(s => {
          const isDone = s.status === "COMPLETED";
          const isRunning = s.status === "RUNNING";
          const statusBg = isDone ? "#ECFDF5" : (isRunning ? "#EFF6FF" : "#F8FAFC");
          const statusColor = isDone ? "#059669" : (isRunning ? "#2563EB" : "#94A3B8");
          const statusIcon = isDone ? "✓" : (isRunning ? "⟳" : "○");

          const artifactPreview = s.artifacts ? Object.entries(s.artifacts).map(([k, v]) => {
            const valStr = typeof v === 'object' ? JSON.stringify(v) : v;
            return `<span style="display:inline-block; margin-right:8px; font-size:10px; color:#475569;"><strong>${k}:</strong> ${valStr}</span>`;
          }).join("") : "";

          return `
            <div style="background:${statusBg}; border:1px solid ${isDone ? '#A7F3D0' : (isRunning ? '#BFDBFE' : '#E2E8F0')}; border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:${isDone ? '#10B981' : (isRunning ? '#2563EB' : '#CBD5E1')}; color:#FFFFFF; font-size:11px; font-weight:800;">
                    ${statusIcon}
                  </span>
                  <strong style="font-size:12px; color:#1E293B;">${s.name}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:10px; font-family:monospace; color:#64748B;">${s.latency_ms > 0 ? s.latency_ms + 'ms' : (isRunning ? 'executing...' : 'queued')}</span>
                  <span style="font-size:10px; font-weight:700; color:${statusColor}; text-transform:uppercase;">${s.status}</span>
                </div>
              </div>
              ${artifactPreview ? `<div style="margin-left:28px; padding-top:4px; border-top:1px dashed #E2E8F0;">${artifactPreview}</div>` : ''}
            </div>
          `;
        }).join("");
      }
    } catch (e) {
      console.error("Failed to fetch latest workflow:", e);
    }
  }

  // Initial fetch of pending rules count
  fetchPendingRules();
  fetchLatestWorkflow();

  // Load initial scenario 1 on startup
  fetch("/api/demo/scenario/scenario_1_entrance", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      activeIncidentData = data;
      updateIncidentCard(data);
    })
    .catch(() => {});
});


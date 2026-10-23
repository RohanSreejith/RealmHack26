import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// Types
import {
  SiteOverview,
  Zone,
  Incident,
  EdgeNode,
  SwarmStatus,
  RiskLevel
} from './types';

// Services & Data
import { apiService } from './services/api';
import { webSocketService } from './services/websocket';
import { notificationService } from './services/notifications';
import {
  INITIAL_SITE_OVERVIEW,
  INITIAL_ZONES,
  MOCK_INCIDENTS,
  INITIAL_EDGE_NODES,
  INITIAL_SWARM_STATUS,
  DEMO_STEPS
} from './data/mockData';

// Components
import { Header } from './components/Header';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { SafetyDemoController } from './components/SafetyDemoController';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { LiveScreen } from './screens/LiveScreen';
import { IncidentsScreen } from './screens/IncidentsScreen';
import { IncidentDetailScreen } from './screens/IncidentDetailScreen';
import { SwarmScreen } from './screens/SwarmScreen';
import { EdgeNodesScreen } from './screens/EdgeNodesScreen';
import { SiteMapScreen } from './screens/SiteMapScreen';

type TabType = 'dashboard' | 'live' | 'incidents' | 'swarm' | 'nodes' | 'map';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Core Data States
  const [overview, setOverview] = useState<SiteOverview>(INITIAL_SITE_OVERVIEW);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [nodes, setNodes] = useState<EdgeNode[]>(INITIAL_EDGE_NODES);
  const [swarm, setSwarm] = useState<SwarmStatus>(INITIAL_SWARM_STATUS);

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Connection State
  const [cloudStatus, setCloudStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('CONNECTED');

  // Real-Time Alert Modal State
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [emergencyIncident, setEmergencyIncident] = useState<Incident | null>(null);

  // Interactive 12-Step Demo State
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Initialize and connect WebSocket
  useEffect(() => {
    webSocketService.connect();

    const unsubWs = webSocketService.subscribe((event) => {
      if (event?.type === 'CRITICAL_SAFETY_ALERT' && event.incident) {
        handleIncomingCriticalAlert(event.incident);
      }
    });

    const unsubState = webSocketService.subscribeConnectionState((state) => {
      setCloudStatus(state);
    });

    loadInitialData();

    return () => {
      unsubWs();
      unsubState();
      webSocketService.disconnect();
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, []);

  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [ov, zs, incs, nds, sw] = await Promise.all([
        apiService.getSiteOverview(),
        apiService.getZones(),
        apiService.getIncidents(),
        apiService.getEdgeNodes(),
        apiService.getSwarmStatus()
      ]);
      setOverview(ov);
      setZones(zs);
      setIncidents(incs);
      setNodes(nds);
      setSwarm(sw);
    } catch (err) {
      console.log("Error loading initial data", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleIncomingCriticalAlert = (incident: Incident) => {
    setEmergencyIncident(incident);
    setAlertModalVisible(true);
    notificationService.triggerCriticalAlert(
      "🚨 Hack-Eye Critical Alert",
      `${incident.title} in ${incident.zone}. Immediate attention required.`,
      { incidentId: incident.id }
    );
  };

  // Supervisor Actions
  const handleAcknowledgeIncident = async (incidentId: string) => {
    const updated = await apiService.acknowledgeIncident(incidentId, "Supervisor Dave");
    if (updated) {
      setIncidents(prev => prev.map(i => i.id === incidentId ? updated : i));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(updated);
      }
    }
    setAlertModalVisible(false);
  };

  const handleResolveIncident = async (incidentId: string, note: string) => {
    const res = await apiService.resolveIncident(incidentId, note);
    if (res) {
      setIncidents(prev => prev.map(i => i.id === incidentId ? res.incident : i));
      setSelectedIncident(res.incident);
      setOverview(res.updatedSite);
      // Refresh zones
      const zs = await apiService.getZones();
      setZones(zs);
    }
    setAlertModalVisible(false);
  };

  // 12-STEP SAFETY DEMO CONTROLLER ENGINE
  const executeDemoStep = (stepIdx: number) => {
    setDemoStepIndex(stepIdx);
    const stepNumber = stepIdx + 1;

    switch (stepNumber) {
      case 1:
        // Baseline: All zones SAFE
        setOverview({
          ...INITIAL_SITE_OVERVIEW,
          status: 'SAFE',
          statusMessage: 'All monitored zones operating normally. Site is SAFE.',
          activeIncidentsCount: 0
        });
        setZones(prev => prev.map(z => ({ ...z, status: 'SAFE', activeHazards: 0 })));
        setSelectedIncident(null);
        setAlertModalVisible(false);
        setActiveTab('dashboard');
        break;

      case 2:
        // Worker enters excavation zone
        setActiveTab('live');
        setSelectedZone(zones.find(z => z.id === 'zone-excavation'));
        break;

      case 3:
        // Excavator hydraulic rotation active
        setActiveTab('live');
        break;

      case 4:
        // Deterministic Safety Engine triggers alert
        setOverview(prev => ({
          ...prev,
          status: 'CRITICAL',
          statusMessage: 'Worker-Machine Proximity Breach in Excavation Zone',
          activeIncidentsCount: 1
        }));
        setZones(prev => prev.map(z => z.id === 'zone-excavation' ? { ...z, status: 'CRITICAL', activeHazards: 1 } : z));
        setActiveTab('dashboard');
        break;

      case 5:
        // Real-time phone alert received
        {
          const target = MOCK_INCIDENTS[0];
          handleIncomingCriticalAlert(target);
        }
        break;

      case 6:
        // Open incident detail
        {
          const target = MOCK_INCIDENTS[0];
          setAlertModalVisible(false);
          setSelectedIncident(target);
          setActiveTab('incidents');
        }
        break;

      case 7:
        // Show camera evidence
        // (Visible in incident detail)
        break;

      case 8:
        // Safety Engine vs AI Risk Analysis
        break;

      case 9:
        // Recommended action & OSHA citation
        break;

      case 10:
        // Supervisor acknowledges incident
        {
          const target = MOCK_INCIDENTS[0];
          handleAcknowledgeIncident(target.id);
        }
        break;

      case 11:
        // Open Swarm View (Node 01 -> Node 02 awareness broadcasted)
        setSelectedIncident(null);
        setActiveTab('swarm');
        break;

      case 12:
        // Supervisor resolves incident -> Dashboard returns to SAFE
        {
          const target = MOCK_INCIDENTS[0];
          handleResolveIncident(target.id, "Worker moved outside operating zone.");
          setActiveTab('dashboard');
        }
        break;
    }
  };

  const handleNextDemoStep = () => {
    if (demoStepIndex < DEMO_STEPS.length - 1) {
      executeDemoStep(demoStepIndex + 1);
    } else {
      executeDemoStep(0);
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStepIndex > 0) {
      executeDemoStep(demoStepIndex - 1);
    }
  };

  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    } else {
      setIsAutoPlaying(true);
      autoPlayTimerRef.current = setInterval(() => {
        setDemoStepIndex(prev => {
          const next = prev + 1;
          if (next >= DEMO_STEPS.length) {
            clearInterval(autoPlayTimerRef.current!);
            setIsAutoPlaying(false);
            return 0;
          }
          executeDemoStep(next);
          return next;
        });
      }, 4000);
    }
  };

  const handleResetDemo = () => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    setIsAutoPlaying(false);
    executeDemoStep(0);
  };

  // If user is not logged in, render the login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => setIsAuthenticated(true)}
        onEnterDemoMode={() => {
          setIsAuthenticated(true);
          setIsDemoActive(true);
          executeDemoStep(0);
        }}
      />
    );
  }

  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <Header
        onOpenDemo={() => setIsDemoActive(prev => !prev)}
        isDemoActive={isDemoActive}
        edgeOnline={true}
        cloudStatus={cloudStatus}
      />

      {/* Connection Lost Alert Bar (if disconnected) */}
      {cloudStatus === 'RECONNECTING' && (
        <View style={styles.reconnectingBar}>
          <Feather name="wifi-off" size={13} color="#F59E0B" />
          <Text style={styles.reconnectingText}>
            LIVE CONNECTION LOST • Edge nodes buffering locally • Reconnecting...
          </Text>
        </View>
      )}

      {/* Main Screen Body */}
      <View style={styles.screenContainer}>
        {selectedIncident ? (
          <IncidentDetailScreen
            incident={selectedIncident}
            onBack={() => setSelectedIncident(null)}
            onAcknowledge={handleAcknowledgeIncident}
            onResolve={handleResolveIncident}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardScreen
                overview={overview}
                zones={zones}
                isRefreshing={isRefreshing}
                onRefresh={loadInitialData}
                onSelectZone={(z) => {
                  setSelectedZone(z);
                  setActiveTab('live');
                }}
                onNavigateToLive={() => setActiveTab('live')}
                onNavigateToIncidents={() => setActiveTab('incidents')}
              />
            )}

            {activeTab === 'live' && (
              <LiveScreen
                initialZone={selectedZone}
                onViewIncidentDetail={(incId) => {
                  const target = incidents.find(i => i.id === incId);
                  if (target) setSelectedIncident(target);
                }}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentsScreen
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {activeTab === 'swarm' && (
              <SwarmScreen swarm={swarm} nodes={nodes} />
            )}

            {activeTab === 'nodes' && (
              <EdgeNodesScreen nodes={nodes} />
            )}

            {activeTab === 'map' && (
              <SiteMapScreen
                zones={zones}
                incidents={incidents}
                onOpenLiveCamera={(z) => {
                  setSelectedZone(z);
                  setActiveTab('live');
                }}
                onOpenIncident={(inc) => setSelectedIncident(inc)}
              />
            )}
          </>
        )}
      </View>

      {/* Interactive 12-Step Safety Demo Dock */}
      {isDemoActive && (
        <SafetyDemoController
          currentStepIndex={demoStepIndex}
          isAutoPlaying={isAutoPlaying}
          onNextStep={handleNextDemoStep}
          onPrevStep={handlePrevDemoStep}
          onToggleAutoPlay={handleToggleAutoPlay}
          onResetDemo={handleResetDemo}
          onClose={() => setIsDemoActive(false)}
        />
      )}

      {/* Real-Time Critical Incident Pop-up Modal */}
      <EmergencyAlertModal
        visible={alertModalVisible}
        incident={emergencyIncident}
        onViewIncident={(inc) => {
          setAlertModalVisible(false);
          setSelectedIncident(inc);
        }}
        onAcknowledge={(inc) => {
          handleAcknowledgeIncident(inc.id);
        }}
        onDismiss={() => setAlertModalVisible(false)}
      />

      {/* Bottom Industrial Navigation Bar */}
      {!selectedIncident && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('dashboard')}
          >
            <Feather
              name="grid"
              size={18}
              color={activeTab === 'dashboard' ? "#06B6D4" : "#64748B"}
            />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('live')}
          >
            <Feather
              name="video"
              size={18}
              color={activeTab === 'live' ? "#06B6D4" : "#64748B"}
            />
            <Text style={[styles.tabLabel, activeTab === 'live' && styles.tabLabelActive]}>
              Live
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('incidents')}
          >
            <View>
              <Feather
                name="alert-triangle"
                size={18}
                color={activeTab === 'incidents' ? "#06B6D4" : "#64748B"}
              />
              {activeIncidentsCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{activeIncidentsCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'incidents' && styles.tabLabelActive]}>
              Incidents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('swarm')}
          >
            <MaterialCommunityIcons
              name="radio-tower"
              size={20}
              color={activeTab === 'swarm' ? "#06B6D4" : "#64748B"}
            />
            <Text style={[styles.tabLabel, activeTab === 'swarm' && styles.tabLabelActive]}>
              Swarm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('nodes')}
          >
            <Feather
              name="server"
              size={18}
              color={activeTab === 'nodes' ? "#06B6D4" : "#64748B"}
            />
            <Text style={[styles.tabLabel, activeTab === 'nodes' && styles.tabLabelActive]}>
              Nodes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('map')}
          >
            <Feather
              name="map"
              size={18}
              color={activeTab === 'map' ? "#06B6D4" : "#64748B"}
            />
            <Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  reconnectingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A1F0D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  reconnectingText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#06B6D4',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
});

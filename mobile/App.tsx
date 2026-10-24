import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Types & Services
import { Incident } from './types';
import { apiService } from './services/api';
import { MOCK_INCIDENTS } from './data/mockData';

// Focused Components
import { AppHeader } from './components/AppHeader';
import { AlertBanner } from './components/AlertBanner';
import { IncidentVideoClip } from './components/IncidentVideoClip';
import { IncidentAnalysisView } from './components/IncidentAnalysisView';
import { IncidentHistoryList } from './components/IncidentHistoryList';

type ViewMode = 'active' | 'history';

export default function App() {
  // Navigation: Focused on Active Incident & Event History
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  // Core Data States
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [activeIncident, setActiveIncident] = useState<Incident>(MOCK_INCIDENTS[0]);
  const [activeAlert, setActiveAlert] = useState<Incident | null>(MOCK_INCIDENTS[0]);

  // Loading & State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('CONNECTED');

  const prevIncidentCount = useRef<number>(MOCK_INCIDENTS.length);

  // Trigger haptic & sound alert
  const triggerAlertFeedback = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {}
  };

  // Fetch incidents from backend
  const loadIncidents = useCallback(async (isInitial = false) => {
    try {
      const isOnline = await apiService.checkLiveBackend();
      setCloudStatus(isOnline ? 'CONNECTED' : 'OFFLINE');

      const fetched = await apiService.getIncidents();
      if (fetched && fetched.length > 0) {
        setIncidents(fetched);

        // Check if a new incident has arrived
        if (!isInitial && fetched.length > prevIncidentCount.current) {
          const newest = fetched[0];
          setActiveIncident(newest);
          setActiveAlert(newest);
          triggerAlertFeedback();
        } else if (isInitial) {
          setActiveIncident(fetched[0]);
          if (fetched[0].status === 'ACTIVE') {
            setActiveAlert(fetched[0]);
          }
        }
        prevIncidentCount.current = fetched.length;
      }
    } catch {
      setCloudStatus('OFFLINE');
    }
  }, []);

  // Initial load and real-time polling every 3 seconds
  useEffect(() => {
    loadIncidents(true);

    const interval = setInterval(() => {
      loadIncidents(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadIncidents]);

  // Manual pull to refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadIncidents(false);
    setIsRefreshing(false);
  };

  // Handle incoming simulation alert
  const handleSimulateAlert = async () => {
    setIsSimulating(true);
    try {
      const simulated = await apiService.simulateIncident();
      if (simulated) {
        setIncidents(prev => [simulated, ...prev.filter(i => i.id !== simulated.id)]);
        setActiveIncident(simulated);
        setActiveAlert(simulated);
        setViewMode('active');
        triggerAlertFeedback();
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle supervisor acknowledge
  const handleAcknowledge = async (incidentId: string) => {
    setIsAcknowledging(true);
    try {
      const updated = await apiService.acknowledgeIncident(incidentId, "Karthik (Supervisor)");
      if (updated) {
        setIncidents(prev => prev.map(i => i.id === incidentId ? updated : i));
        if (activeIncident.id === incidentId) {
          setActiveIncident(updated);
        }
        if (activeAlert?.id === incidentId) {
          setActiveAlert(null);
        }
      }
    } finally {
      setIsAcknowledging(false);
    }
  };

  // When a user selects an incident from history
  const handleSelectFromHistory = (incident: Incident) => {
    setActiveIncident(incident);
    setViewMode('active');
  };

  const activeAlertCount = incidents.filter(i => i.status === 'ACTIVE').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header matching Hack-Eye Industrial Theme */}
      <AppHeader
        onSimulateAlert={handleSimulateAlert}
        isSimulating={isSimulating}
        cloudStatus={cloudStatus}
        activeAlertCount={activeAlertCount}
      />

      {/* Real-time Alert Banner when an incident occurs */}
      {activeAlert && activeAlert.status === 'ACTIVE' && (
        <AlertBanner
          incident={activeAlert}
          onAcknowledge={handleAcknowledge}
          onInspect={() => {
            setActiveIncident(activeAlert);
            setViewMode('active');
          }}
          onDismiss={() => setActiveAlert(null)}
        />
      )}

      {/* Segmented Control Bar */}
      <View style={styles.segmentedTabBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'active' && styles.segmentBtnActive]}
          onPress={() => setViewMode('active')}
          activeOpacity={0.8}
        >
          <Feather
            name="activity"
            size={14}
            color={viewMode === 'active' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.segmentBtnText, viewMode === 'active' && styles.segmentBtnTextActive]}>
            INCIDENT CLIP & AI ANALYSIS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'history' && styles.segmentBtnActive]}
          onPress={() => setViewMode('history')}
          activeOpacity={0.8}
        >
          <Feather
            name="clock"
            size={14}
            color={viewMode === 'history' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.segmentBtnText, viewMode === 'history' && styles.segmentBtnTextActive]}>
            AUDIT HISTORY ({incidents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {viewMode === 'active' ? (
          <View style={styles.activeViewContainer}>
            {/* Top Indicator */}
            <View style={styles.activeHeaderStrip}>
              <View style={styles.liveIndicatorRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveIndicatorText}>
                  INSPECTING: {activeIncident.incidentCode} • {activeIncident.zone.toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.historyLinkBtn}
                onPress={() => setViewMode('history')}
                activeOpacity={0.7}
              >
                <Text style={styles.historyLinkText}>View All History ({incidents.length}) &gt;</Text>
              </TouchableOpacity>
            </View>

            {/* 1. Event Clip Player (2-4s event replay) */}
            <IncidentVideoClip
              clipUrl={activeIncident.clipUrl}
              incidentCode={activeIncident.incidentCode}
              cameraName={activeIncident.cameraName}
              riskLevel={activeIncident.riskLevel}
              ttcSeconds={activeIncident.deterministicTrigger?.ttcSeconds || 1.4}
              distanceMeters={activeIncident.deterministicTrigger?.distanceMeters || 1.8}
              machineName={activeIncident.machineName}
            />

            {/* 2. Full AI Multi-Agent Incident Analysis */}
            <IncidentAnalysisView
              incident={activeIncident}
              onAcknowledge={handleAcknowledge}
              isAcknowledging={isAcknowledging}
            />
          </View>
        ) : (
          <View style={styles.historyViewContainer}>
            {/* Incident History Audit List */}
            <IncidentHistoryList
              incidents={incidents}
              selectedIncidentId={activeIncident.id}
              onSelectIncident={handleSelectFromHistory}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF2F7'
  },
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10
  },
  segmentBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3
  },
  segmentBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800'
  },
  mainScrollView: {
    flex: 1
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 30
  },
  activeViewContainer: {
    gap: 6
  },
  activeHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2563EB'
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5
  },
  historyLinkBtn: {
    paddingVertical: 2
  },
  historyLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  historyViewContainer: {
    paddingTop: 6
  }
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Zone, Incident } from '../types';

interface SiteMapScreenProps {
  zones: Zone[];
  incidents: Incident[];
  onOpenLiveCamera: (zone: Zone) => void;
  onOpenIncident: (incident: Incident) => void;
}

export const SiteMapScreen: React.FC<SiteMapScreenProps> = ({
  zones,
  incidents,
  onOpenLiveCamera,
  onOpenIncident
}) => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const getZoneStatus = (zoneId: string) => {
    const z = zones.find(item => item.id === zoneId);
    return z?.status || 'SAFE';
  };

  const getZoneColor = (status: string) => {
    if (status === 'CRITICAL') return '#EF4444';
    if (status === 'WARNING') return '#F59E0B';
    return '#10B981';
  };

  const getZoneBg = (status: string) => {
    if (status === 'CRITICAL') return 'rgba(239, 68, 68, 0.18)';
    if (status === 'WARNING') return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(16, 185, 129, 0.12)';
  };

  const selectedZoneIncidents = selectedZone
    ? incidents.filter(i => i.zoneId === selectedZone.id || i.zone.toLowerCase().includes(selectedZone.name.toLowerCase().replace(' zone', '')))
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>FACILITY SITE MAP</Text>
        <Text style={styles.subtitle}>
          Spatial zone layout and dynamic safety perimeter statuses. Tap any zone sector to inspect active personnel, machinery, and cameras.
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>SAFE</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>WARNING</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>CRITICAL</Text>
        </View>
      </View>

      {/* Interactive Architectural Site Map Blueprint */}
      <View style={styles.blueprintContainer}>
        <View style={styles.blueprintHeader}>
          <MaterialCommunityIcons name="floor-plan" size={16} color="#06B6D4" />
          <Text style={styles.blueprintHeaderText}>TERMINAL ALPHA 09 • GROUND SECTORS</Text>
        </View>

        {/* Sector Grid Blueprint */}
        <View style={styles.sectorGrid}>
          {zones.map((zone) => {
            const status = zone.status;
            const borderCol = getZoneColor(status);
            const bgCol = getZoneBg(status);

            return (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.sectorBox,
                  { borderColor: borderCol, backgroundColor: bgCol }
                ]}
                onPress={() => setSelectedZone(zone)}
                activeOpacity={0.7}
              >
                <View style={styles.sectorTopRow}>
                  <Text style={styles.sectorIdTag}>{zone.cameraIds[0] || 'NODE'}</Text>
                  <View style={[styles.statusDot, { backgroundColor: borderCol }]} />
                </View>

                <Text style={styles.sectorName} numberOfLines={2}>
                  {zone.name}
                </Text>

                <View style={styles.sectorMetrics}>
                  <Text style={styles.sectorMetricText}>{zone.workerCount} Workers</Text>
                  <Text style={styles.sectorMetricDot}>•</Text>
                  <Text style={styles.sectorMetricText}>{zone.machineCount} Machines</Text>
                </View>

                {zone.status === 'CRITICAL' && (
                  <View style={styles.hazardAlertPill}>
                    <Text style={styles.hazardAlertPillText}>BREACH DETECTED</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Zone Detail Modal Sheet */}
      <Modal
        visible={!!selectedZone}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedZone(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedZone && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>{selectedZone.name}</Text>
                    <Text style={styles.sheetSubtitle}>{selectedZone.description}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedZone(null)}>
                    <Feather name="x" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetStatsGrid}>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatLabel}>CAMERAS</Text>
                    <Text style={styles.sheetStatVal}>{selectedZone.cameraIds.join(', ')}</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatLabel}>CURRENT WORKERS</Text>
                    <Text style={styles.sheetStatVal}>{selectedZone.workerCount} Personnel</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatLabel}>MACHINERY</Text>
                    <Text style={styles.sheetStatVal}>{selectedZone.machineCount} Units</Text>
                  </View>
                  <View style={styles.sheetStatBox}>
                    <Text style={styles.sheetStatLabel}>SECTOR RISK</Text>
                    <Text style={[styles.sheetStatVal, { color: getZoneColor(selectedZone.status) }]}>
                      {selectedZone.status}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.openCameraBtn}
                  onPress={() => {
                    const z = selectedZone;
                    setSelectedZone(null);
                    onOpenLiveCamera(z);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="video" size={16} color="#0B0F17" />
                  <Text style={styles.openCameraBtnText}>OPEN LIVE CAMERA FEED</Text>
                </TouchableOpacity>

                {/* Active / Recent Incidents in Zone */}
                <Text style={styles.zoneIncidentsHeader}>INCIDENTS IN THIS SECTOR</Text>
                {selectedZoneIncidents.length > 0 ? (
                  selectedZoneIncidents.map((inc) => (
                    <TouchableOpacity
                      key={inc.id}
                      style={styles.zoneIncidentItem}
                      onPress={() => {
                        setSelectedZone(null);
                        onOpenIncident(inc);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.zoneIncCode}>{inc.incidentCode} • {inc.title}</Text>
                        <Text style={styles.zoneIncTime}>{inc.timestamp} ({inc.durationSeconds}s duration)</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#06B6D4" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noIncidentsText}>No safety breaches recorded in this zone today.</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  blueprintContainer: {
    backgroundColor: '#131B2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  blueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  blueprintHeaderText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectorBox: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  sectorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectorIdTag: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectorName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginVertical: 4,
  },
  sectorMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectorMetricText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  sectorMetricDot: {
    color: '#475569',
    fontSize: 10,
  },
  hazardAlertPill: {
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    borderRadius: 3,
    alignItems: 'center',
    marginTop: 4,
  },
  hazardAlertPillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#131B2A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#06B6D4',
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    maxWidth: '90%',
  },
  sheetStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sheetStatBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0B0F17',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sheetStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetStatVal: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  openCameraBtnText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  zoneIncidentsHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  zoneIncidentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F17',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  zoneIncCode: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  zoneIncTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  noIncidentsText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

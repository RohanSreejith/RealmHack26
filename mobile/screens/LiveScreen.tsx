import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Zone } from '../types';

interface LiveScreenProps {
  initialZone?: Zone;
  onViewIncidentDetail?: (incidentId: string) => void;
}

const CAMERAS = [
  { id: 'CAM-03', name: 'Excavation Sector North', zone: 'EXCAVATION ZONE', fps: 18.4, status: 'CRITICAL', workers: 4, machines: 2 },
  { id: 'CAM-01', name: 'Loading Bay Door 02', zone: 'LOADING ZONE', fps: 18.0, status: 'WARNING', workers: 3, machines: 1 },
  { id: 'CAM-04', name: 'Material Storage Aisle 04', zone: 'MATERIAL STORAGE', fps: 18.2, status: 'SAFE', workers: 5, machines: 3 },
  { id: 'CAM-06', name: 'Assembly Line Station B', zone: 'ASSEMBLY ZONE', fps: 18.1, status: 'SAFE', workers: 5, machines: 2 },
];

export const LiveScreen: React.FC<LiveScreenProps> = ({
  initialZone,
  onViewIncidentDetail
}) => {
  const [selectedCam, setSelectedCam] = useState(
    initialZone?.cameraIds[0] ? CAMERAS.find(c => c.id === initialZone.cameraIds[0]) || CAMERAS[0] : CAMERAS[0]
  );
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [pulseBreach, setPulseBreach] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      setPulseBreach(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCritical = selectedCam.status === 'CRITICAL';
  const isWarning = selectedCam.status === 'WARNING';
  const statusColor = isCritical ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');

  return (
    <ScrollView style={styles.container}>
      {/* 1. CAMERA SELECTOR PILLS */}
      <View style={styles.cameraSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {CAMERAS.map((cam) => {
            const isSelected = cam.id === selectedCam.id;
            return (
              <TouchableOpacity
                key={cam.id}
                style={[
                  styles.camPill,
                  isSelected && styles.camPillSelected,
                  cam.status === 'CRITICAL' && styles.camPillCritical
                ]}
                onPress={() => setSelectedCam(cam)}
                activeOpacity={0.7}
              >
                <Feather
                  name="video"
                  size={12}
                  color={isSelected ? "#0B0F17" : (cam.status === 'CRITICAL' ? "#EF4444" : "#94A3B8")}
                />
                <Text style={[
                  styles.camPillText,
                  isSelected && styles.camPillTextSelected,
                  !isSelected && cam.status === 'CRITICAL' && { color: '#EF4444' }
                ]}>
                  {cam.id}
                </Text>
                {cam.status === 'CRITICAL' && (
                  <View style={styles.alertDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. CAMERA HEADER */}
      <View style={styles.cameraHeader}>
        <View>
          <Text style={styles.camTitle}>{selectedCam.name}</Text>
          <Text style={styles.camZone}>{selectedCam.zone}</Text>
        </View>

        <View style={styles.edgeBadgeGroup}>
          <View style={styles.edgeStatusPill}>
            <View style={styles.pulseGreen} />
            <Text style={styles.edgeStatusText}>EDGE AI ONLINE</Text>
          </View>
          <Text style={styles.fpsText}>{selectedCam.fps} FPS</Text>
        </View>
      </View>

      {/* 3. SIMULATED COMPUTER VISION EDGE STREAM CANVAS */}
      <View style={styles.videoCanvasContainer}>
        <View style={[styles.videoFrame, isCritical && styles.videoFrameCritical]}>
          {/* Simulated Dark Industrial Scene */}
          <View style={styles.gridOverlay} />

          {/* Machine Detection Bounding Box */}
          <View style={[styles.boxMachine, isCritical && styles.boxMachineActive]}>
            <View style={styles.tagLabelMachine}>
              <MaterialCommunityIcons name="excavator" size={12} color="#0B0F17" />
              <Text style={styles.tagTextMachine}>EX-02 HYDRAULIC (95%)</Text>
            </View>
            <View style={styles.swingRadiusIndicator}>
              <Text style={styles.swingRadiusText}>DANGER SWING RADIUS 3.5m</Text>
            </View>
          </View>

          {/* Worker Detection Bounding Box */}
          <View style={[styles.boxWorker, isCritical && (pulseBreach ? styles.boxWorkerBreach : styles.boxWorkerBreachPulse)]}>
            <View style={styles.tagLabelWorker}>
              <MaterialCommunityIcons name="hard-hat" size={12} color="#FFFFFF" />
              <Text style={styles.tagTextWorker}>W-104 GROUND CREW (98%)</Text>
            </View>
          </View>

          {/* Proximity Distance Vector Line Simulation */}
          {isCritical && (
            <View style={styles.distanceVectorBox}>
              <View style={styles.vectorDottedLine} />
              <View style={styles.distanceBadge}>
                <MaterialCommunityIcons name="arrow-left-right" size={12} color="#EF4444" />
                <Text style={styles.distanceText}>2.1 m (TTC: 1.4s)</Text>
              </View>
            </View>
          )}

          {/* HUD Top Bar Overlay */}
          <View style={styles.hudTopBar}>
            <View style={styles.recIndicator}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>LIVE STREAM</Text>
            </View>
            <Text style={styles.timestampHud}>{currentTime}</Text>
          </View>

          {/* HUD Bottom Bar Overlay */}
          <View style={styles.hudBottomBar}>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>LATENCY</Text>
              <Text style={styles.hudStatVal}>14 ms (LOCAL)</Text>
            </View>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>YOLOv8</Text>
              <Text style={styles.hudStatVal}>INFERENCE ACTIVE</Text>
            </View>
            <View style={styles.hudStat}>
              <Text style={styles.hudStatLabel}>STATUS</Text>
              <Text style={[styles.hudStatVal, { color: statusColor }]}>{selectedCam.status}</Text>
            </View>
          </View>
        </View>

        {/* Caption communicating Edge vs Mobile Architecture */}
        <View style={styles.edgeArchitectNotice}>
          <MaterialCommunityIcons name="server-network" size={14} color="#06B6D4" />
          <Text style={styles.edgeArchitectText}>
            Edge Node 01 processes frames via TensorRT &amp; evaluates deterministic safety rules in 24ms. Mobile app displays telemetry.
          </Text>
        </View>
      </View>

      {/* 4. CAMERA METRICS & ACTIVE DETECTIONS */}
      <View style={styles.telemetrySection}>
        <Text style={styles.sectionHeading}>ZONE OBJECT TRACKING</Text>

        <View style={styles.objectGrid}>
          <View style={styles.objectCard}>
            <View style={styles.objIconBadge}>
              <Feather name="users" size={18} color="#06B6D4" />
            </View>
            <View style={styles.objContent}>
              <Text style={styles.objCount}>{selectedCam.workers}</Text>
              <Text style={styles.objName}>Personnel Monitored</Text>
              <Text style={styles.objStatusOk}>✓ 100% PPE Compliant</Text>
            </View>
          </View>

          <View style={styles.objectCard}>
            <View style={styles.objIconBadge}>
              <MaterialCommunityIcons name="forklift" size={18} color="#F59E0B" />
            </View>
            <View style={styles.objContent}>
              <Text style={styles.objCount}>{selectedCam.machines}</Text>
              <Text style={styles.objName}>Machinery Operating</Text>
              <Text style={isCritical ? styles.objStatusDanger : styles.objStatusOk}>
                {isCritical ? "⚠ Hydraulic Active" : "Normal Velocity"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 5. RECENT ZONE EVENTS LOG */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionHeading}>ZONE MICRO-EVENTS</Text>

        <View style={styles.eventRow}>
          <View style={styles.eventTimeCol}>
            <Text style={styles.eventTime}>14:32:18</Text>
          </View>
          <View style={[styles.eventBadge, { backgroundColor: '#EF4444' }]} />
          <View style={styles.eventTextCol}>
            <Text style={styles.eventTitle}>Worker-Machine Proximity Threshold Breached</Text>
            <Text style={styles.eventDetail}>Distance 2.1m &lt; 3.5m threshold • Local siren fired</Text>
          </View>
          {onViewIncidentDetail && (
            <TouchableOpacity
              style={styles.inspectBtn}
              onPress={() => onViewIncidentDetail('inc-1042')}
            >
              <Text style={styles.inspectBtnText}>INSPECT</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.eventRow}>
          <View style={styles.eventTimeCol}>
            <Text style={styles.eventTime}>14:31:02</Text>
          </View>
          <View style={[styles.eventBadge, { backgroundColor: '#10B981' }]} />
          <View style={styles.eventTextCol}>
            <Text style={styles.eventTitle}>Excavator CAT-320 Initialized Swing Rotation</Text>
            <Text style={styles.eventDetail}>RPM nominal • Direction: Clockwise 22 deg/s</Text>
          </View>
        </View>

        <View style={styles.eventRow}>
          <View style={styles.eventTimeCol}>
            <Text style={styles.eventTime}>14:28:44</Text>
          </View>
          <View style={[styles.eventBadge, { backgroundColor: '#10B981' }]} />
          <View style={styles.eventTextCol}>
            <Text style={styles.eventTitle}>Worker W-104 Entered Trench Approach Path</Text>
            <Text style={styles.eventDetail}>Class 2 High-Vis &amp; Hard Hat Confirmed</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  cameraSelector: {
    backgroundColor: '#0B0F17',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  camPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131B2A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  camPillSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  camPillCritical: {
    borderColor: '#EF4444',
  },
  camPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  camPillTextSelected: {
    color: '#0B0F17',
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  camTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  camZone: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  edgeBadgeGroup: {
    alignItems: 'flex-end',
  },
  edgeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0D261E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  pulseGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  edgeStatusText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fpsText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  videoCanvasContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  videoFrame: {
    height: 230,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFrameCritical: {
    borderColor: '#EF4444',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill as any,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  boxMachine: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 130,
    height: 110,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  boxMachineActive: {
    borderColor: '#F59E0B',
  },
  tagLabelMachine: {
    position: 'absolute',
    top: -18,
    left: -2,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  tagTextMachine: {
    color: '#0B0F17',
    fontSize: 8,
    fontWeight: '900',
  },
  swingRadiusIndicator: {
    position: 'absolute',
    bottom: -15,
    left: -2,
    backgroundColor: '#0B0F17',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  swingRadiusText: {
    color: '#F59E0B',
    fontSize: 7,
    fontWeight: '800',
  },
  boxWorker: {
    position: 'absolute',
    top: 75,
    right: 40,
    width: 65,
    height: 95,
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  boxWorkerBreach: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  boxWorkerBreachPulse: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  tagLabelWorker: {
    position: 'absolute',
    top: -18,
    left: -2,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  tagTextWorker: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  distanceVectorBox: {
    position: 'absolute',
    top: 95,
    left: 145,
    width: 90,
    alignItems: 'center',
  },
  vectorDottedLine: {
    width: 80,
    height: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1015',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  distanceText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  hudTopBar: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  recText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  timestampHud: {
    color: '#CBD5E1',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hudBottomBar: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 15, 23, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  hudStat: {
    alignItems: 'center',
  },
  hudStatLabel: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudStatVal: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  edgeArchitectNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C202F',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06B6D4',
    marginTop: 8,
  },
  edgeArchitectText: {
    color: '#BAE6FD',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  telemetrySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  objectGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  objectCard: {
    flex: 1,
    backgroundColor: '#131B2A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  objIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#0B0F17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  objContent: {
    flex: 1,
  },
  objCount: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  objName: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  objStatusOk: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  objStatusDanger: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  eventsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  eventTimeCol: {
    width: 55,
  },
  eventTime: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  eventBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  eventTextCol: {
    flex: 1,
  },
  eventTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  eventDetail: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  inspectBtn: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },
  inspectBtnText: {
    color: '#0B0F17',
    fontSize: 9,
    fontWeight: '900',
  },
});

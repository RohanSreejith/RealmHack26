import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Incident } from '../types';
import { RiskAnalysis } from '../components/RiskAnalysis';

interface IncidentDetailScreenProps {
  incident: Incident;
  onBack: () => void;
  onAcknowledge: (incidentId: string) => Promise<void>;
  onResolve: (incidentId: string, note: string) => Promise<void>;
}

export const IncidentDetailScreen: React.FC<IncidentDetailScreenProps> = ({
  incident,
  onBack,
  onAcknowledge,
  onResolve
}) => {
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNote, setResolutionNote] = useState(
    'Worker moved outside operating zone and excavator paused until perimeter cleared.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResolved = incident.status === 'RESOLVED';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';
  const isCritical = incident.riskLevel === 'CRITICAL';

  const riskColor = isCritical ? '#EF4444' : '#F59E0B';

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await onAcknowledge(incident.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolutionNote.trim()) {
      Alert.alert("Resolution Note Required", "Please enter a brief note explaining the safety resolution.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onResolve(incident.id, resolutionNote);
      setResolveModalVisible(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color="#F8FAFC" />
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.codePill}>
          <Text style={styles.codePillText}>{incident.incidentCode}</Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: isResolved ? '#10B981' : (isAcknowledged ? '#06B6D4' : '#EF4444') }]}>
          <Text style={[styles.statusBadgeText, { color: isResolved ? '#10B981' : (isAcknowledged ? '#06B6D4' : '#EF4444') }]}>
            {incident.status}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Incident Summary Hero */}
        <View style={[styles.heroCard, { borderColor: riskColor }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>
              <Text style={styles.zoneSubtitle}>{incident.zone} • {incident.cameraName}</Text>
            </View>

            <View style={[styles.riskTag, { backgroundColor: isCritical ? '#2B1215' : '#2A1F0D', borderColor: riskColor }]}>
              <Text style={[styles.riskTagText, { color: riskColor }]}>{incident.riskLevel}</Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>TIME OF EVENT</Text>
              <Text style={styles.metaVal}>{incident.timestamp}</Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>DURATION</Text>
              <Text style={styles.metaVal}>{incident.durationSeconds} seconds</Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>PRIMARY CAMERA</Text>
              <Text style={styles.metaVal}>{incident.cameraId}</Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>MIN CLOSING DIST</Text>
              <Text style={[styles.metaVal, { color: '#EF4444' }]}>
                {incident.deterministicTrigger.distanceMeters} m
              </Text>
            </View>
          </View>
        </View>

        {/* Camera Frame Visual Evidence */}
        <View style={styles.evidenceCard}>
          <View style={styles.evidenceHeader}>
            <View style={styles.evidenceTitleRow}>
              <MaterialCommunityIcons name="camera-iris" size={16} color="#06B6D4" />
              <Text style={styles.evidenceTitle}>CAMERA SNAPSHOT EVIDENCE</Text>
            </View>
            <Text style={styles.evidenceCameraTag}>{incident.cameraId} OVERHEAD</Text>
          </View>

          {/* Annotated Evidence Canvas */}
          <View style={styles.annotatedCanvas}>
            {/* Visual Box 1: Machine */}
            <View style={styles.annotatedMachineBox}>
              <Text style={styles.boxTagText}>EX-02 HYDRAULIC BOOM</Text>
            </View>

            {/* Visual Box 2: Worker */}
            <View style={styles.annotatedWorkerBox}>
              <Text style={styles.boxTagText}>W-104 (PROXIMITY BREACH)</Text>
            </View>

            {/* Dotted vector line */}
            <View style={styles.vectorLine}>
              <Text style={styles.vectorDistanceLabel}>2.1m CLOSING</Text>
            </View>

            <View style={styles.timestampWatermark}>
              <Text style={styles.watermarkText}>EVIDENCE CAPTURE • {incident.timestamp}</Text>
            </View>
          </View>
          <Text style={styles.evidenceCaption}>
            Annotated bounding boxes and optical distance vectors captured by Edge Node 01.
          </Text>
        </View>

        {/* Existing Resolution / Acknowledged Banner */}
        {isAcknowledged && !isResolved && (
          <View style={styles.ackBanner}>
            <Feather name="check-circle" size={16} color="#06B6D4" />
            <Text style={styles.ackBannerText}>
              Acknowledged by {incident.acknowledgedBy} at {incident.acknowledgedAt}
            </Text>
          </View>
        )}

        {isResolved && (
          <View style={styles.resolvedBanner}>
            <Feather name="check" size={16} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.resolvedTitle}>INCIDENT RESOLVED</Text>
              <Text style={styles.resolvedNote}>"{incident.resolutionNote}"</Text>
              <Text style={styles.resolvedTime}>Resolved at {incident.resolvedAt}</Text>
            </View>
          </View>
        )}

        {/* Safety Detection Result + AI Risk Analysis Component */}
        <RiskAnalysis incident={incident} />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Supervisor Action Bar */}
      {!isResolved && (
        <View style={styles.bottomActionBar}>
          {!isAcknowledged && (
            <TouchableOpacity
              style={styles.ackButton}
              onPress={handleAcknowledge}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Feather name="bell-off" size={18} color="#0B0F17" />
              <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => setResolveModalVisible(true)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Feather name="shield" size={18} color="#F8FAFC" />
            <Text style={styles.resolveButtonText}>RESOLVE INCIDENT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resolve Incident Note Modal */}
      <Modal
        visible={resolveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="#10B981" />
              <Text style={styles.modalTitle}>Resolve Incident {incident.incidentCode}</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              Please enter supervisor resolution notes for EHS compliance audit and n8n reporting:
            </Text>

            <TextInput
              style={styles.noteInput}
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="e.g. Worker moved outside operating zone."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setResolveModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmResolveBtn}
                onPress={handleConfirmResolve}
                disabled={isSubmitting}
              >
                <Feather name="check" size={16} color="#0B0F17" />
                <Text style={styles.confirmResolveText}>CONFIRM &amp; RESTORE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  codePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codePillText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#131B2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  incidentTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  zoneSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  riskTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskTagText: {
    fontSize: 11,
    fontWeight: '900',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metaBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#0B0F17',
    padding: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaVal: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  evidenceCard: {
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  evidenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  evidenceTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  evidenceCameraTag: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '700',
  },
  annotatedCanvas: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  annotatedMachineBox: {
    position: 'absolute',
    top: 30,
    left: 20,
    width: 120,
    height: 100,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 4,
  },
  annotatedWorkerBox: {
    position: 'absolute',
    top: 50,
    right: 30,
    width: 70,
    height: 80,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    padding: 4,
  },
  boxTagText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },
  vectorLine: {
    position: 'absolute',
    top: 75,
    left: 140,
    right: 100,
    height: 2,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vectorDistanceLabel: {
    backgroundColor: '#1E1015',
    color: '#EF4444',
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: -14,
  },
  timestampWatermark: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  watermarkText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
  },
  evidenceCaption: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  ackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C2735',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
    marginBottom: 14,
  },
  ackBannerText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#0D261E',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 14,
  },
  resolvedTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  resolvedNote: {
    color: '#F0FDF4',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  resolvedTime: {
    color: '#6EE7B7',
    fontSize: 10,
    marginTop: 4,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  ackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 8,
  },
  ackButtonText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resolveButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
  },
  resolveButtonText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#131B2A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  noteInput: {
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    color: '#F8FAFC',
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmResolveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmResolveText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

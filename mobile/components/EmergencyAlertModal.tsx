import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Incident } from '../types';

interface EmergencyAlertModalProps {
  visible: boolean;
  incident: Incident | null;
  onViewIncident: (incident: Incident) => void;
  onAcknowledge: (incident: Incident) => void;
  onDismiss?: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  visible,
  incident,
  onViewIncident,
  onAcknowledge,
  onDismiss,
}) => {
  if (!incident) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Siren Bar */}
          <View style={styles.sirenHeader}>
            <View style={styles.sirenPill}>
              <MaterialCommunityIcons name="alarm-light" size={24} color="#EF4444" />
              <Text style={styles.sirenHeaderText}>🚨 CRITICAL SAFETY ALERT</Text>
            </View>
          </View>

          {/* Core Danger Statement */}
          <View style={styles.statementArea}>
            <Text style={styles.headline}>
              Worker detected inside Excavator Safety Zone
            </Text>
            <Text style={styles.subheadline}>
              Immediate dangerous proximity breach detected by Edge Node 01
            </Text>
          </View>

          {/* Context Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>ZONE</Text>
              <Text style={styles.detailValue}>{incident.zone}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>CAMERA</Text>
              <Text style={styles.detailValue}>{incident.cameraId}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>TIME</Text>
              <Text style={styles.detailValue}>{incident.timestamp}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>CLOSING DISTANCE</Text>
              <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                {incident.deterministicTrigger.distanceMeters} m
              </Text>
            </View>
          </View>

          {/* Edge Detection Rule Proof */}
          <View style={styles.ruleBadge}>
            <Feather name="shield" size={14} color="#06B6D4" />
            <Text style={styles.ruleText}>
              Rule: Distance &lt; 3.5m &amp; Hydraulic Swing Active (TTC 1.4s)
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onViewIncident(incident)}
              activeOpacity={0.8}
            >
              <Feather name="eye" size={18} color="#0B0F17" />
              <Text style={styles.primaryButtonText}>VIEW INCIDENT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => onAcknowledge(incident)}
              activeOpacity={0.8}
            >
              <Feather name="check" size={18} color="#E2E8F0" />
              <Text style={styles.secondaryButtonText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#EF4444',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sirenHeader: {
    backgroundColor: '#250E13',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
    alignItems: 'center',
  },
  sirenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sirenHeaderText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  statementArea: {
    padding: 18,
    alignItems: 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  subheadline: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  detailBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C2735',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06B6D4',
    marginBottom: 18,
  },
  ruleText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  primaryButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#0B0F17',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

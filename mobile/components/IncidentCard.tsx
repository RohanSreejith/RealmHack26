import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Incident } from '../types';

interface IncidentCardProps {
  incident: Incident;
  onPress: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onPress }) => {
  const isCritical = incident.riskLevel === 'CRITICAL';
  const isWarning = incident.riskLevel === 'WARNING';
  const isResolved = incident.status === 'RESOLVED';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';

  const riskColor = isCritical ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');
  const statusColor = isResolved ? '#10B981' : (isAcknowledged ? '#06B6D4' : '#EF4444');
  const statusBg = isResolved ? '#0D261E' : (isAcknowledged ? '#0C2735' : '#2B1215');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCritical && !isResolved && styles.cardCritical,
        isResolved && styles.cardResolved
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.headerRow}>
        <View style={styles.codeGroup}>
          <Text style={styles.codeText}>{incident.incidentCode}</Text>
          <View style={[styles.riskPill, { borderColor: riskColor }]}>
            <Text style={[styles.riskPillText, { color: riskColor }]}>{incident.riskLevel}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {incident.status}
          </Text>
        </View>
      </View>

      <Text style={styles.incidentTitle}>{incident.title}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
          <Text style={styles.infoLabel}>Zone:</Text>
          <Text style={styles.infoValue}>{incident.zone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Feather name="video" size={13} color="#94A3B8" />
          <Text style={styles.infoLabel}>Camera:</Text>
          <Text style={styles.infoValue}>{incident.cameraId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Feather name="clock" size={13} color="#94A3B8" />
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{incident.timestamp}</Text>
          <Text style={styles.durationTag}>({incident.durationSeconds}s duration)</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="hard-hat" size={14} color="#06B6D4" />
          <Text style={styles.infoLabel}>Worker:</Text>
          <Text style={styles.infoValue}>{incident.workerName.split(' ')[0]} ({incident.workerId})</Text>
        </View>
      </View>

      {/* Immediate trigger summary bar */}
      <View style={styles.triggerBar}>
        <MaterialCommunityIcons name="lightning-bolt" size={13} color="#06B6D4" />
        <Text style={styles.triggerText} numberOfLines={1}>
          Trigger: {incident.deterministicTrigger.triggerHeadline}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.aiConfidenceText}>
          AI Confidence: {Math.round(incident.aiRiskAnalysis.confidence * 100)}%
        </Text>
        <View style={styles.actionPrompt}>
          <Text style={styles.actionPromptText}>Inspect Evidence</Text>
          <Feather name="chevron-right" size={14} color="#06B6D4" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardCritical: {
    borderColor: '#EF4444',
    backgroundColor: '#16131D',
  },
  cardResolved: {
    borderColor: '#1E293B',
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  riskPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  riskPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  incidentTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoGrid: {
    gap: 4,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  durationTag: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 4,
  },
  triggerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B0F17',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  triggerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  aiConfidenceText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
});

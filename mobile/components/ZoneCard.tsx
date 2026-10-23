import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Zone } from '../types';

interface ZoneCardProps {
  zone: Zone;
  onPress: () => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onPress }) => {
  const isCritical = zone.status === 'CRITICAL';
  const isWarning = zone.status === 'WARNING';

  const statusColor = isCritical ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');
  const statusBg = isCritical ? '#2B1215' : (isWarning ? '#2A1F0D' : '#0D261E');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCritical && styles.cardCritical,
        isWarning && styles.cardWarning
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.zoneName}>{zone.name}</Text>
          <View style={styles.cameraRow}>
            <Feather name="video" size={12} color="#64748B" />
            <Text style={styles.camerasText}>
              {zone.cameraIds.join(' • ')}
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <View style={[styles.pillDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{zone.status}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {zone.description}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.metricsGroup}>
          <View style={styles.metricItem}>
            <Feather name="user" size={13} color="#06B6D4" />
            <Text style={styles.metricText}>
              <Text style={styles.metricBold}>{zone.workerCount}</Text> Workers
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="forklift" size={14} color="#F59E0B" />
            <Text style={styles.metricText}>
              <Text style={styles.metricBold}>{zone.machineCount}</Text> Machines
            </Text>
          </View>
        </View>

        <View style={styles.arrowGroup}>
          <Text style={styles.liveFeedLabel}>LIVE VIEW</Text>
          <Feather name="chevron-right" size={16} color="#06B6D4" />
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
    backgroundColor: '#17131F',
  },
  cardWarning: {
    borderColor: '#F59E0B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
  },
  zoneName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  camerasText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBold: {
    color: '#F1F5F9',
    fontWeight: '700',
  },
  metricText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#334155',
  },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveFeedLabel: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

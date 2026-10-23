import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SiteOverview } from '../types';

interface SafetyStatusProps {
  overview: SiteOverview;
}

export const SafetyStatus: React.FC<SafetyStatusProps> = ({ overview }) => {
  const isCritical = overview.status === 'CRITICAL';
  const isWarning = overview.status === 'WARNING';

  const badgeColor = isCritical ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');
  const badgeBg = isCritical ? '#2B1215' : (isWarning ? '#2A1F0D' : '#0D261E');

  return (
    <View style={styles.container}>
      {/* Site Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>SITE SAFETY OVERVIEW</Text>
        <Text style={styles.facilityText}>{overview.siteName} • {overview.facilityCode}</Text>
      </View>

      {/* Hero Status Banner */}
      <View style={[styles.heroCard, { borderColor: badgeColor, backgroundColor: badgeBg }]}>
        <View style={styles.heroTopRow}>
          <View style={styles.statusLabelGroup}>
            <Text style={styles.statusSubtext}>FACILITY STATUS</Text>
            <View style={styles.statusPillRow}>
              <MaterialCommunityIcons
                name={isCritical ? "alert-octagon" : (isWarning ? "alert" : "shield-check")}
                size={28}
                color={badgeColor}
              />
              <Text style={[styles.statusValue, { color: badgeColor }]}>{overview.status}</Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{overview.safetyScore}</Text>
            <Text style={styles.scoreLabel}>SAFETY INDEX</Text>
          </View>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.statusMessage}>{overview.statusMessage}</Text>
        </View>
      </View>

      {/* Key Metrics Bar */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={isCritical ? "#EF4444" : "#94A3B8"} />
            <Text style={styles.statBoxLabel}>Active Incidents</Text>
          </View>
          <Text style={[styles.statBoxValue, isCritical && { color: '#EF4444' }]}>
            {overview.activeIncidentsCount}
          </Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <Feather name="users" size={14} color="#06B6D4" />
            <Text style={styles.statBoxLabel}>Workers Monitored</Text>
          </View>
          <Text style={styles.statBoxValue}>{overview.workersMonitoredCount}</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <MaterialCommunityIcons name="forklift" size={16} color="#F59E0B" />
            <Text style={styles.statBoxLabel}>Machines Detected</Text>
          </View>
          <Text style={styles.statBoxValue}>{overview.machinesDetectedCount}</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <Feather name="calendar" size={14} color="#94A3B8" />
            <Text style={styles.statBoxLabel}>Today's Total</Text>
          </View>
          <Text style={styles.statBoxValue}>{overview.todayIncidentsCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBlock: {
    marginBottom: 10,
  },
  title: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  facilityText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabelGroup: {
    flex: 1,
  },
  statusSubtext: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scoreContainer: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  scoreNumber: {
    color: '#06B6D4',
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  messageBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusMessage: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#131B2A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statBoxLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statBoxValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
});

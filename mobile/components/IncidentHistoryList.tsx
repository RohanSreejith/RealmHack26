import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Incident } from '../types';

interface IncidentHistoryListProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onSelectIncident: (incident: Incident) => void;
}

type FilterType = 'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED';

export const IncidentHistoryList: React.FC<IncidentHistoryListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return inc.riskLevel === 'CRITICAL';
    if (activeFilter === 'WARNING') return inc.riskLevel === 'WARNING';
    if (activeFilter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header and Filter Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Incident Audit History</Text>
          <Text style={styles.countSubtitle}>{filteredIncidents.length} events recorded</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {(['ALL', 'CRITICAL', 'WARNING', 'RESOLVED'] as FilterType[]).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color="#10B981" />
          <Text style={styles.emptyTitle}>No Incidents Found</Text>
          <Text style={styles.emptySubtitle}>All facilities within safe operating parameters.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            const isCritical = incident.riskLevel === 'CRITICAL';
            const riskColor = isCritical ? '#EF4444' : '#F59E0B';
            const isResolved = incident.status === 'RESOLVED';

            return (
              <TouchableOpacity
                key={incident.id}
                style={[
                  styles.incidentCard,
                  isSelected && styles.incidentCardSelected,
                  { borderLeftColor: riskColor }
                ]}
                onPress={() => onSelectIncident(incident)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.codeGroup}>
                    <Text style={[styles.incidentCodeText, { color: riskColor }]}>
                      {incident.incidentCode}
                    </Text>
                    <Text style={styles.cardTimestamp}>{incident.timestamp}</Text>
                  </View>

                  <View style={[styles.riskBadge, {
                    backgroundColor: isResolved ? '#ECFDF5' : (isCritical ? '#FEF2F2' : '#FEF3C7'),
                    borderColor: isResolved ? '#10B981' : riskColor
                  }]}>
                    <Text style={[styles.riskBadgeText, { color: isResolved ? '#059669' : riskColor }]}>
                      {incident.riskLevel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.incidentCardTitle} numberOfLines={1}>
                  {incident.title}
                </Text>

                <View style={styles.cardLocationRow}>
                  <Feather name="map-pin" size={11} color="#64748B" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {incident.zone} • {incident.cameraName}
                  </Text>
                </View>

                {/* Telemetry pill snippet */}
                <View style={styles.cardFooter}>
                  <View style={styles.metricTag}>
                    <Text style={styles.metricTagLabel}>TTC:</Text>
                    <Text style={[styles.metricTagVal, { color: riskColor }]}>
                      {incident.deterministicTrigger?.ttcSeconds || 1.4}s
                    </Text>
                  </View>

                  <View style={styles.metricTag}>
                    <Text style={styles.metricTagLabel}>DIST:</Text>
                    <Text style={styles.metricTagVal}>
                      {incident.deterministicTrigger?.distanceMeters || 1.8}m
                    </Text>
                  </View>

                  <View style={styles.clipAvailableBadge}>
                    <Feather name="play-circle" size={12} color="#2563EB" />
                    <Text style={styles.clipAvailableText}>View Clip & Analysis</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 30
  },
  headerRow: {
    gap: 10
  },
  titleGroup: {
    marginBottom: 4
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  countSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterPillSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3
  },
  filterPillTextSelected: {
    color: '#FFFFFF'
  },
  listContainer: {
    gap: 10
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  incidentCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderLeftWidth: 4
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  incidentCodeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  cardTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  incidentCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  metricTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  metricTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },
  metricTagVal: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0F172A'
  },
  clipAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  clipAvailableText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B'
  }
});

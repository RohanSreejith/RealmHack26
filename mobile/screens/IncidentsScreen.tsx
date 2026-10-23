import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Incident, RiskLevel, IncidentStatus } from '../types';
import { IncidentCard } from '../components/IncidentCard';

interface IncidentsScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentsScreen: React.FC<IncidentsScreenProps> = ({
  incidents,
  onSelectIncident
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'ALL'>('ALL');

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Risk filter
      if (selectedRisk !== 'ALL' && inc.riskLevel !== selectedRisk) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = inc.incidentCode.toLowerCase().includes(query);
        const matchesTitle = inc.title.toLowerCase().includes(query);
        const matchesZone = inc.zone.toLowerCase().includes(query);
        const matchesWorker = inc.workerName.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesZone && !matchesWorker) return false;
      }
      return true;
    });
  }, [incidents, selectedRisk, selectedStatus, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search incident ID, zone, worker, machine..."
            placeholderTextColor="#64748B"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills: Risk */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {(['ALL', 'CRITICAL', 'WARNING'] as const).map((risk) => {
            const isSelected = selectedRisk === risk;
            return (
              <TouchableOpacity
                key={risk}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setSelectedRisk(risk)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {risk === 'ALL' ? 'All Risks' : risk}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.pillDivider} />

          {/* Filter Pills: Status */}
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {status === 'ALL' ? 'All Statuses' : status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Incident List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCountText}>
            Showing {filteredIncidents.length} of {incidents.length} recorded events
          </Text>
        </View>

        {filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onPress={() => onSelectIncident(incident)}
          />
        ))}

        {filteredIncidents.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="shield" size={40} color="#334155" />
            <Text style={styles.emptyTitle}>No Incidents Found</Text>
            <Text style={styles.emptySubtitle}>No recorded safety events match your active filters.</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B0F17',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131B2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#131B2A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterPillSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  filterPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextSelected: {
    color: '#0B0F17',
  },
  pillDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  listContent: {
    padding: 16,
  },
  resultsCountRow: {
    marginBottom: 10,
  },
  resultsCountText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

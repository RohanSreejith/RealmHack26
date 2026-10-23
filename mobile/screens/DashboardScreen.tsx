import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafetyStatus } from '../components/SafetyStatus';
import { ZoneCard } from '../components/ZoneCard';
import { SiteOverview, Zone } from '../types';

interface DashboardScreenProps {
  overview: SiteOverview;
  zones: Zone[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectZone: (zone: Zone) => void;
  onNavigateToLive: () => void;
  onNavigateToIncidents: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  overview,
  zones,
  isRefreshing,
  onRefresh,
  onSelectZone,
  onNavigateToLive,
  onNavigateToIncidents
}) => {
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#06B6D4"
          colors={['#06B6D4']}
        />
      }
    >
      {/* 1. HERO SITE SAFETY OVERVIEW */}
      <SafetyStatus overview={overview} />

      {/* 2. QUICK ACTIONS & ALERTS STRIP */}
      {overview.activeIncidentsCount > 0 && (
        <View style={styles.actionStripContainer}>
          <TouchableOpacity
            style={styles.actionStrip}
            onPress={onNavigateToIncidents}
            activeOpacity={0.8}
          >
            <View style={styles.actionStripLeft}>
              <MaterialCommunityIcons name="alert-decagram" size={20} color="#EF4444" />
              <View>
                <Text style={styles.actionStripTitle}>
                  {overview.activeIncidentsCount} ACTIVE SAFETY BREACHES
                </Text>
                <Text style={styles.actionStripSubtitle}>
                  Tap to view root-cause analysis and actions
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. LIVE MONITORING ZONES SECTION */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <Text style={styles.sectionTitle}>LIVE MONITORING ZONES</Text>
          <Text style={styles.sectionSubtitle}>Distributed Edge Camera Feed Telemetry</Text>
        </View>

        <TouchableOpacity
          style={styles.viewLiveBtn}
          onPress={onNavigateToLive}
          activeOpacity={0.7}
        >
          <Feather name="video" size={13} color="#06B6D4" />
          <Text style={styles.viewLiveBtnText}>ALL CAMERAS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zonesList}>
        {zones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onPress={() => onSelectZone(zone)}
          />
        ))}
      </View>

      {/* 4. EDGE AI HARDWARE HEALTH BANNER */}
      <View style={styles.edgeNoticeCard}>
        <View style={styles.edgeNoticeHeader}>
          <MaterialCommunityIcons name="chip" size={18} color="#06B6D4" />
          <Text style={styles.edgeNoticeTitle}>EDGE COMPUTER VISION ARCHITECTURE</Text>
        </View>
        <Text style={styles.edgeNoticeBody}>
          Inference running locally on edge hardware nodes (18.4 FPS, 14ms latency). Deterministic rules trigger instant alarms. The mobile phone operates strictly as the supervisor management hub.
        </Text>
      </View>
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  actionStripContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#261215',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionStripTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionStripSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  viewLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#131B2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  viewLiveBtnText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zonesList: {
    paddingHorizontal: 16,
  },
  edgeNoticeCard: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: '#0E1726',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  edgeNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  edgeNoticeTitle: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  edgeNoticeBody: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 80,
  },
});

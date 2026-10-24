import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

interface AppHeaderProps {
  onSimulateAlert: () => void;
  isSimulating?: boolean;
  cloudStatus?: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  activeAlertCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSimulateAlert,
  isSimulating = false,
  cloudStatus = 'CONNECTED',
  activeAlertCount = 0
}) => {
  return (
    <View style={styles.headerWrapper}>
      {/* Brand & Action Top Row */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="shield-airplane" size={20} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>HACK-EYE</Text>
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>EDGE-FIRST</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Distributed Edge Safety Intelligence</Text>
          </View>
        </View>

        {/* Trigger / Test Alert Button */}
        <TouchableOpacity
          style={[styles.testAlertButton, isSimulating && styles.testAlertButtonActive]}
          onPress={onSimulateAlert}
          disabled={isSimulating}
          activeOpacity={0.8}
        >
          <Feather name="zap" size={13} color="#FFFFFF" />
          <Text style={styles.testAlertButtonText}>
            {isSimulating ? "TRIGGERING..." : "TEST ALERT"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Facility & Edge Cluster Telemetry Strip */}
      <View style={styles.telemetryStrip}>
        <View style={styles.facilityPill}>
          <Feather name="map-pin" size={12} color="#2563EB" />
          <Text style={styles.facilityText} numberOfLines={1}>
            Riverside Logistics Center
          </Text>
          <Text style={styles.facilitySub}>50 CAMS</Text>
        </View>

        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, cloudStatus === 'CONNECTED' ? styles.dotGreen : styles.dotAmber]} />
          <Text style={styles.statusLabel}>
            {cloudStatus === 'CONNECTED' ? 'EDGE ONLINE (<5ms)' : 'RECONNECTING'}
          </Text>
          {activeAlertCount > 0 && (
            <View style={styles.alertBadgeCount}>
              <Text style={styles.alertBadgeCountText}>{activeAlertCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  proPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  proPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.4
  },
  brandTagline: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500'
  },
  testAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  testAlertButtonActive: {
    backgroundColor: '#991B1B'
  },
  testAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1
  },
  facilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 150
  },
  facilitySub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  dotGreen: {
    backgroundColor: '#10B981'
  },
  dotAmber: {
    backgroundColor: '#F59E0B'
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  alertBadgeCount: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10
  },
  alertBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  }
});

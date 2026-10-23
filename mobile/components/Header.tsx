import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface HeaderProps {
  onOpenDemo?: () => void;
  isDemoActive?: boolean;
  edgeOnline?: boolean;
  cloudStatus?: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDemo,
  isDemoActive = false,
  edgeOnline = true,
  cloudStatus = 'CONNECTED'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoGroup}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="shield-alert-outline" size={22} color="#06B6D4" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>HACK-EYE</Text>
              <View style={styles.proTag}>
                <Text style={styles.proTagText}>ENTERPRISE</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Detect. Understand. Protect.</Text>
          </View>
        </View>

        {onOpenDemo && (
          <TouchableOpacity
            style={[styles.demoButton, isDemoActive && styles.demoButtonActive]}
            onPress={onOpenDemo}
            activeOpacity={0.7}
          >
            <Ionicons name="play-circle" size={16} color={isDemoActive ? "#0B0F17" : "#06B6D4"} />
            <Text style={[styles.demoButtonText, isDemoActive && styles.demoButtonTextActive]}>
              {isDemoActive ? "DEMO ACTIVE" : "SAFETY DEMO"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusStatusBar}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, edgeOnline ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>EDGE AI SWARM (4/4)</Text>
        </View>

        <View style={styles.dividerDot} />

        <View style={styles.statusIndicator}>
          <View style={[
            styles.dot,
            cloudStatus === 'CONNECTED' ? styles.dotCyan : (cloudStatus === 'RECONNECTING' ? styles.dotAmber : styles.dotRed)
          ]} />
          <Text style={styles.statusText}>
            {cloudStatus === 'CONNECTED' ? "RENDER CLOUD SYNC" : (cloudStatus === 'RECONNECTING' ? "RECONNECTING..." : "OFFLINE CACHE")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#131B2A',
    borderWidth: 1,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  proTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#06B6D4',
  },
  proTagText: {
    color: '#06B6D4',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#131B2A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  demoButtonActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  demoButtonText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  demoButtonTextActive: {
    color: '#0B0F17',
  },
  statusStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#131B2A',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotCyan: {
    backgroundColor: '#06B6D4',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
});

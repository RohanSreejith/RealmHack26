import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Incident } from '../types';

interface AlertBannerProps {
  incident: Incident;
  onAcknowledge: (incidentId: string) => Promise<void>;
  onInspect: () => void;
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  incident,
  onAcknowledge,
  onInspect,
  onDismiss
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const isCritical = incident.riskLevel === 'CRITICAL';
  const bannerColor = isCritical ? '#EF4444' : '#F59E0B';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[
      styles.bannerContainer,
      {
        borderColor: bannerColor,
        opacity: pulseAnim
      }
    ]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconBox, { backgroundColor: isCritical ? '#FEF2F2' : '#FEF3C7' }]}>
          <MaterialCommunityIcons
            name="alert-octagon"
            size={24}
            color={bannerColor}
          />
        </View>

        <View style={styles.textDetails}>
          <View style={styles.badgeRow}>
            <View style={[styles.alertTypeBadge, { backgroundColor: bannerColor }]}>
              <Text style={styles.alertTypeBadgeText}>
                {isCritical ? 'CRITICAL SAFETY ALERT' : 'SAFETY WARNING'}
              </Text>
            </View>
            <View style={styles.latencyPill}>
              <Text style={styles.latencyPillText}>FAST PATH &lt; 5ms</Text>
            </View>
          </View>

          <Text style={styles.bannerHeadline} numberOfLines={1}>
            {incident.title}
          </Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            {incident.zone} • Clearance {incident.deterministicTrigger?.distanceMeters || 1.8}m • TTC {incident.deterministicTrigger?.ttcSeconds || 1.4}s
          </Text>
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="x" size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.inspectButton}
          onPress={onInspect}
          activeOpacity={0.7}
        >
          <Feather name="play" size={14} color="#1E3A8A" />
          <Text style={styles.inspectButtonText}>WATCH EVENT CLIP & AI REASONING</Text>
        </TouchableOpacity>

        {incident.status === 'ACTIVE' && (
          <TouchableOpacity
            style={styles.ackButton}
            onPress={() => onAcknowledge(incident.id)}
            activeOpacity={0.7}
          >
            <Feather name="check" size={14} color="#FFFFFF" />
            <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textDetails: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  alertTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4
  },
  alertTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  latencyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  latencyPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  bannerHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  bannerSub: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500'
  },
  closeBtn: {
    padding: 4
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10
  },
  inspectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  inspectButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.3
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  ackButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3
  }
});

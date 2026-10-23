import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { DEMO_STEPS } from '../data/mockData';

interface SafetyDemoControllerProps {
  currentStepIndex: number;
  isAutoPlaying: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onToggleAutoPlay: () => void;
  onResetDemo: () => void;
  onClose: () => void;
}

export const SafetyDemoController: React.FC<SafetyDemoControllerProps> = ({
  currentStepIndex,
  isAutoPlaying,
  onNextStep,
  onPrevStep,
  onToggleAutoPlay,
  onResetDemo,
  onClose
}) => {
  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];
  const totalSteps = DEMO_STEPS.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <View style={styles.dock}>
      {/* Top Controller Bar */}
      <View style={styles.topBar}>
        <View style={styles.stepCounterGroup}>
          <View style={styles.demoPill}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#06B6D4" />
            <Text style={styles.demoPillText}>SUPERVISOR SAFETY DEMO</Text>
          </View>
          <Text style={styles.stepCountText}>
            Step {currentStep.stepNumber} of {totalSteps}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }]} />
      </View>

      {/* Step Description */}
      <View style={styles.contentArea}>
        <Text style={styles.stepTitle}>{currentStep.title}</Text>
        <Text style={styles.stepDesc}>{currentStep.description}</Text>
      </View>

      {/* Action Controls */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.smallBtn, isFirst && styles.btnDisabled]}
          onPress={onPrevStep}
          disabled={isFirst}
        >
          <Feather name="chevron-left" size={16} color={isFirst ? "#475569" : "#E2E8F0"} />
          <Text style={[styles.smallBtnText, isFirst && { color: '#475569' }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallBtn, isAutoPlaying && styles.autoPlayActive]}
          onPress={onToggleAutoPlay}
        >
          <Feather name={isAutoPlaying ? "pause" : "play"} size={14} color={isAutoPlaying ? "#0B0F17" : "#06B6D4"} />
          <Text style={[styles.smallBtnText, isAutoPlaying && { color: '#0B0F17' }]}>
            {isAutoPlaying ? "Pause" : "Auto-Play"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallBtn}
          onPress={onResetDemo}
        >
          <Feather name="rotate-ccw" size={14} color="#94A3B8" />
          <Text style={styles.smallBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryActionBtn, isLast && styles.resetEndBtn]}
          onPress={onNextStep}
        >
          <Text style={styles.primaryActionText}>
            {isLast ? "Restart ↺" : (currentStep.actionLabel || "Next Step ▶")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    backgroundColor: '#0F172A',
    borderTopWidth: 2,
    borderTopColor: '#06B6D4',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCounterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0C2735',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#06B6D4',
  },
  demoPillText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
  },
  contentArea: {
    marginBottom: 12,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  smallBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  autoPlayActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetEndBtn: {
    backgroundColor: '#10B981',
  },
  primaryActionText: {
    color: '#0B0F17',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

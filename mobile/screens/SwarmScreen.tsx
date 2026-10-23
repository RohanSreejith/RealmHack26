import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SwarmMap } from '../components/SwarmMap';
import { SwarmStatus, EdgeNode } from '../types';

interface SwarmScreenProps {
  swarm: SwarmStatus;
  nodes: EdgeNode[];
}

export const SwarmScreen: React.FC<SwarmScreenProps> = ({ swarm, nodes }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>HACK-EYE DISTRIBUTED SWARM</Text>
        <Text style={styles.subtitle}>
          Peer-to-peer industrial edge mesh network. No central point of failure.
        </Text>
      </View>

      <SwarmMap swarm={swarm} nodes={nodes} />

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 12,
  },
  mainTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});

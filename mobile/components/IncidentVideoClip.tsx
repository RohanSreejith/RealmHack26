import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

const NativeVideoPlayer: React.FC<{
  source: string;
  isPlaying: boolean;
}> = ({ source, isPlaying }) => {
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer(source, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isPlaying, player]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', ({ status }: any) => {
      if (status === 'readyToPlay') {
        setReady(true);
      }
    });
    const timer = setTimeout(() => setReady(true), 350);
    return () => {
      sub?.remove?.();
      clearTimeout(timer);
    };
  }, [player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={{ width: '100%', height: '100%' }}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
      {!ready && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }]}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      )}
    </View>
  );
};

class SafeNativeVideoBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.log('[SafeNativeVideoBoundary catch]', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface IncidentVideoClipProps {
  clipUrl?: string;
  incidentCode: string;
  cameraName: string;
  riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE';
  ttcSeconds?: number;
  distanceMeters?: number;
  machineName?: string;
}

export const IncidentVideoClip: React.FC<IncidentVideoClipProps> = ({
  clipUrl,
  incidentCode,
  cameraName,
  riskLevel,
  ttcSeconds = 1.4,
  distanceMeters = 1.8,
  machineName = "Toyota Electric Forklift"
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<any>(null);

  const isCritical = riskLevel === 'CRITICAL';
  const badgeColor = isCritical ? '#EF4444' : '#F59E0B';

  // Resolve video URL for physical devices and simulators
  const resolveUrl = (url?: string) => {
    const cloudBase = (process.env.EXPO_PUBLIC_RENDER_URL || "https://hackeye-cloud-platform.onrender.com").replace(/\/$/, "");
    if (!url) return `${cloudBase}/videos/forklift_approaching_entrance.mp4`;
    if (url.startsWith('/videos')) {
      return `${cloudBase}${url}`;
    }
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      const path = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, '');
      return `${cloudBase}${path}`;
    }
    return url;
  };

  const videoSource = resolveUrl(clipUrl);

  const togglePlayback = async () => {
    try {
      if (Platform.OS === 'web' && videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(prev => !prev);
      }
    } catch (e) {
      console.log('Playback toggle notice:', e);
    }
  };

  const restartPlayback = async () => {
    try {
      if (Platform.OS === 'web' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        setPlaybackTime(0);
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Playback restart notice:', e);
    }
  };

  const [hasError, setHasError] = useState(false);
  const currentSource = hasError 
    ? `${(process.env.EXPO_PUBLIC_RENDER_URL || "https://hackeye-cloud-platform.onrender.com").replace(/\/$/, "")}/videos/forklift_approaching_entrance.mp4`
    : videoSource;

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setPlaybackTime(0);
    setIsPlaying(true);
    if (videoRef.current && Platform.OS === 'web') {
      videoRef.current.currentTime = 0;
      videoRef.current.play?.().catch(() => {});
    }
  }, [clipUrl]);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackTime(prev => (prev >= 3.6 ? 0 : Number((prev + 0.1).toFixed(1))));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const fallbackCctvView = (
    <View style={styles.fallbackPlayer}>
      <MaterialCommunityIcons name="cctv" size={44} color="#64748B" />
      <Text style={styles.fallbackTitle}>Incident Camera Clip Stream</Text>
      <Text style={styles.fallbackSubtitle}>{machineName} • Loop Active</Text>
    </View>
  );

  return (
    <View style={[styles.container, { borderColor: badgeColor }]}>
      {/* HUD Header Bar */}
      <View style={styles.hudTopBar}>
        <View style={styles.hudTitleGroup}>
          <View style={[styles.recDot, isPlaying && styles.recDotActive]} />
          <Text style={styles.cameraNameText}>{cameraName.toUpperCase()}</Text>
        </View>

        <View style={styles.hudRightGroup}>
          <View style={[styles.riskTag, { backgroundColor: isCritical ? '#FEF2F2' : '#FEF3C7', borderColor: badgeColor }]}>
            <Text style={[styles.riskTagText, { color: badgeColor }]}>
              {isCritical ? 'CRITICAL BREACH' : 'NEAR-MISS DETECTED'}
            </Text>
          </View>
          <View style={styles.fpsBadge}>
            <Text style={styles.fpsText}>1080P • 25 FPS</Text>
          </View>
        </View>
      </View>

      {/* Main Video Viewport */}
      <View style={styles.videoViewport}>
        {Platform.OS === 'web' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#020617' }}>
            <video
              ref={videoRef}
              key={currentSource}
              src={currentSource}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        ) : (
          <SafeNativeVideoBoundary fallback={fallbackCctvView}>
            <View style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#020617' }}>
              <NativeVideoPlayer
                key={currentSource}
                source={currentSource}
                isPlaying={isPlaying}
              />
            </View>
          </SafeNativeVideoBoundary>
        )}

        {/* Tactical HUD Bounding Overlay */}
        <View style={styles.tacticalHudOverlay} pointerEvents="none">
          {/* Top Left Target Box */}
          <View style={[styles.targetBox, { borderColor: badgeColor }]}>
            <View style={styles.targetCornerTL} />
            <View style={styles.targetCornerBR} />
            <View style={[styles.targetLabelPill, { backgroundColor: badgeColor }]}>
              <Text style={styles.targetLabelText}>HAZARD ZONE: TTC {ttcSeconds}s</Text>
            </View>
          </View>

          {/* Bottom Telemetry Overlay */}
          <View style={styles.hudTelemetryBar}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>CLEARANCE</Text>
              <Text style={[styles.telemetryValue, { color: badgeColor }]}>{distanceMeters} m</Text>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>EST. TTC</Text>
              <Text style={[styles.telemetryValue, { color: badgeColor }]}>{ttcSeconds} s</Text>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>INCIDENT ID</Text>
              <Text style={styles.telemetryValue}>{incidentCode}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Video Control Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.playButtonGroup}>
          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={togglePlayback}
            activeOpacity={0.7}
          >
            <Feather name={isPlaying ? "pause" : "play"} size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={restartPlayback}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={15} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.timecodeText}>00:0{playbackTime.toFixed(1)} / 00:03.6</Text>
        </View>

        <View style={styles.eventClipPill}>
          <Feather name="video" size={12} color="#2563EB" />
          <Text style={styles.eventClipPillText}>2.4s INCIDENT CLIP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginVertical: 10
  },
  hudTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  hudTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#94A3B8'
  },
  recDotActive: {
    backgroundColor: '#EF4444'
  },
  cameraNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  hudRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  fpsBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  fpsText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  videoViewport: {
    width: '100%',
    height: 220,
    backgroundColor: '#020617',
    position: 'relative'
  },
  fallbackPlayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090D16',
    gap: 6
  },
  fallbackText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600'
  },
  fallbackSubtext: {
    color: '#64748B',
    fontSize: 12
  },
  tacticalHudOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12
  },
  targetBox: {
    width: 140,
    height: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 6,
    position: 'relative',
    marginTop: 10,
    marginLeft: 10
  },
  targetCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#FFFFFF'
  },
  targetCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF'
  },
  targetLabelPill: {
    position: 'absolute',
    top: -10,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  targetLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  hudTelemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  telemetryItem: {
    alignItems: 'center'
  },
  telemetryLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  telemetryValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  telemetryDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  playButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  controlIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  timecodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 4
  },
  eventClipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  eventClipPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.3
  }
});

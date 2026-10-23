import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Configure notification behavior for incoming alerts while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    this.requestPermissions();
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';
      return this.hasPermission;
    } catch {
      this.hasPermission = false;
      return false;
    }
  }

  public async triggerCriticalAlert(title: string, body: string, data?: any) {
    // 1. Tactile haptic vibration for immediate sensory alert
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}

    // 2. Mobile push notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || '🚨 Hack-Eye Critical Alert',
          body: body || 'Worker detected inside Excavator Safety Zone. Immediate attention required.',
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // trigger immediately
      });
    } catch (err) {
      console.log("[Notification] Local push notification fallback handled:", err);
    }
  }
}

export const notificationService = new NotificationService();

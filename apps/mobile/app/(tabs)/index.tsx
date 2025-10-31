import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { getCurrentUser, onAuthStateChange } from '../../src/services/auth';
import Header from '../../src/components/Header';
import { auth } from '../../src/config/firebase';

const API_BASE = Platform.select({
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

interface DayInfo {
  date: Date;
  dayOfMonth: number;
  dayName: string;
  completed: boolean;
}

// Streak Day Component with Gold Sparkles
function StreakDay({ dayInfo, dayIndex }: { dayInfo: DayInfo; dayIndex: number }) {
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dayInfo.completed) return;

    const createSparkleAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ])
      );
    };

    const anim1 = createSparkleAnimation(sparkle1, dayIndex * 100);
    const anim2 = createSparkleAnimation(sparkle2, dayIndex * 100 + 150);
    const anim3 = createSparkleAnimation(sparkle3, dayIndex * 100 + 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dayInfo.completed, dayIndex]);

  return (
    <View style={styles.dayContainer}>
      <Text style={styles.dayNameLabel}>{dayInfo.dayName}</Text>
      <View
        style={[
          styles.dayCircle,
          dayInfo.completed ? styles.dayCircleCompleted : styles.dayCircleIncomplete,
        ]}
      >
        {dayInfo.completed ? (
          <>
            <Text style={styles.dayNumberCompleted}>{dayInfo.dayOfMonth}</Text>
            <View style={styles.streakSparkleContainer}>
              <Animated.View
                style={[
                  styles.streakSparkleDot,
                  styles.streakSparkle1,
                  {
                    opacity: sparkle1,
                    transform: [{
                      scale: sparkle1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.3],
                      }),
                    }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.streakSparkleDot,
                  styles.streakSparkle2,
                  {
                    opacity: sparkle2,
                    transform: [{
                      scale: sparkle2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.3],
                      }),
                    }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.streakSparkleDot,
                  styles.streakSparkle3,
                  {
                    opacity: sparkle3,
                    transform: [{
                      scale: sparkle3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.3],
                      }),
                    }],
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <Text style={styles.dayNumber}>{dayInfo.dayOfMonth}</Text>
        )}
      </View>
    </View>
  );
}

export default function Dashboard() {
  const [userName, setUserName] = useState('Name');
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState<DayInfo[]>([]);
  const [dayStreak, setDayStreak] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/profile/${auth.currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile?.displayName) {
          setUserName(data.profile.displayName);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }

    // Fallback to Firebase Auth if not in profile
    const currentUser = getCurrentUser();
    if (currentUser?.displayName) {
      setUserName(currentUser.displayName);
    } else {
      setUserName('Name');
    }
    setLoading(false);
  }, []);

  const updateUserName = useCallback(() => {
    // Try to get from profile first
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    // Get current user immediately
    updateUserName();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user?.displayName) {
        setUserName(user.displayName);
      } else {
        setUserName('Name'); // Fallback if no display name
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [updateUserName]);

  const loadStreakData = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      // Fetch recipes to calculate streak
      const response = await fetch(`${API_BASE}/api/generate-recipe/user/${auth.currentUser.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to load recipes');
      }

      const data = await response.json();
      const recipes = data.recipes || [];

      // Group recipes by date (YYYY-MM-DD)
      const recipesByDate = new Set<string>();
      recipes.forEach((recipe: any) => {
        if (recipe.createdAt) {
          const date = new Date(recipe.createdAt);
          const dateStr = date.toISOString().split('T')[0];
          recipesByDate.add(dateStr);
        }
      });

      // Generate last 7 days with actual calendar dates
      const days: DayInfo[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        days.push({
          date,
          dayOfMonth: date.getDate(),
          dayName,
          completed: recipesByDate.has(dateStr),
        });
      }

      setStreakDays(days);

      // Calculate streak (consecutive days from today backwards)
      let streak = 0;
      const todayStr = today.toISOString().split('T')[0];
      
      // If today has activity, start counting from today
      // Otherwise start from yesterday
      let checkDate = new Date(today);
      if (!recipesByDate.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (streak < 365) { // Cap at 365 days
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (recipesByDate.has(checkDateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setDayStreak(streak);
    } catch (error) {
      console.error('Failed to load streak data:', error);
      // Set default empty streak on error
      const today = new Date();
      const days: DayInfo[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
          date,
          dayOfMonth: date.getDate(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          completed: false,
        });
      }
      setStreakDays(days);
      setDayStreak(0);
    }
  }, []);

  // Update display name and streak when screen comes into focus (e.g., after updating in profile)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadStreakData();
    }, [loadProfile, loadStreakData])
  );

  useEffect(() => {
    if (auth.currentUser) {
      loadProfile();
      loadStreakData();
    }
  }, [loadProfile, loadStreakData]);

  const caloriesData = [
    { day: 'Mon', value: 2000, isBlue: false },
    { day: 'Tue', value: 1200, isBlue: true },
    { day: 'Wed', value: 1800, isBlue: false },
    { day: 'Thur', value: 1500, isBlue: true },
    { day: 'Fri', value: 1900, isBlue: false },
    { day: 'Sat', value: 1950, isBlue: true },
    { day: 'Sun', value: 1550, isBlue: false },
  ];

  const maxCalories = 2000;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Home" />
      
      {/* Combined Welcome & Streak Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeStreakContainer}>
          <Text style={styles.greeting}>Hi, {userName}</Text>
          <View style={styles.streakSection}>
            <Text style={styles.streakText}>{dayStreak} {dayStreak === 1 ? 'day' : 'days'} streak</Text>
            <View style={styles.daysContainer}>
              {streakDays.map((dayInfo, index) => (
                <StreakDay
                  key={index}
                  dayInfo={dayInfo}
                  dayIndex={index}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Daily Calories */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔻</Text>
          <Text style={styles.sectionTitle}>Daily Calories</Text>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {caloriesData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(item.value / maxCalories) * 100}%`,
                        backgroundColor: item.isBlue ? colors.secondary : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{item.value}</Text>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Daily Macro Distribution */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔻</Text>
          <Text style={styles.sectionTitle}>Daily Macro Distribution</Text>
        </View>

        <View style={styles.macroContainer}>
          {/* Donut Chart - Simplified representation */}
          <View style={styles.donutChart}>
            <View style={styles.donutOuter}>
              <View style={styles.donutInner} />
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondaryLight }]} />
              <Text style={styles.legendText}>Fat</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeStreakContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  streakSection: {
    marginTop: 0,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayNameLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    overflow: 'visible',
  },
  dayCircleCompleted: {
    backgroundColor: '#FFD700', // Gold like the button - flat color
    borderWidth: 0,
    overflow: 'visible',
    // Shadow for the whole circle
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dayCircleIncomplete: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  streakSparkleContainer: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakSparkleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 215, 0, 1)', // Gold sparkle
    borderRadius: 2,
  },
  streakSparkle1: {
    top: '10%',
    left: '15%',
  },
  streakSparkle2: {
    top: '20%',
    right: '15%',
  },
  streakSparkle3: {
    bottom: '15%',
    left: '50%',
  },
  dayNumber: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dayNumberCompleted: {
    color: '#1a1a1a', // Dark text like gold button
    fontSize: 16,
    fontWeight: '700',
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chartContainer: {
    marginTop: 10,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    width: '70%',
    height: 160,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  macroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  donutChart: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
  },
  legend: {
    flex: 1,
    paddingLeft: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});

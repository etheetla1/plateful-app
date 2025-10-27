import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { getCurrentUser, onAuthStateChange } from '../../src/services/auth';

export default function Dashboard() {
  const [userName, setUserName] = useState('Name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user immediately
    const currentUser = getCurrentUser();
    if (currentUser?.displayName) {
      setUserName(currentUser.displayName);
      setLoading(false);
    }

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
  }, []);
  const dayStreak = 2;
  const weekDays = [
    { day: 1, completed: true },
    { day: 2, completed: true },
    { day: 3, completed: false },
    { day: 4, completed: false },
    { day: 5, completed: false },
    { day: 6, completed: false },
    { day: 7, completed: false },
  ];

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Day Streak */}
      <View style={styles.card}>
        <Text style={styles.streakText}>{dayStreak} day streak</Text>
        <View style={styles.daysContainer}>
          {weekDays.map((item) => (
            <View
              key={item.day}
              style={[
                styles.dayCircle,
                item.completed ? styles.dayCircleCompleted : styles.dayCircleIncomplete,
              ]}
            >
              {item.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.dayNumber}>{item.day}</Text>
              )}
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  dayCircleCompleted: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dayCircleIncomplete: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: 'bold',
  },
  dayNumber: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
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

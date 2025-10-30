import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@plateful/shared';
import { Text, View } from 'react-native';

const TabLabel = ({ focused, label }: { focused: boolean; label: string }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        backgroundColor: focused ? colors.primary : 'transparent',
        borderBottomWidth: focused ? 2 : 0,
        borderBottomColor: focused ? colors.primary : 'transparent',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: focused ? '#ffffff' : '#424242' }}>
        {label}
      </Text>
    </View>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      })}
      sceneContainerStyle={{}}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Home" />,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
              style={
                focused
                  ? { transform: [{ scale: 1.1 }] }
                  : {}
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: 'Groceries',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Groceries" />,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="cart"
              size={size}
              color={color}
              style={
                focused
                  ? { transform: [{ scale: 1.1 }] }
                  : {}
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recipes-new"
        options={{
          title: 'Recipes',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Recipes" />,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="book"
              size={size}
              color={color}
              style={
                focused
                  ? { transform: [{ scale: 1.1 }] }
                  : {}
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Chat" />,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="chatbubbles"
              size={size}
              color={color}
              style={
                focused
                  ? { transform: [{ scale: 1.1 }] }
                  : {}
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Settings" />,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="settings"
              size={size}
              color={color}
              style={
                focused
                  ? { transform: [{ scale: 1.1 }] }
                  : {}
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="firebase-test"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

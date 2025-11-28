// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import StoriesScreen from "../screens/StoriesScreen";
import ChatScreen from "../screens/ChatScreen";
import ActionsScreen from "../screens/ActionsScreen";
import ShortsScreen from "../screens/ShortsScreen";

export type RootTabParamList = {
  Stories: undefined;
  Shorts: undefined;
  Chat: { focusInput?: boolean } | undefined;
  Actions: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#e63946",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#ddd",
          backgroundColor: "#fff",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "newspaper-outline";

          if (route.name === "Stories") iconName = "newspaper-outline";
          if (route.name === "Shorts") iconName = "play-circle-outline";
          if (route.name === "Chat") iconName = "chatbubble-ellipses-outline";
          if (route.name === "Actions") iconName = "checkmark-circle-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="Shorts" component={ShortsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Actions" component={ActionsScreen} />
    </Tab.Navigator>
  );
};

export default RootNavigator;

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RootNavigator from "./src/navigation/RootNavigator";
import StoryDetail from "./src/screens/StoryDetail";
import { TouchableOpacity, Text } from "react-native";

export type RootStackParamList = {
  Tabs: undefined;
  StoryDetail: { storyId: string; storyTitle: string; imageUrl?: string | null };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={RootNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StoryDetail"
          component={StoryDetail}
          options={({ navigation, route }) => ({
            title: "CivicCompanion",
            headerStyle: {
              height: 110,
              paddingTop: 20,
              backgroundColor: "#fff",
            },
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: "900",
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingHorizontal: 16 }}
              >
                <Text style={{ fontSize: 25 }}>✕</Text>
              </TouchableOpacity>
            ),
            presentation: "fullScreenModal",
            animation: "fade_from_bottom",
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

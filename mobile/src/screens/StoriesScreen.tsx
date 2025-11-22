// src/screens/StoriesScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Animated,
} from "react-native";
import { fetchStories } from "../api/client";
import { Story } from "../types";
import StoryCard from "../components/StoryCard";

const StoriesScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

  const loadStories = async () => {
    try {
      setError(null);
      const data = await fetchStories();
      setStories(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load stories");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.appName}>CivicCompanion</Text>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Animated.View style={[styles.liveDot, { opacity: blinkAnim }]} />
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>
          Couldn&apos;t load stories: {error}
        </Text>
      )}

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStories();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No stories yet.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onPress={() =>
              navigation.navigate("StoryDetail", {
                storyId: item.id,
                storyTitle: item.title,
                imageUrl: item.image_url ?? null,
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 35,
    fontWeight: "900",
    color: "#111",
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 25,
    fontWeight: "800",
    color: "#e63946",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  errorText: {
    color: "#b5171e",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#666",
  },
  sectionRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 4,
  },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#e63946",
    marginLeft: 6,
    marginTop: 5,
  },
});

export default StoriesScreen;

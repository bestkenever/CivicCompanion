// src/screens/StoriesScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from "react-native";
import { fetchStories } from "../api/client";
import { Story } from "../types";
import StoryCard from "../components/StoryCard";

const StoriesScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Text style={styles.sectionTitle}>Today</Text>
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
            onPress={() => {
              // later: navigate to detail screen if you want
            }}
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
});

export default StoriesScreen;

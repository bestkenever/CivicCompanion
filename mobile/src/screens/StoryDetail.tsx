// src/screens/StoryDetail.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { fetchStoryDetail } from "../api/client";
import { StoryDetail as StoryDetailType } from "../types";

type StoryDetailRouteProp = RouteProp<RootStackParamList, "StoryDetail">;

const StoryDetail: React.FC = () => {
  const { params } = useRoute<StoryDetailRouteProp>();
  const { storyId, storyTitle, imageUrl } = params;
  const [detail, setDetail] = useState<StoryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchStoryDetail(storyId);
        if (active) {
          setDetail(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message ?? "Couldn't load story details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [storyId]);

  // For now, just show placeholder content using the id.
  // Later you’ll fetch /stories/{storyId} from the backend.
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{
            uri:
              imageUrl ??
              "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
          }}
          style={styles.image}
        />
        <Text style={styles.title}>{detail?.title ?? storyTitle}</Text>
        <Text style={styles.subtitle}>
          {detail?.summary ??
            "This story explores how policy changes affect everyday people."}
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#e63946" />
            <Text style={styles.loaderText}>Generating explanation...</Text>
          </View>
        ) : (
          <Text style={styles.body}>
            {detail?.detailed_summary ??
              "No additional details yet. Please try again later."}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#7d7d7dff",
  },
  body: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  error: {
    marginTop: 12,
    color: "#b5171e",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  loaderText: {
    color: "#555",
  },
});

export default StoryDetail;

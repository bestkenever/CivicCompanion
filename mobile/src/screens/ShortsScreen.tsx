// src/screens/ShortsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { fetchShorts, API_BASE_URL } from "../api/client";
import { ShortVideo } from "../types";
import { RootTabParamList } from "../navigation/RootNavigator";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

const ShortsScreen: React.FC = () => {
  const { height: screenHeight } = useWindowDimensions();
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchShorts();
        setShorts(data);
        if (data[0]) setActiveId(data[0].id);
      } catch (err) {
        setError("Could not load shorts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems[0]) {
      const nextId = viewableItems[0].item.id;
      setActiveId(nextId);
    }
  }).current;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 80,
    }),
    []
  );

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItem = ({ item }: { item: ShortVideo }) => {
    const uri = item.video_url.startsWith("http")
      ? item.video_url
      : `${API_BASE_URL}${item.video_url}`;
    const isActive = activeId === item.id;
    const headline = item.description || "CivicCompanion short";

    return (
      <View style={[styles.card, { height: screenHeight }]}>
        <Video
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive && isFocused}
          isMuted={false}
          volume={1.0}
          useNativeControls={false}
        />
        <View style={styles.overlay}>
          <Text style={styles.title}>{headline}</Text>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.askButton}
            onPress={() => navigation.navigate("Chat", { focusInput: true })}
          >
            <Text style={styles.askText}>Ask CivicCompanion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleLike(item.id)}
          >
            <Text style={styles.likeText}>
              {liked.has(item.id) ? "♥ Liked" : "♡ Like"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={shorts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={screenHeight}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  card: {
    width: "100%",
    position: "relative",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 120,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  description: {
    marginTop: 4,
    color: "#eee",
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 40,
    paddingBottom: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  askButton: {
    flex: 1,
    marginRight: 12,
    backgroundColor: "rgba(230, 57, 70, 0.5)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  askText: {
    color: "#fff",
    fontWeight: "700",
  },
  likeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  likeText: {
    color: "#fff",
    fontWeight: "700",
  },
  error: {
    color: "#b5171e",
    padding: 16,
  },
});

export default ShortsScreen;

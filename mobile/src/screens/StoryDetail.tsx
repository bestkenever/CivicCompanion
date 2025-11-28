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
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { fetchStoryDetail } from "../api/client";
import { StoryDetail as StoryDetailType } from "../types";

type StoryDetailRouteProp = RouteProp<RootStackParamList, "StoryDetail">;

const StoryDetail: React.FC = () => {
  const { params } = useRoute<StoryDetailRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { storyId, storyTitle, imageUrl } = params;
  const [detail, setDetail] = useState<StoryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [simplifying, setSimplifying] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchStoryDetail(storyId);
        if (active) {
          setDetail(data);
          setIsSimplified(false);
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

  const handleSimplify = async () => {
    if (simplifying) return;
    try {
      setSimplifying(true);
      const data = await fetchStoryDetail(storyId, { reading_level: "simple" });
      setDetail(data);
      setIsSimplified(true);
    } catch (err: any) {
      setError(err.message ?? "Couldn't simplify this story.");
    } finally {
      setSimplifying(false);
    }
  };

  const subtitleText =
    isSimplified && detail?.detailed_summary
      ? detail.detailed_summary.split(/\n+/)[0]
      : detail?.summary ??
        "This story explores how policy changes affect everyday people.";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 115 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={{
              uri:
                imageUrl ??
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
            }}
            style={styles.image}
          />
          <Text style={styles.title}>{detail?.title ?? storyTitle}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>

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
        <View style={styles.bottomBar}>
          <TextInput
            style={styles.bottomInput}
            placeholder="Ask CivicCompanion..."
            placeholderTextColor="#888"
            value={noteDraft}
            onChangeText={setNoteDraft}
            onFocus={() =>
              navigation.replace(
                "Tabs",
                { screen: "Chat", params: { focusInput: true } } as any
              )
            }
          />
          <TouchableOpacity
            style={[
              styles.bottomButton,
              (simplifying || isSimplified) && styles.bottomButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleSimplify}
            disabled={simplifying || isSimplified}
          >
            <Text style={styles.bottomButtonText}>
              {simplifying ? "..." : isSimplified ? "Simplified" : "Simplify"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
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
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  bottomInput: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f5f5f7",
    color: "#111",
    fontSize: 14,
  },
  bottomButton: {
    marginLeft: 12,
    backgroundColor: "#e63946",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bottomButtonDisabled: {
    opacity: 0.6,
  },
  bottomButtonText: {
    fontWeight: "700",
    color: "#fff",
  },
});

export default StoryDetail;

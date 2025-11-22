// src/screens/ActionsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { fetchStories, takeAction } from "../api/client";
import { Story, TakeActionResponse } from "../types";
import PolicyChip from "../components/PolicyChip";

const ActionsScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TakeActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStories();
        setStories(data);
        if (data.length > 0) setSelectedPolicyId(data[0].policy_id);
      } catch (err: any) {
        setError("Failed to load policies");
      }
    })();
  }, []);

  const handleGetActions = async () => {
    if (!selectedPolicyId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await takeAction({
        policy_id: selectedPolicyId,
        user_location: location || null,
        user_role: "student",
      });
      setResult(res);
    } catch (err: any) {
      setError("Could not fetch suggested actions.");
    } finally {
      setLoading(false);
    }
  };

  const selectedStory = stories.find(
    (s) => s.policy_id === selectedPolicyId
  ) ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text style={styles.title}>Take Action</Text>
        <Text style={styles.subtitle}>
          Turn understanding into steps you can actually take.
        </Text>

        {stories.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Choose a policy</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {stories.map((story) => (
                <PolicyChip
                  key={story.id}
                  story={story}
                  selected={story.policy_id === selectedPolicyId}
                  onPress={() => setSelectedPolicyId(story.policy_id)}
                />
              ))}
            </ScrollView>
            {selectedStory && (
              <Text style={styles.selectedHint}>
                You&apos;re taking action on{" "}
                <Text style={{ fontWeight: "600" }}>
                  {selectedStory.title}
                </Text>
              </Text>
            )}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>Where are you? (optional)</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Champaign, IL"
            style={styles.input}
          />
          <Text style={styles.helperText}>
            We&apos;ll use this to suggest more relevant actions when possible.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleGetActions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Getting steps..." : "Get actions"}
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.policy_title}</Text>
            {result.actions.map((a, idx) => (
              <View key={idx} style={styles.actionRow}>
                <View style={styles.bullet} />
                <Text style={styles.actionText}>{a}</Text>
              </View>
            ))}
            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#555",
    textAlign: "center",

  },
  label: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  chipRow: {
    paddingVertical: 4,
  },
  selectedHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#555",
  },
  input: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  helperText: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
  },
  button: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#e63946",
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  errorText: {
    marginTop: 12,
    color: "#b5171e",
  },
  resultCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e63946",
    marginTop: 6,
    marginRight: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: "#777",
  },
});

export default ActionsScreen;

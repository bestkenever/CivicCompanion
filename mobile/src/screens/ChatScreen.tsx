// src/screens/ChatScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { fetchStories, explainPolicy } from "../api/client";
import { Story } from "../types";
import PolicyChip from "../components/PolicyChip";

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
};

const ChatScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStories();
        setStories(data);
        if (data.length > 0) {
          setSelectedPolicyId(data[0].policy_id);
        }
      } catch (err) {
        // ignore for now; you can add error UI later
      }
    })();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!selectedPolicyId) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setSending(true);
    try {
      const res = await explainPolicy({
        policy_id: selectedPolicyId,
        user_role: "student",
        language: "en",
      });

      const botText = `${res.what_it_is}\n\n${res.what_it_means_for_you}\n\n${res.disclaimer}`;
      const botMessage: ChatMessage = {
        id: `b-${Date.now()}`,
        from: "bot",
        text: botText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const botError: ChatMessage = {
        id: `b-${Date.now()}`,
        from: "bot",
        text:
          "Sorry, I couldn’t explain that policy right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, botError]);
    } finally {
      setSending(false);
    }
  };

  const selectedStory = stories.find(
    (s) => s.policy_id === selectedPolicyId
  ) ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ask CivicCompanion</Text>
          <Text style={styles.subtitle}>
            Get neutral, plain-language explanations of policies.
          </Text>
        </View>

        {stories.length > 0 && (
          <View style={styles.policySelector}>
            <Text style={styles.selectorLabel}>Topic</Text>
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
              <Text style={styles.selectorHint}>
                You’re asking about:{" "}
                <Text style={{ fontWeight: "600" }}>
                  {selectedStory.title}
                </Text>
              </Text>
            )}
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.messages}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.from === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={
                  item.from === "user" ? styles.userText : styles.botText
                }
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              selectedStory
                ? `Ask about "${selectedStory.title}"...`
                : "Ask about a policy..."
            }
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && { opacity: 0.6 }]}
            onPress={sendMessage}
            disabled={sending}
          >
            <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
  policySelector: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  selectorLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  chipRow: {
    paddingVertical: 4,
  },
  selectorHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#555",
  },
  messages: {
    flex: 1,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#111",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#111",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#f5f5f7",
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e63946",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ChatScreen;

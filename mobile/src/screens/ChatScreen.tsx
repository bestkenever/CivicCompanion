// src/screens/ChatScreen.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import {
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { fetchStories, sendChat } from "../api/client";
import { Story, Source as SourceType } from "../types";
import PolicyChip from "../components/PolicyChip";
import { RootTabParamList } from "../navigation/RootNavigator";

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
  intent?: string;
  sources?: SourceType[];
  toolsUsed?: string[];
  error?: boolean;
};

const intentLabels: Record<string, string> = {
  candidate_explanation: "Candidate explanation",
  policy_explanation: "Policy explanation",
  action: "Action",
  other: "Other",
};

const ChatScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const route = useRoute<RouteProp<RootTabParamList, "Chat">>();
  const inputRef = useRef<TextInput>(null);

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

  useFocusEffect(
    useCallback(() => {
      if (route.params?.focusInput) {
        const timeout = setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timeout);
      }
      return undefined;
    }, [route.params?.focusInput])
  );

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    const nextConversationId =
      conversationId ?? `local-${Date.now().toString()}`;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text: userText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setSending(true);
    try {
      const res = await sendChat({
        message: userText,
        conversation_id: nextConversationId,
        metadata: selectedPolicyId ? { policy_id: selectedPolicyId } : {},
      });

      setConversationId(res.conversation_id ?? nextConversationId);
      const botMessage: ChatMessage = {
        id: `b-${Date.now()}`,
        from: "bot",
        text: res.answer,
        intent: res.intent,
        sources: res.sources,
        toolsUsed: res.tools_used,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const botError: ChatMessage = {
        id: `b-${Date.now()}`,
        from: "bot",
        text:
          "Sorry, I couldn’t answer that right now. Please try again in a moment.",
        error: true,
      };
      setMessages((prev) => [...prev, botError]);
    } finally {
      setSending(false);
    }
  };

  const selectedStory = stories.find(
    (s) => s.policy_id === selectedPolicyId
  ) ?? null;
  const policyOptions = useMemo(() => {
    const seen = new Set<string>();
    return stories.filter((story) => {
      if (seen.has(story.policy_id)) return false;
      seen.add(story.policy_id);
      return true;
    });
  }, [stories]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ask CivicCompanion</Text>
          <Text style={styles.subtitle}>
            Explanations for candidates, policies, or next steps.
          </Text>
        </View>

        {stories.length > 0 && (
          <View style={styles.policySelector}>
            <Text style={styles.selectorLabel}>Optional topic</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {policyOptions.map((story) => (
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
              {item.from === "bot" && item.intent && (
                <Text style={styles.intentTag}>
                  {intentLabels[item.intent] ?? item.intent}
                </Text>
              )}
              <Text
                style={[
                  item.from === "user" ? styles.userText : styles.botText,
                  item.error && { color: "#b00020" },
                ]}
              >
                {item.text}
              </Text>

              {item.sources && item.sources.length > 0 && (
                <View style={styles.sourceCard}>
                  <Text style={styles.sourceTitle}>Sources</Text>
                  {item.sources.map((src, idx) => (
                    <View key={`${src.title}-${idx}`} style={styles.sourceRow}>
                      <Text style={styles.sourceName}>{src.title}</Text>
                      <Text style={styles.sourceSnippet}>{src.snippet}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.toolsUsed && item.toolsUsed.length > 0 && (
                <View style={styles.toolRow}>
                  {item.toolsUsed.map((tool) => (
                    <View key={tool} style={styles.toolChip}>
                      <Text style={styles.toolText}>{tool}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              selectedStory
                ? `Ask about "${selectedStory.title}"...`
                : "Ask about a candidate, policy, or next steps..."
            }
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && { opacity: 0.6 }]}
            onPress={sendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
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
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
  intentTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    color: "#3c3c64",
    fontSize: 11,
    marginBottom: 6,
  },
  sourceCard: {
    marginTop: 8,
    backgroundColor: "#f7f8fa",
    borderRadius: 12,
    padding: 10,
  },
  sourceTitle: {
    fontWeight: "700",
    fontSize: 12,
    color: "#222",
    marginBottom: 4,
  },
  sourceRow: {
    marginBottom: 6,
  },
  sourceName: {
    fontWeight: "600",
    fontSize: 12,
    color: "#333",
  },
  sourceSnippet: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  toolChip: {
    backgroundColor: "#e8eefc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  toolText: {
    fontSize: 11,
    color: "#2544b8",
    fontWeight: "600",
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
    paddingVertical: 10,
    backgroundColor: "#e63946",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ChatScreen;

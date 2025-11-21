// src/components/StoryCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Story } from "../types";

interface Props {
  story: Story;
  onPress?: () => void;
}

const StoryCard: React.FC<Props> = ({ story, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View style={styles.tagRow}>
          {story.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title}>{story.title}</Text>
        <Text style={styles.summary} numberOfLines={3}>
          {story.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f1f3f5",
    marginRight: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
});

export default StoryCard;

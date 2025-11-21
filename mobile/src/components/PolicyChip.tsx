// src/components/PolicyChip.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Story } from "../types";

interface Props {
  story: Story;
  selected: boolean;
  onPress: () => void;
}

const PolicyChip: React.FC<Props> = ({ story, selected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {story.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  chipSelected: {
    borderColor: "#e63946",
    backgroundColor: "#ffe5e9",
  },
  text: {
    fontSize: 13,
    color: "#444",
  },
  textSelected: {
    color: "#b5171e",
    fontWeight: "600",
  },
});

export default PolicyChip;

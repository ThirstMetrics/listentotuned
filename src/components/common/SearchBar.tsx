/**
 * Tuned Podcast Player - SearchBar Component
 *
 * Dark-themed search input with a magnifying glass icon on the left and a
 * clear button on the right when text is present.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { fontFamilies, fontSizes, lineHeights } from '../../theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search podcasts...',
}) => {
  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      {/* Magnifying glass icon (Unicode) */}
      <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={darkColors.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={darkColors.primary}
        accessibilityLabel="Search input"
      />

      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Text style={styles.clearIcon}>{'\u2715'}</Text>
        </Pressable>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    color: darkColors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: darkColors.textSecondary,
  },
});

export default SearchBar;

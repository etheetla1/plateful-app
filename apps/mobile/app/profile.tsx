import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@plateful/ui';
import Header from '../src/components/Header';
import { auth } from '../src/config/firebase';
import type { FoodProfile } from '@plateful/shared';
import { colors } from '@plateful/shared';
import { Input } from '@plateful/ui';
import {
  COMMON_LIKES,
  COMMON_DISLIKES,
  COMMON_ALLERGENS,
  COMMON_RESTRICTIONS,
} from '@plateful/shared';

const API_BASE = Platform.select({
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onTagAdded?: (tag: string) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, onTagAdded, placeholder = 'Add item...' }: TagInputProps) {
  const [inputText, setInputText] = useState('');

  const addTag = () => {
    const trimmed = inputText.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      if (onTagAdded) {
        onTagAdded(trimmed);
      }
      setInputText('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <View style={styles.tagInputContainer}>
      <View style={styles.tagInput}>
        <TextInput
          style={styles.tagInputField}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {value.length > 0 && (
        <View style={styles.tagList}>
          {value.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tag}
              onPress={() => removeTag(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FoodProfile | null>(null);

  // Form state
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [likesCustom, setLikesCustom] = useState<string[]>([]);
  const [dislikesCustom, setDislikesCustom] = useState<string[]>([]);
  const [allergensCustom, setAllergensCustom] = useState<string[]>([]);
  const [restrictionsCustom, setRestrictionsCustom] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (user) {
      // Display name will be loaded from API profile
      loadProfile();
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/profile/${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        const loadedProfile = data.profile;
        setProfile(loadedProfile);
        
        // Load display name from API profile, fallback to Firebase if not set
        if (loadedProfile.displayName) {
          setDisplayName(loadedProfile.displayName);
        } else if (user?.displayName) {
          setDisplayName(user.displayName);
        } else {
          setDisplayName('');
        }
        
        // Separate common from custom
        // Selected items include both common and custom
        const likesCommon = loadedProfile.likes.filter(l => COMMON_LIKES.includes(l));
        const likesCustom_ = loadedProfile.likes.filter(l => !COMMON_LIKES.includes(l));
        const dislikesCommon = loadedProfile.dislikes.filter(d => COMMON_DISLIKES.includes(d));
        const dislikesCustom_ = loadedProfile.dislikes.filter(d => !COMMON_DISLIKES.includes(d));
        const allergensCommon = loadedProfile.allergens.filter(a => COMMON_ALLERGENS.includes(a));
        const allergensCustom_ = loadedProfile.allergens.filter(a => !COMMON_ALLERGENS.includes(a));
        const restrictionsCommon = loadedProfile.restrictions.filter(r => COMMON_RESTRICTIONS.includes(r));
        const restrictionsCustom_ = loadedProfile.restrictions.filter(r => !COMMON_RESTRICTIONS.includes(r));

        // Set selected items (common + custom)
        setLikes([...likesCommon, ...likesCustom_]);
        setLikesCustom(likesCustom_);
        setDislikes([...dislikesCommon, ...dislikesCustom_]);
        setDislikesCustom(dislikesCustom_);
        setAllergens([...allergensCommon, ...allergensCustom_]);
        setAllergensCustom(allergensCustom_);
        setRestrictions([...restrictionsCommon, ...restrictionsCustom_]);
        setRestrictionsCustom(restrictionsCustom_);
      } else if (response.status === 404) {
        // No profile exists yet
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item: string, currentList: string[], setList: (items: string[]) => void) => {
    if (currentList.includes(item)) {
      setList(currentList.filter(i => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };


  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      // likes/dislikes/allergens/restrictions already contain all selected items (common + custom)
      const allLikes = likes;
      const allDislikes = dislikes;
      const allAllergens = allergens;
      const allRestrictions = restrictions;

      const url = `${API_BASE}/api/profile/${user.uid}`;
      console.log(`🔄 Saving profile to: ${url}`);
      console.log(`📦 Profile data:`, { 
        displayName: displayName.trim() || 'none',
        likes: allLikes.length, 
        dislikes: allDislikes.length, 
        allergens: allAllergens.length, 
        restrictions: allRestrictions.length 
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          likes: allLikes,
          dislikes: allDislikes,
          allergens: allAllergens,
          restrictions: allRestrictions,
        }),
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile save failed:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || `Failed to save profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile saved successfully:', data);
      Alert.alert('Success', 'Profile saved successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderPillSection = (
    title: string,
    commonItems: string[],
    selected: string[],
    onToggle: (item: string) => void,
    customTags: string[],
    onCustomChange: (tags: string[]) => void,
    onToggleCustom: (item: string) => void
  ) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.pillContainer}>
          {/* Custom tags appear first, at the top */}
          {customTags.map(item => (
            <TouchableOpacity
              key={`custom-${item}`}
              style={[
                styles.pill,
                selected.includes(item) && styles.pillSelected,
              ]}
              onPress={() => onToggleCustom(item)}
            >
              <Text
                style={[
                  styles.pillText,
                  selected.includes(item) && styles.pillTextSelected,
                ]}
              >
                {item}
              </Text>
              {selected.includes(item) && (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Common items */}
          {commonItems.map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.pill,
                selected.includes(item) && styles.pillSelected,
              ]}
              onPress={() => onToggle(item)}
            >
              <Text
                style={[
                  styles.pillText,
                  selected.includes(item) && styles.pillTextSelected,
                ]}
              >
                {item}
              </Text>
              {selected.includes(item) && (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.customLabel}>Add custom item:</Text>
        <TagInput 
          value={customTags} 
          onChange={(newTags) => {
            // When tags change, handle additions and removals
            const removed = customTags.filter(t => !newTags.includes(t));
            const added = newTags.filter(t => !customTags.includes(t));
            
            onCustomChange(newTags);
            
            // Remove from selected if tag was removed
            removed.forEach(tag => {
              if (selected.includes(tag)) {
                onToggle(tag);
              }
            });
            
            // Add to selected if tag was newly added
            added.forEach(tag => {
              if (!selected.includes(tag)) {
                onToggle(tag);
              }
            });
          }}
          placeholder="Add custom item..." 
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Food Preferences" showBackButton />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Display Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            autoCapitalize="words"
          />
        </View>

        {renderPillSection(
          'Likes',
          COMMON_LIKES,
          likes,
          (item) => toggleSelection(item, likes, setLikes),
          likesCustom,
          setLikesCustom,
          (item) => toggleSelection(item, likes, setLikes)
        )}

        {renderPillSection(
          'Dislikes',
          COMMON_DISLIKES,
          dislikes,
          (item) => toggleSelection(item, dislikes, setDislikes),
          dislikesCustom,
          setDislikesCustom,
          (item) => toggleSelection(item, dislikes, setDislikes)
        )}

        {renderPillSection(
          'Allergens',
          COMMON_ALLERGENS,
          allergens,
          (item) => toggleSelection(item, allergens, setAllergens),
          allergensCustom,
          setAllergensCustom,
          (item) => toggleSelection(item, allergens, setAllergens)
        )}

        {renderPillSection(
          'Restricted Foods',
          COMMON_RESTRICTIONS,
          restrictions,
          (item) => toggleSelection(item, restrictions, setRestrictions),
          restrictionsCustom,
          setRestrictionsCustom,
          (item) => toggleSelection(item, restrictions, setRestrictions)
        )}

        <Button
          title={saving ? 'Saving...' : 'Save Profile'}
          onPress={saveProfile}
          loading={saving}
          variant="primary"
          disabled={saving}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: colors.surface,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  tagInputContainer: {
    marginTop: 8,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  tagInputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addTagButton: {
    padding: 4,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: colors.accent,
    marginRight: 4,
  },
});


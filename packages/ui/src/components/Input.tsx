import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  error,
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholderTextColor="#9E9E9E"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            {/* @ts-ignore */}
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#757575"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 0,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    minHeight: 56,
    color: '#212121',
  },
  inputFocused: {
    backgroundColor: '#EEEEEE',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  error: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 20,
  },
});

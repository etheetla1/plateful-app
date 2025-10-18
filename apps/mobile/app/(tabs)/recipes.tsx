import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Input } from '@plateful/ui';
import { Ionicons } from '@expo/vector-icons';

// Simple markdown parser for mobile-friendly display
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) continue;
    
    // Skip stray bullet points or formatting artifacts
    if (line === '•' || line === '*' || line === '-') {
      continue;
    }
    
    // Headers
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', text: line.substring(2) });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', text: line.substring(3) });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', text: line.substring(4) });
    }
    // Bold text
    else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push({ type: 'bold', text: line.substring(2, line.length - 2) });
    }
    // Source links
    else if (line.startsWith('**Source:** ') || line.startsWith('Source: ')) {
      const url = line.replace(/^\*\*Source:\*\* |^Source: /, '');
      elements.push({ type: 'source', text: 'Source: ', url });
    }
    // List items (ingredients)
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push({ type: 'list', text: line.substring(2) });
    }
    // Numbered list items (instructions)
    else if (/^\d+\.\s/.test(line)) {
      elements.push({ type: 'instruction', text: line });
    }
    // Regular paragraphs
    else {
      elements.push({ type: 'paragraph', text: line });
    }
  }
  
  return elements;
};

export default function Recipes() {
  const [dishName, setDishName] = useState('');
  const [recipe, setRecipe] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchRecipe = async () => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter a dish name');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe('');
    setSourceUrl('');

    try {
      // Call the API server (which has your simple-recipe.ts logic)
      const response = await fetch('http://10.0.2.2:3000/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dish: dishName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }

      const data = await response.json();
      setRecipe(data.recipe);
      setSourceUrl(data.sourceUrl || '');
    } catch (err) {
      setError('Failed to get recipe. Please check your API key and try again.');
      console.error('Recipe error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Finder</Text>
        <Text style={styles.subtitle}>Get recipes for any dish</Text>
      </View>

      <View style={styles.searchSection}>
        <Input
          value={dishName}
          onChangeText={setDishName}
          placeholder="Enter dish name (e.g., lasagna, chicken curry)"
          autoCapitalize="none"
        />
        
        <Button
          title={loading ? "Searching..." : "Find Recipe"}
          onPress={searchRecipe}
          loading={loading}
          variant="primary"
          disabled={loading}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {recipe ? (
        <View style={styles.recipeSection}>
          <View style={styles.recipeHeader}>
            <Ionicons name="restaurant" size={24} color="#4CAF50" />
            <Text style={styles.recipeTitle}>Recipe for {dishName}</Text>
          </View>
          {parseMarkdown(recipe).map((element, index) => {
            switch (element.type) {
              case 'h1':
                return <Text key={index} style={styles.h1}>{element.text}</Text>;
              case 'h2':
                return <Text key={index} style={styles.h2}>{element.text}</Text>;
              case 'h3':
                return <Text key={index} style={styles.h3}>{element.text}</Text>;
              case 'bold':
                return <Text key={index} style={styles.bold}>{element.text}</Text>;
              case 'source':
                return (
                  <TouchableOpacity key={index} onPress={() => {
                    // In a real app, you'd open the URL
                    Alert.alert('Source', `Visit: ${element.url}`);
                  }}>
                    <Text style={styles.source}>
                      {element.text}
                      <Text style={styles.link}>{element.url}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              case 'list':
                return (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{element.text}</Text>
                  </View>
                );
              case 'instruction':
                return <Text key={index} style={styles.instruction}>{element.text}</Text>;
              case 'paragraph':
                return <Text key={index} style={styles.paragraph}>{element.text}</Text>;
              default:
                return <Text key={index} style={styles.paragraph}>{element.text}</Text>;
            }
          })}
          
          {/* Source URL display */}
          {sourceUrl ? (
            <View style={styles.sourceSection}>
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert('Visit Recipe', `Open ${sourceUrl} in your browser?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open', onPress: () => {
                      // In a real app, you'd use Linking.openURL(sourceUrl)
                      console.log('Would open:', sourceUrl);
                    }}
                  ]);
                }}
                style={styles.sourceButton}
              >
                <Ionicons name="link" size={16} color="#007AFF" />
                <Text style={styles.sourceText}>View Original Recipe</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {!recipe && !loading && !error ? (
        <View style={styles.placeholder}>
          <Ionicons name="search" size={48} color="#9E9E9E" />
          <Text style={styles.placeholderText}>
            Enter a dish name above to find a recipe
          </Text>
          <Text style={styles.noteText}>
            Note: This uses your Anthropic API to search food52.com for real recipes.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  searchSection: {
    marginBottom: 20,
    gap: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#F44336',
    fontSize: 14,
  },
  recipeSection: {
    marginTop: 20,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  recipeText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242',
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginTop: 12,
    marginBottom: 6,
  },
  bold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242',
    marginBottom: 8,
  },
  source: {
    fontSize: 14,
    color: '#424242',
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#424242',
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242',
    flex: 1,
  },
  instruction: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 12,
    lineHeight: 22,
  },
  sourceSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sourceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

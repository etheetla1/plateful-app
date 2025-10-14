import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';

export async function uploadImage(
  uri: string,
  path: string
): Promise<string> {
  // Convert URI to blob
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Create storage reference
  const storageRef = ref(storage, path);
  
  // Upload file
  await uploadBytes(storageRef, blob);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteImage(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function pickImage(): Promise<string | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }
  
  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
  
  return null;
}

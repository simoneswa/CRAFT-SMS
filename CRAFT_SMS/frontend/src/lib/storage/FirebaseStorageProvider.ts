import { StorageProvider } from './StorageProvider';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, deleteObject } from 'firebase/storage';

export class FirebaseStorageProvider implements StorageProvider {
  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  async uploadFile(schoolId: string, category: string, userId: string, file: File): Promise<{ path: string }> {
    // Generate clean filename
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `schools/${schoolId}/${category}/${userId}/${cleanFileName}`;
    const storageRef = ref(storage, path);
    
    // Upload with custom metadata preparing for malware scanning architecture
    const metadata = {
      customMetadata: {
        status: 'PENDING_SCAN'
      }
    };
    
    // We use uploadBytesResumable to allow for future progress bar integrations
    await uploadBytesResumable(storageRef, file, metadata);
    
    return { path };
  }

  async getSignedUrl(path: string, token: string): Promise<string> {
    const baseUrl = this.getApiUrl().replace(/\/v1$/, ''); // Normalize base URL if it includes /v1
    const endpoint = `${baseUrl}/v1/storage/signed-url?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate signed URL. Access Denied.');
    }

    const data = await response.json();
    return data.url;
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
}

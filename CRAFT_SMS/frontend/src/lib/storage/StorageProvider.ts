export interface StorageProvider {
  /**
   * Uploads a file to the defined school-centric hierarchy.
   * Path resolves to: schools/{schoolId}/{category}/{userId}/{file.name}
   */
  uploadFile(schoolId: string, category: string, userId: string, file: File): Promise<{ path: string }>;
  
  /**
   * Retrieves a short-lived Signed URL for secure download access.
   */
  getSignedUrl(path: string, token: string): Promise<string>;
  
  /**
   * Deletes a file.
   */
  deleteFile(path: string): Promise<void>;
}

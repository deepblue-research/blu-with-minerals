import { Storage, Bucket } from '@google-cloud/storage';
import path from 'path';

export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || '';

    // Uses Application Default Credentials (ADC) by default.
    // In Google Cloud Run, it will automatically use the service account.
    // Locally, it will use the account configured via 'gcloud auth application-default login'.
    this.storage = new Storage();

    if (!this.bucketName) {
      console.warn('GCS_BUCKET_NAME is not defined. Storage service will not function correctly.');
    }
  }

  /**
   * Returns the bucket instance
   */
  private get bucket(): Bucket {
    return this.storage.bucket(this.bucketName);
  }

  /**
   * Uploads a Buffer to Google Cloud Storage and returns the public or signed URL
   * @param buffer The file content
   * @param destination The path within the bucket (e.g., 'invoices/INV-001.pdf')
   * @param contentType The MIME type of the file
   */
  async uploadFile(
    buffer: Buffer,
    destination: string,
    contentType: string = 'application/pdf'
  ): Promise<string> {
    try {
      const file = this.bucket.file(destination);

      await file.save(buffer, {
        metadata: {
          contentType: contentType,
        },
        resumable: false, // Better for small files like PDFs
      });

      console.log(`File uploaded to ${this.bucketName}/${destination}`);

      // If we want the file to be private but accessible via a temporary link:
      return this.getSignedUrl(destination);
    } catch (error) {
      console.error('Error uploading to GCS:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Generates a signed URL for a private file that expires after a certain time
   * @param filePath The path within the bucket
   * @param expiresMinutes How long the URL should be valid (default 60 mins)
   */
  async getSignedUrl(filePath: string, expiresMinutes: number = 60): Promise<string> {
    try {
      const options = {
        version: 'v4' as const,
        action: 'read' as const,
        expires: Date.now() + expiresMinutes * 60 * 1000,
      };

      const [url] = await this.bucket.file(filePath).getSignedUrl(options);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      // Fallback to a generic GCS URL if signing fails (might not work if bucket is private)
      return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
    }
  }

  /**
   * Deletes a file from the bucket
   * @param filePath The path within the bucket
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.bucket.file(filePath).delete();
      console.log(`File ${filePath} deleted from bucket ${this.bucketName}`);
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
      // We don't necessarily want to throw here if the file is already gone
    }
  }

  /**
   * Checks if the bucket is accessible
   */
  async verifyBucket(): Promise<boolean> {
    try {
      const [exists] = await this.bucket.exists();
      return exists;
    } catch (error) {
      console.error('GCS Bucket Access Error:', error);
      return false;
    }
  }
}

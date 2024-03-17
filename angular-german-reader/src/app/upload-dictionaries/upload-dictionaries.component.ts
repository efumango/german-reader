import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-upload-dictionaries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dictionaries.component.html',
  styleUrls: ['./upload-dictionaries.component.css']
})

export class UploadDictionariesComponent {
  fileToUpload: File | null = null;
  uploadStatus: string | null = "File size must not exceed 20 MB.";
  uploadInProgress: boolean = false;
  
  constructor(private http: HttpClient, private authService: AuthService) {}

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      console.error('No file selected.');
      return;
    }
    this.fileToUpload = target.files[0];
    this.uploadStatus = ""; // Reset upload status message when a new file is selected
  }

  uploadDictionary() {
    const MAX_SIZE = 20 * 1024 * 1024;

    if (!this.fileToUpload) {
      console.error('No file to upload.');
      return;
    }

    if (this.fileToUpload.size > MAX_SIZE) {
      this.uploadStatus = 'File size exceeds 20 MB.';
      return;
    }

    this.uploadInProgress = true;
    this.uploadStatus = "Uploading..."; // Provide immediate feedback that the upload has started
    const token = this.authService.getCurrentUserToken();
    if (!token) return; // Exit if token is not available

    const chunkSize = 1 * 1024 * 1024; // for 1MB chunk size
    const totalChunks = Math.ceil(this.fileToUpload.size / chunkSize);
    const fileUuid = uuidv4(); // Generate a unique UUID for the file

    let chunksUploaded = 0;

    // Upload chunks
    Array.from({ length: totalChunks }).forEach((_, index) => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, this.fileToUpload!.size);
      const chunk = this.fileToUpload!.slice(start, end);
      this.uploadChunk(chunk, index, totalChunks, token, fileUuid, () => {
        chunksUploaded++;
        // Update the upload status with progress
        this.uploadStatus = `Processing... (${chunksUploaded}/${totalChunks} processed)`;
        if (chunksUploaded === totalChunks) {
          this.uploadStatus = "All chunks processed";
        }
      });
    });
  }

  private uploadChunk(chunk: Blob, chunkNumber: number, totalChunks: number, token: string, fileUuid: string, callback: () => void) {
    const formData = new FormData();
    formData.append('dictionary', chunk, this.fileToUpload!.name); 
    formData.append('dzchunkindex', String(chunkNumber));
    formData.append('dztotalchunkcount', String(totalChunks));
    formData.append('dzuuid', fileUuid); 

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post('http://127.0.0.1:5000/api/upload-dictionary', formData,
    {headers, reportProgress: true, observe: 'response'}).subscribe({
      next: (response) => {
        callback();
      },
      error: (error) => {
        console.error(error);
        this.uploadStatus = 'Upload failed. Please try again.';
        this.uploadInProgress = false;
      }
    });
  }

}


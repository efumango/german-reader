import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-upload-dictionaries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dictionaries.component.html',
  styleUrls: ['./upload-dictionaries.component.css']
})
export class UploadDictionariesComponent {

  fileToUpload: File | null = null;
  uploadStatus: string | null = null;
  uploadInProgress: boolean = false;
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      console.error('No file selected.');
      return;
    }
    this.fileToUpload = target.files[0];
  }

  uploadDictionary() {
    this.uploadInProgress = true;
    const token = this.getCurrentUserToken();
    if (!token) return; // Exit if token is not available

    if (!this.fileToUpload) {
      console.error('No file to upload.');
      return;
    }

    const chunkSize = 1 * 1024 * 1024; // for 1MB chunk size
    const totalChunks = Math.ceil(this.fileToUpload.size / chunkSize);
    const fileUuid = uuidv4(); // Generate a unique UUID for the file

    let chunksUploaded = 0;
    this.uploadInProgress = true;

    Array.from({ length: totalChunks }).forEach((_, index) => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, this.fileToUpload!.size);
      const chunk = this.fileToUpload!.slice(start, end);
      this.uploadChunk(chunk, index, totalChunks, token, fileUuid, () => {
        chunksUploaded++;
        if (chunksUploaded === totalChunks) {
          this.startPollingForStatus(fileUuid);
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

  private startPollingForStatus(uuid: string) {
      const token = this.getCurrentUserToken(); // Retrieve the current user token
      if (!token) {
        console.error('Token not found. Cannot poll status.');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const pollingInterval = interval(10000); // Poll every 10 seconds
    
      this.pollingSubscription = pollingInterval.pipe(
        takeWhile(() => this.uploadInProgress)
      ).subscribe(() => {
        this.http.get(`http://127.0.0.1:5000/api/upload-status/${uuid}`, { headers }).subscribe({
          next: (response: any) => {
            if (response.status === 'processed') {
              this.uploadStatus = "Upload successful!";
              this.uploadInProgress = false;
              this.pollingSubscription?.unsubscribe();
            } else if (response.status === 'failed') {
              this.uploadStatus = "Upload failed. Please try again.";
              this.uploadInProgress = false;
              this.pollingSubscription?.unsubscribe();
            }
          },
          error: (error) => {
            console.error("Error polling upload status:", error);
          }
        });
      });
    }

  private getCurrentUserToken(): string | null {
    const currentUserJson = localStorage.getItem('currentUser');
    if (!currentUserJson) {
      this.uploadStatus = 'No current user found in local storage';
      return null;
    }

    const currentUser = JSON.parse(currentUserJson);
    const token = currentUser.token;
  
    if (!token) {
      this.uploadStatus = 'No token found for current user';
      return null;
    }

    return token;
  }
}


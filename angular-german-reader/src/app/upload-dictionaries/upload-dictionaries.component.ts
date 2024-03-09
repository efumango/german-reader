import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-upload-dictionaries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dictionaries.component.html',
  styleUrl: './upload-dictionaries.component.css'
})
export class UploadDictionariesComponent {
  
  fileToUpload: File | null = null;
  uploadStatus: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.fileToUpload = event.target.files[0];
  }

  uploadDictionary() {
    if (!this.fileToUpload) return;
  
    // Retrieve the current user and token from local storage
    const currentUserJson = localStorage.getItem('currentUser');
    if (!currentUserJson) {
      console.error('No current user found in local storage');
      return;
    }
    const currentUser = JSON.parse(currentUserJson);
    const token = currentUser.token;
  
    if (!token) {
      console.error('No token found for current user');
      return;
    }
  
    const formData: FormData = new FormData();
    formData.append('dictionary', this.fileToUpload, this.fileToUpload.name);
  
    // Set the headers with the Authorization header
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    // Make the HTTP request with the headers
    this.http.post('http://127.0.0.1:5000/api/upload-dictionary', formData, { headers: headers }).subscribe({
      next: (response) => {
        console.log(response);
        this.uploadStatus = 'Upload successful!';
      },
      error: (error) => {
        console.error(error);
        this.uploadStatus = 'Upload failed. Please try again.';
      }
    });
  }
  
}

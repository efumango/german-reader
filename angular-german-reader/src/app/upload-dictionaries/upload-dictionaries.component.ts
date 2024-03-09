import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
    const formData: FormData = new FormData();
    formData.append('dictionary', this.fileToUpload, this.fileToUpload.name);

    this.http.post('http://127.0.0.1:5000/api/upload-dictionary', formData).subscribe({
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

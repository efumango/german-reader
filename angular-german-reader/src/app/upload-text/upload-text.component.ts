import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-upload-text',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upload-text.component.html',
  styleUrl: './upload-text.component.css'
})

export class UploadTextComponent {
  selectedFile: File | null = null;
  uploadedFiles: string[] = [];
  isUploading: boolean = false; 
  uploadMessage: string = ''

  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit(): void {
    this.fetchUploadedFiles();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      console.error('No file selected.');
      return;
    }
    this.selectedFile = target.files[0];
  }

  token = this.authService.getCurrentUserToken();
  headers = new HttpHeaders({
    'Authorization' : `Bearer ${this.token}`
  })
  
  onUpload(): void {

    if (!this.selectedFile) {
      console.error('No file to upload.');
      return;
    }

    if (!this.token) return; 

    this.uploadMessage = ''; // Reset message
    this.isUploading = true; // Start the upload process

    const formData = new FormData();
    formData.append('text', this.selectedFile!, this.selectedFile!.name);
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })

    this.http.post('http://127.0.0.1:5000/text/upload-text', formData, {headers})
      .subscribe({
        next: (response) => {
          this.uploadMessage = 'Upload successful!';
          this.isUploading = false; // Upload finished
        },
        error: (error) => {
          this.uploadMessage = 'Upload error. Please try again.';
          this.isUploading = false; // Upload finished
        }
    })
  }

  fetchUploadedFiles(): void {
    if (!this.token) return; 

    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })

    this.http.get<string[]>('http://127.0.0.1:5000/text/files', {headers})
      .subscribe({
        next: (files) => {
          this.uploadedFiles = files;
        },
        error: (error) => {
          console.error('Failed to fetch uploaded files', error);
        }
    });
  }

  onDelete(filename: string): void{
    if (!this.token) return; 
    
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    
    this.http.post('http://127.0.0.1:5000/text/delete_file', {filename}, {headers})
      .subscribe({
        next: (response) => {
          console.log('File deleted successfully', response);
          // Refresh the list of uploaded files after deletion
          this.fetchUploadedFiles(); 
        },
        error: (error) => {
          console.error('File deletion error', error)
        }
      }    
    )
  }
}

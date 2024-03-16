import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-text.component.html',
  styleUrl: './upload-text.component.css'
})

export class UploadTextComponent {
  selectedFile: File | null = null;
  uploadedFiles: string[] = [];
  
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

    const formData = new FormData();
    formData.append('text', this.selectedFile!, this.selectedFile!.name);
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })

    this.http.post('http://127.0.0.1:5000/text/upload-text', formData, {headers})
      .subscribe({
        next: (response) => {
          console.log('Upload successful', response);
        },
        error: (error) => {
          console.error('Upload error', error);
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

  onView(file: string): void {
    if (!this.token) return;
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
  
    this.http.get(`http://127.0.0.1:5000/text/files/${file}`, { headers, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, '_blank');
        },
        error: (error) => {
          console.error('Failed to fetch file', error);
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

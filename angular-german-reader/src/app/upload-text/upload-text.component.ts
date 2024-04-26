import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import {FormsModule} from '@angular/forms'
@Component({
  selector: 'app-upload-text',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './upload-text.component.html',
  styleUrl: './upload-text.component.scss'
})

export class UploadTextComponent {
  private apiUrl = `${environment.apiUrl}`
  selectedFile: File | null = null;
  uploadedFiles: { name: string; selected: boolean }[] = [];  isUploading: boolean = false; 
  uploadMessage: string = ''
  allSelected: boolean=false;

  constructor(private http: HttpClient, private authService: AuthService, private loggingService: LoggingService) { }
  
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
    this.onUpload();
  }

  token = this.authService.getCurrentUserToken();

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

    this.http.post(`${this.apiUrl}/upload-text`, formData, {headers})
      .subscribe({
        next: (response) => {
          this.uploadMessage = 'Upload successful!';
          this.isUploading = false; 

          this.fetchUploadedFiles();
          this.loggingService.log('uploaded file');
        },
        error: (error) => {
          this.uploadMessage = 'Upload error. Please try again.';
          this.isUploading = false; 
        }
    })
  }

  fetchUploadedFiles(): void {
    if (!this.token) return; 

    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })

    this.http.get<string[]>(`${this.apiUrl}/files`, {headers})
      .subscribe({
        next: (files) => {
          this.uploadedFiles = files.map(fileName => ({ name: fileName, selected: false }));        },
        error: (error) => {
          console.error('Failed to fetch uploaded files', error);
        }
    });
  }

  toggleAllSelections(selectAll: boolean): void {
    this.uploadedFiles.forEach(file => {
      file.selected = selectAll;
    });
  }

  updateAllSelected(): void {
    this.allSelected = this.uploadedFiles.every(file => file.selected);
  }
  
  onDeleteSelected(): void {
    const selectedFiles = this.uploadedFiles.filter(file => file.selected).map(file => file.name);
    
    if (!this.token || selectedFiles.length === 0) return;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
  
    selectedFiles.forEach(filename => {
      this.http.post(`${this.apiUrl}/delete-file`, {filename}, {headers})
        .subscribe({
          next: (response) => {
            console.log('File deleted successfully', response);
            // Remove the deleted file from the uploadedFiles list
            this.uploadedFiles = this.uploadedFiles.filter(file => !selectedFiles.includes(file.name));
            // Send logging to backend 
            this.loggingService.log('deleted file');
          },
          error: (error) => {
            console.error('File deletion error', error);
          }
        });
    });
  }  

}

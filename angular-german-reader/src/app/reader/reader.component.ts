import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextSelectionDirective } from '../text-selection.directive';
import nlp from 'de-compromise';

  @Component({
    selector: 'app-reader',
    standalone: true,
    imports: [CommonModule, TextSelectionDirective],
    templateUrl: './reader.component.html',
    styleUrl: './reader.component.css'
  })
  export class ReaderComponent {
    textContent: string = '';
    token = this.authService.getCurrentUserToken();

    constructor(
      private http: HttpClient, 
      private authService: AuthService,
      private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
      this.route.params.subscribe(params => {
        const filename = params['filename'];
        if (filename) {
          this.onView(filename);
        }
      });
    }

    onView(filename: string): void {
      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }
    
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });
    
      this.http.get(`http://127.0.0.1:5000/api/files/${filename}`, { headers, responseType: 'text' })
        .subscribe({
          next: (content) => {
            // Format the content for display
            this.textContent = this.formatContentForDisplay(content);
          },
          error: (error) => {
            console.error('Failed to fetch file', error);
          }
        });
    }
    
    formatContentForDisplay(text: string): string {
      // Split the text into paragraphs at one or more newline characters
      const paragraphs = text.split(/\n\s*\n/);
      // Wrap each paragraph in <p> tags and join them into a single string
      return paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('');
    }    
    
    onTextSelected(text: string){
      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });

      this.http.post(`http://127.0.0.1:5000/api/query-db`, {text}, {headers}).
      subscribe({
        next: (response) => console.log('Response from backend:', response),
        error: (error) => console.error('Error:', error)
      });
    }

    onTextContext(textContext: { text: string, context: string }) {
      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }
    
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });
    
      // Call the endpoint that handles the selected text with context
      this.http.post('http://127.0.0.1:5000/api/process-and-query-db', textContext, { headers }).subscribe(response => {
        console.log('DB Query Response for Text with Context:', response);
      });
    }
  }

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextSelectionDirective } from '../text-selection.directive';

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
          this.textContent = content;
        },
        error: (error) => {
          console.error('Failed to fetch file', error);
        }
      });
  }

  logSelectedText(text: string) {
    console.log('Selected text:', text);
  }

  onLookUp(text: string){
    if (!this.token) {
      console.error('No token available for authentication.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    this.http.post(`http://127.0.0.1:5000/api/analyze-text`, {text}, {headers}).
    subscribe({
      next: (response) => console.log('Response from backend:', response),
      error: (error) => console.error('Error:', error)
    });
  }
}

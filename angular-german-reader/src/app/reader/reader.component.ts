import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.css'
})
export class ReaderComponent {
  textContent: string = '';

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
    const token = this.authService.getCurrentUserToken();
    if (!token) {
      console.error('No token available for authentication.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(`http://127.0.0.1:5000/text/files/${filename}`, { headers, responseType: 'text' })
      .subscribe({
        next: (content) => {
          this.textContent = content;
        },
        error: (error) => {
          console.error('Failed to fetch file', error);
        }
      });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  private apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  log(activity: string, filename?: string, word?: string): void {
    const timestamp = new Date().toISOString();
    const username = this.authService.getCurrentUser();
    let logMessage = `${timestamp},${username},${activity}`;

    // Append filename to log message if it exists
    if (filename) {
      logMessage += `,${filename}`;
    }

    // Append word to log message if it exists
    if (word) {
      logMessage += `,${word}`;
    }

    this.http.post(this.apiUrl, { logMessage }).subscribe({
      next: () => console.log('Log sent to backend'),
      error: error => console.error('Error sending log to backend', error)
    });
  }
}

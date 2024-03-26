import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VocabService {
  token = this.authService.getCurrentUserToken();

  constructor(private http: HttpClient, private authService: AuthService) { }
  
  addWord(word: string, definition: string): Observable<any> {

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    return this.http.post('http://127.0.0.1:5000/api/vocab/add-word', { word, definition }, {headers});
  }

}

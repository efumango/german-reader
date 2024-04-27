import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VocabService {
  token = this.authService.getCurrentUserToken();
  private apiUrl = `${environment.apiUrl}/vocab`;
  constructor(private http: HttpClient, private authService: AuthService) { }

  addWord(word: string, definition: string, inflection: string, sentence: string, filename: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-word`, { word, definition, inflection, sentence, filename }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  getVocabList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/show-list-vocab`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  deduplicateWords(): Observable<any> {
    return this.http.post(`${this.apiUrl}/deduplicate`, {}, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  deleteSelectedWords(wordIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, { word_ids: wordIds }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  saveModifiedVocabs(modifiedVocabs: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, modifiedVocabs, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }
}

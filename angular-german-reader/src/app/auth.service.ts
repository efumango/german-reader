import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private isBrowser: boolean;

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }
  
  signup(username: string, password: string) {
    return this.http.post<any>('http://127.0.0.1:5000/api/signup', { username, password })
      .pipe(
        catchError(error => {
          console.error('Signup error', error);
          return throwError(error);;
        })
      );
  }
  
  login(username: string, password: string) {
    return this.http.post<any>('http://127.0.0.1:5000/api/login', { username, password })
      .pipe(
        map(response => {
          if (response && response.access_token) {
            const token = response.access_token;
            localStorage.setItem('currentUser', JSON.stringify({ username, token }));
            return { username, token };
          } else {
            throw new Error('No token received');
          }
        }),
        catchError(error => {
          console.error('Login failed', error);
          return throwError(error);
        })
      );
  }

  logout() {
    if (this.isBrowser){
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    //this.router.navigate(['/login']);
  }
}

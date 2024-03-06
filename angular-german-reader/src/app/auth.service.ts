import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  public isLoggedIn: Observable<boolean>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.isLoggedIn = this.currentUser.pipe(map(user => !!user));
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
          if (response && response.user && response.user.token) {
            const token = response.user.token;
            localStorage.setItem('currentUser', JSON.stringify({ username, token }));
            this.currentUserSubject.next(username);
          
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
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/welcome']);
    console.log("Logged out");
  }
}

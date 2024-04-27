import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public currentUser: Observable<any> = this.currentUserSubject.asObservable();
  public isLoggedIn: Observable<boolean> = this.currentUser.pipe(map(user => !!user));

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.isLoggedIn = this.currentUser.pipe(map(user => !!user));
  }

  getCurrentUser(): string | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.username : null;
  }  

  getCurrentUserToken(): string | null {
    return this.currentUserSubject.value ? this.currentUserSubject.value.token : null;
  }

  signup(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/signup`, { username, password })
      .pipe(
        catchError(error => {
          console.error('Signup error', error);
          return throwError(error);;
        })
      );
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        map(response => {
          if (response && response.user && response.user.token) {
            const { username, token } = response.user;
            localStorage.setItem('currentUser', JSON.stringify({ username, token }));
            this.currentUserSubject.next({ username, token });
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

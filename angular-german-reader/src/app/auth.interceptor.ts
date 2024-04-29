import { HttpEvent, HttpHandler, HttpRequest, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  constructor(private router: Router) {} 
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(catchError(err => {
      console.log('Error: '+ err.status);
      if (err.status === 401) {
        // Update authentication state to indicate user is not logged in
        this.currentUserSubject.next(null);
        // Remove any user-related data from local storage
        localStorage.removeItem('currentUser');
        // Alert the user 
        alert('Your session has expired. Please refresh the page to log in again.');
        // Redirect to the login page
        this.router.navigate(['/login']);
        console.log('redirecting');
      }
      const error = err.error?.message || err.statusText;
            console.error(err);
            return throwError(() => error);
        }))
  }
}

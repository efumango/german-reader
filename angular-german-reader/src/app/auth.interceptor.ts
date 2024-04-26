import { HttpEvent, HttpHandler, HttpRequest, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {} 
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(catchError(err => {
      if ([401].includes(err.status)) {
        this.router.navigate(['/login']);
        console.log('redirecting');
      }
      const error = err.error?.message || err.statusText;
            console.error(err);
            return throwError(() => error);
        }))
  }
}

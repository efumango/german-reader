import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service'; 

export const AuthGuard: { canActivate: CanActivateFn } = {
  canActivate: (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.isLoggedIn.pipe(
      take(1), // Take the first value emitted and complete
      map(isLoggedIn => {
        if (!isLoggedIn) {
          // If not logged in, redirect to the welcome page
          router.navigate(['/welcome']);
          return false;
        }
        // If logged in, allow the route activation
        return true;
      })
    );
  }
};

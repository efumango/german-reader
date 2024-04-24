import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getIsLoggedIn'], {
      isLoggedIn: of(true) // Mock the initial state as logged in
    });
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  function handleAuthGuardResult(result: boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree>) {
    // Convert result to an Observable if it's not already one
    if (result instanceof Observable) {
      return result;
    } else if (result instanceof Promise) {
      return from(result);
    } else {
      // For boolean or UrlTree, wrap it into an Observable
      return of(result);
    }
  }

  it('should allow route activation for logged-in user', (done) => {
    authServiceMock.isLoggedIn = of(true); // Assume user is logged in

    const result = AuthGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    handleAuthGuardResult(result).subscribe(isAllowed => {
      expect(isAllowed).toBeTrue();
      done();
    });
  });

  it('should redirect an unauthenticated user to the welcome page', (done) => {
    authServiceMock.isLoggedIn = of(false); // Assume user is not logged in

    const result = AuthGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    handleAuthGuardResult(result).subscribe(isAllowed => {
      expect(routerMock.navigate).toHaveBeenCalledWith(['/welcome']);
      expect(isAllowed).toBeFalse();
      done();
    });
  });
});

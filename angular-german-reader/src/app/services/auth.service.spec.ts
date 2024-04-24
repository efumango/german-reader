import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should signup a user', () => {
    const dummyUser = { username: 'testuser', password: 'password' };

    authService.signup(dummyUser.username, dummyUser.password).subscribe(user => {
      expect(user).toEqual(dummyUser);
    });

    const req = httpMock.expectOne('http://127.0.0.1:5000/auth/signup');
    expect(req.request.method).toBe('POST');
    req.flush(dummyUser);
  });

  it('should login a user', () => {
    const dummyResponse = { user: { username: 'testuser', token: 'dummytoken' } };

    authService.login('testuser', 'password').subscribe(user => {
      expect(user).toEqual(dummyResponse.user);
    });

    const req = httpMock.expectOne('http://127.0.0.1:5000/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(dummyResponse);
    expect(localStorage.getItem('currentUser')).toEqual(JSON.stringify(dummyResponse.user));
    expect(authService.currentUserValue).toEqual(dummyResponse.user.username);
  });

  it('should handle login failure', () => {
    authService.login('testuser', 'wrongpassword').subscribe({
      error: err => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://127.0.0.1:5000/auth/login');
    expect(req.request.method).toBe('POST');
    req.error(new ErrorEvent('login error'), { status: 401 });
  });

  it('should logout a user', () => {
    spyOn(localStorage, 'removeItem');
    authService.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
    expect(authService.currentUserValue).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/welcome']);
  });
});

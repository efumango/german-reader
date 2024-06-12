import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signup', () => {
    it('should signup a user and return response', () => {
      const signupResponse = { user: { username: 'testuser' } };
      service.signup('testuser', 'password').subscribe({
        next: response => {
          expect(response).toEqual(signupResponse);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/signup`);
      expect(req.request.method).toBe('POST');
      req.flush(signupResponse);
    });

    it('should handle signup error', () => {
      const errorMessage = 'Signup error';
      service.signup('testuser', 'password').subscribe({
        next: () => fail('expected an error, not signup response'),
        error: error => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${apiUrl}/signup`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('login', () => {
    it('should login a user and set currentUser', () => {
      const loginResponse = { user: { username: 'testuser', token: 'testtoken' } };

      service.login('testuser', 'password').subscribe({
        next: response => {
          expect(response).toEqual({ username: 'testuser', token: 'testtoken' });
          expect(service.getCurrentUser()).toBe('testuser');
          expect(service.getCurrentUserToken()).toBe('testtoken');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(loginResponse);
    });

    it('should handle login error', () => {
      const errorMessage = 'Login failed';
      service.login('testuser', 'password').subscribe({
        next: () => fail('expected an error, not login response'),
        error: error => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    it('should logout a user and navigate to welcome', () => {
      spyOn(localStorage, 'removeItem').and.callFake(() => {});
      service.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(service.getCurrentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/welcome']);
    });
  });
});

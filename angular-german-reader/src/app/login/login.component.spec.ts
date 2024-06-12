import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { LoggingService } from '../services/logging.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let router: Router;
  let routerNavigateSpy: jasmine.Spy;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['log']);
    
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    router = TestBed.inject(Router);
    routerNavigateSpy = spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call login when form is invalid', () => {
    component.loginForm.controls['username'].setValue('');
    component.loginForm.controls['password'].setValue('');
    component.onSubmit();
    expect(authService.login.calls.any()).toBe(false);
  });

  it('should call login and navigate on successful login', () => {
    component.loginForm.controls['username'].setValue('testuser');
    component.loginForm.controls['password'].setValue('password');

    authService.login.and.returnValue(of({ username: 'testuser', token: 'test-token' }));

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('testuser', 'password');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/text']);
    expect(loggingService.log).toHaveBeenCalledWith('log in');
  });

  it('should handle login error', () => {
    spyOn(window, 'alert');
    component.loginForm.controls['username'].setValue('testuser');
    component.loginForm.controls['password'].setValue('password');

    authService.login.and.returnValue(throwError(() => new Error('Wrong username or password.')));

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('testuser', 'password');
    expect(routerNavigateSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Wrong username or password.');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SignupComponent } from './signup.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let routerNavigateSpy: jasmine.Spy;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['signup']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    routerNavigateSpy = spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call signup when form is invalid', () => {
    component.signupForm.controls['username'].setValue('');
    component.signupForm.controls['password'].setValue('');
    component.onSubmit();
    expect(authService.signup.calls.any()).toBe(false);
  });

  it('should call signup and navigate on successful signup', () => {
    component.signupForm.controls['username'].setValue('testuser');
    component.signupForm.controls['password'].setValue('password');

    authService.signup.and.returnValue(of({}));

    component.onSubmit();

    expect(authService.signup).toHaveBeenCalledWith('testuser', 'password');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should handle signup error', () => {
    spyOn(window, 'alert');
    component.signupForm.controls['username'].setValue('testuser');
    component.signupForm.controls['password'].setValue('password');

    authService.signup.and.returnValue(throwError(() => new Error('Username already existed.')));

    component.onSubmit();

    expect(authService.signup).toHaveBeenCalledWith('testuser', 'password');
    expect(routerNavigateSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Username already existed.');
  });
});

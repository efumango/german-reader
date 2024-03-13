import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; 
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerSpy: jasmine.Spy;
  let router: Router; 
  
  beforeEach(async () => {
    // Create a mock for AuthService with a stub for the login method
    authServiceMock = {
      login: jasmine.createSpy('login').and.returnValue(of({ token: 'fake-token' })) // Simulate successful login
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule, 
        LoginComponent
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock } // Provide the mock AuthService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])]
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    routerSpy = spyOn(router, 'navigate'); // Spy on the navigate method
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('username and password fields validity', () => {
    let username = component.loginForm.controls['username'];
    let password = component.loginForm.controls['password'];

    expect(username.valid).toBeFalsy();
    expect(password.valid).toBeFalsy();

    // Set values to the form fields
    username.setValue("testUser");
    password.setValue("password");

    expect(username.valid).toBeTruthy();
    expect(password.valid).toBeTruthy();
  });

  it('should call AuthService.login and navigate on valid form submission', () => {
    component.loginForm.controls['username'].setValue("testUser");
    component.loginForm.controls['password'].setValue("password");

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith("testUser", "password");
    expect(routerSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle login error with an alert when credentials are wrong', () => {
    authServiceMock.login.and.returnValue(throwError(() => new Error('Wrong username or password.')));

    component.loginForm.controls['username'].setValue("wrongUser");
    component.loginForm.controls['password'].setValue("wrongPassword");

    spyOn(window, 'alert'); // Spy on window.alert to check if it gets called

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith("wrongUser", "wrongPassword");
    expect(window.alert).toHaveBeenCalledWith('Wrong username or password.');
  });
});

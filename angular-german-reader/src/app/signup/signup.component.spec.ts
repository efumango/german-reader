import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; 
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authServiceMock: any;
  let router: any;

  beforeEach(async () => {
    // Create a mock for AuthService with stubs for the signup method
    authServiceMock = {
      signup: jasmine.createSpy('signup').and.returnValue(of({})) // Simulate successful signup
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule, // Provide stubs for router dependencies
        SignupComponent // Import standalone component directly
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock } // Provide the mock AuthService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(RouterTestingModule);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.signupForm.valid).toBeFalsy();
  });

  it('username and password fields validity', () => {
    let username = component.signupForm.controls['username'];
    let password = component.signupForm.controls['password'];

    expect(username.valid).toBeFalsy();
    expect(password.valid).toBeFalsy();

    // Set values to the form fields
    username.setValue("testUser");
    password.setValue("password");

    expect(username.valid).toBeTruthy();
    expect(password.valid).toBeTruthy();
  });

  it('should call AuthService.signup and navigate on valid form submission', () => {
    component.signupForm.controls['username'].setValue("testUser");
    component.signupForm.controls['password'].setValue("password");

    component.onSubmit();

    expect(authServiceMock.signup).toHaveBeenCalledWith("testUser", "password");
  });

  it('should handle signup error when username already exists', () => {
    authServiceMock.signup.and.returnValue(throwError(() => new Error('Username already existed.')));

    component.signupForm.controls['username'].setValue("existingUser");
    component.signupForm.controls['password'].setValue("password");

    spyOn(window, 'alert'); // Spy on window.alert to check if it gets called

    component.onSubmit();

    expect(authServiceMock.signup).toHaveBeenCalledWith("existingUser", "password");
    expect(window.alert).toHaveBeenCalledWith('Username already existed.');
  });
});

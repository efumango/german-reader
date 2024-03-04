// src/app/signup/signup.component.ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service'; // Adjust path as necessary
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class SignupComponent {
  signupForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router) {}

  onSubmit() {
    if (this.signupForm.valid) {
      // Extract username and password from the form
      const username = this.signupForm.value.username;
      const password = this.signupForm.value.password;
  
      // Check if username or password is undefined or null
      if (typeof username === 'string' && typeof password === 'string') {
        this.authService.signup(username, password).subscribe({
          next: () => {
            // Handle successful signup
            console.log('Signup successful');
            // Redirect the user
            this.router.navigate(['/login']);
          },
          error: error => {
            // Handle signup error
            console.error('Signup failed', error);
          }
        });
      } else {
        // Handle the case where username or password is not a string
        console.error('Username or password is missing or invalid.');
      }
    }
  }
  
}

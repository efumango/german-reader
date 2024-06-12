import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class SignupComponent {
  signupForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) { }

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
            alert('Username already existed.')
            console.error('Signup failed: Username already existed.', error);
          }
        });
      } else {
        // Handle the case where username or password is not a string
        console.error('Username or password is missing or invalid.');
      }
    }
  }

}

import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class LoginComponent {
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const password = this.loginForm.value.password;
      if (typeof username === 'string' && typeof password === 'string') {
        this.authService.login(username, password).subscribe({
          next: (user) => {
            if (user && user.token) {
              console.log("Login successful.")
              //this.router.navigate(['/dashboard']); 
            } else {
              console.error('Login successful, but no token received');
            }
          },
          error: (err) => {
            console.error('Login failed', err);
          }
        });
      }
    }
  }
}

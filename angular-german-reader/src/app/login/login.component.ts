import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})

export class LoginComponent {
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  isLoggedIn: boolean = false;

  constructor(private fb: FormBuilder, public authService: AuthService, private router: Router) {}
  
  onSubmit() {
    if (this.loginForm.valid) {
      const username = this.loginForm.value.username;
      const password = this.loginForm.value.password;
      if (typeof username === 'string' && typeof password === 'string') {
        this.authService.login(username, password).subscribe({
          next: (user) => {
            if (user && user.token) {
              console.log("Login successful.")
              this.router.navigate(['/dashboard']); 
            } else {
              console.error('Login successful, but no token received');
            }
          },
          error: (err) => {
            alert('Wrong username or password.')
            console.error('Login failed', err);
          }
        });
      }
    }
  }
}

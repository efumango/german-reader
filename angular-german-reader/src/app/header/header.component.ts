import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; 
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule] 
})
export class HeaderComponent {
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) {
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
    });
  }

  logout() {
    this.authService.logout();
  }
}

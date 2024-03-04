import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { RouterModule } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      RouterModule.forRoot([
      { path: 'login', loadComponent: () => import('./app/login/login.component').then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./app/signup/signup.component').then(m => m.SignupComponent) },
    ])),
    // Add any global providers your app might need
  ],
}).catch(err => console.error(err));

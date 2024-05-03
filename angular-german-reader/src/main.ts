/// <reference types="@angular/localize" />

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { RouterModule } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch } from '@angular/common/http';
import { AuthGuard } from './app/guards/auth.guard'; 
import { AuthInterceptor
  
 } from './app/interceptor/auth.interceptor';
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
      { path: 'welcome', loadComponent: () => import('./app/welcome/welcome.component').then(m => m.WelcomeComponent) },
      { path: '', redirectTo: '/welcome', pathMatch: 'full' }, // Redirect empty path to /welcome
      { path: 'dashboard', loadComponent: () => import('./app/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard.canActivate] },
      { path: 'reader/:filename', loadComponent: () => import('./app/reader/reader.component').then(m=>m.ReaderComponent),canActivate: [AuthGuard.canActivate]},
      { path: 'vocab', loadComponent: () => import('./app/vocab/vocab.component').then(m=>m.VocabComponent), canActivate: [AuthGuard.canActivate] },
      { path: 'text', loadComponent: () => import('./app/upload-text/upload-text.component').then(m=>m.UploadTextComponent), canActivate: [AuthGuard.canActivate] },
      { path: 'dictionary', loadComponent: () => import('./app/upload-dictionaries/upload-dictionaries.component').then(m=>m.UploadDictionariesComponent), canActivate: [AuthGuard.canActivate] }
    ])),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
}).catch(err => console.error(err));

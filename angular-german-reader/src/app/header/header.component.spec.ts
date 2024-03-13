import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    // Create a mock for AuthService with a stub for the 'currentUser' observable
    authServiceMock = {
      currentUser: of(null), 
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, 
        HeaderComponent 
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock } 
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
});

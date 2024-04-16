import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnsavedDataConfirmModalComponent } from './unsaved-data-confirm-modal.component';

describe('UnsavedDataConfirmModalComponent', () => {
  let component: UnsavedDataConfirmModalComponent;
  let fixture: ComponentFixture<UnsavedDataConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnsavedDataConfirmModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnsavedDataConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

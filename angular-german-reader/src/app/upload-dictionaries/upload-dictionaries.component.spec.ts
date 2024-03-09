import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDictionariesComponent } from './upload-dictionaries.component';

describe('UploadDictionariesComponent', () => {
  let component: UploadDictionariesComponent;
  let fixture: ComponentFixture<UploadDictionariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDictionariesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadDictionariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

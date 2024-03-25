import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefinitionPopUpComponent } from './definition-pop-up.component';

describe('DefinitionPopUpComponent', () => {
  let component: DefinitionPopUpComponent;
  let fixture: ComponentFixture<DefinitionPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinitionPopUpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DefinitionPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

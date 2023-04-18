import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalerLandingPageComponent } from './modaler-landing-page.component';

describe('ModalerLandingPageComponent', () => {
  let component: ModalerLandingPageComponent;
  let fixture: ComponentFixture<ModalerLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalerLandingPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalerLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

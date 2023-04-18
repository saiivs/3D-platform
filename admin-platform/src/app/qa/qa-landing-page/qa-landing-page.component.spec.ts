import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaLandingPageComponent } from './qa-landing-page.component';

describe('QaLandingPageComponent', () => {
  let component: QaLandingPageComponent;
  let fixture: ComponentFixture<QaLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaLandingPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

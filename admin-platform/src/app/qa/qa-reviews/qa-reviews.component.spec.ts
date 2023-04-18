import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaReviewsComponent } from './qa-reviews.component';

describe('QaReviewsComponent', () => {
  let component: QaReviewsComponent;
  let fixture: ComponentFixture<QaReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaReviewsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

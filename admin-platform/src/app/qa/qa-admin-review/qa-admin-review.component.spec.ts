import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaAdminReviewComponent } from './qa-admin-review.component';

describe('QaAdminReviewComponent', () => {
  let component: QaAdminReviewComponent;
  let fixture: ComponentFixture<QaAdminReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaAdminReviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaAdminReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

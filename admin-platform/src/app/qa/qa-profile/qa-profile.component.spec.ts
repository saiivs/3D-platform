import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaProfileComponent } from './qa-profile.component';

describe('QaProfileComponent', () => {
  let component: QaProfileComponent;
  let fixture: ComponentFixture<QaProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminModelCorrectionComponent } from './admin-model-correction.component';

describe('AdminModelCorrectionComponent', () => {
  let component: AdminModelCorrectionComponent;
  let fixture: ComponentFixture<AdminModelCorrectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminModelCorrectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminModelCorrectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

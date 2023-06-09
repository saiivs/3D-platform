import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrectionDilogComponent } from './correction-dilog.component';

describe('CorrectionDilogComponent', () => {
  let component: CorrectionDilogComponent;
  let fixture: ComponentFixture<CorrectionDilogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CorrectionDilogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorrectionDilogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

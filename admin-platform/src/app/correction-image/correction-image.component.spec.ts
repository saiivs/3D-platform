import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrectionImageComponent } from './correction-image.component';

describe('CorrectionImageComponent', () => {
  let component: CorrectionImageComponent;
  let fixture: ComponentFixture<CorrectionImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CorrectionImageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorrectionImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

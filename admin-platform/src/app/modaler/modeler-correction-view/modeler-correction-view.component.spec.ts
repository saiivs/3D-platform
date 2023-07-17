import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelerCorrectionViewComponent } from './modeler-correction-view.component';

describe('ModelerCorrectionViewComponent', () => {
  let component: ModelerCorrectionViewComponent;
  let fixture: ComponentFixture<ModelerCorrectionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelerCorrectionViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelerCorrectionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

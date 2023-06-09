import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelWarningComponent } from './model-warning.component';

describe('ModelWarningComponent', () => {
  let component: ModelWarningComponent;
  let fixture: ComponentFixture<ModelWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelWarningComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

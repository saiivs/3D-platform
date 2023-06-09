import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelFullscreenComponent } from './model-fullscreen.component';

describe('ModelFullscreenComponent', () => {
  let component: ModelFullscreenComponent;
  let fixture: ComponentFixture<ModelFullscreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelFullscreenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelFullscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

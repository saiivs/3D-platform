import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelerStatusComponent } from './modeler-status.component';

describe('ModelerStatusComponent', () => {
  let component: ModelerStatusComponent;
  let fixture: ComponentFixture<ModelerStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelerStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelerStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

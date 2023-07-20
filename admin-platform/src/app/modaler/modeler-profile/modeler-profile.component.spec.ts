import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelerProfileComponent } from './modeler-profile.component';

describe('ModelerProfileComponent', () => {
  let component: ModelerProfileComponent;
  let fixture: ComponentFixture<ModelerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelerProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

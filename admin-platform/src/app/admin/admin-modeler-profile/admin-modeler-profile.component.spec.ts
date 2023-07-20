import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminModelerProfileComponent } from './admin-modeler-profile.component';

describe('AdminModelerProfileComponent', () => {
  let component: AdminModelerProfileComponent;
  let fixture: ComponentFixture<AdminModelerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminModelerProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminModelerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

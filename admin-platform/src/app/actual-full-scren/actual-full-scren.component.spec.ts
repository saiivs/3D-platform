import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualFullScrenComponent } from './actual-full-scren.component';

describe('ActualFullScrenComponent', () => {
  let component: ActualFullScrenComponent;
  let fixture: ComponentFixture<ActualFullScrenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActualFullScrenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualFullScrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

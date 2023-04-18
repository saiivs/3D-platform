import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QAPortComponent } from './qa-port.component';

describe('QAPortComponent', () => {
  let component: QAPortComponent;
  let fixture: ComponentFixture<QAPortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QAPortComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QAPortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

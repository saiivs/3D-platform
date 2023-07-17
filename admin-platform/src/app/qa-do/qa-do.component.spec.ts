import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaDoComponent } from './qa-do.component';

describe('QaDoComponent', () => {
  let component: QaDoComponent;
  let fixture: ComponentFixture<QaDoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaDoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaDoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

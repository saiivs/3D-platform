import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaProductsComponent } from './qa-products.component';

describe('QaProductsComponent', () => {
  let component: QaProductsComponent;
  let fixture: ComponentFixture<QaProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QaProductsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

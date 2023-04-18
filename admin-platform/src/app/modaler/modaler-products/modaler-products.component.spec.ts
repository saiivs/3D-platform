import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalerProductsComponent } from './modaler-products.component';

describe('ModalerProductsComponent', () => {
  let component: ModalerProductsComponent;
  let fixture: ComponentFixture<ModalerProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalerProductsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalerProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

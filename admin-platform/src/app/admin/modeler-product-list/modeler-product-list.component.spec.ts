import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelerProductListComponent } from './modeler-product-list.component';

describe('ModelerProductListComponent', () => {
  let component: ModelerProductListComponent;
  let fixture: ComponentFixture<ModelerProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelerProductListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelerProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelerHotspotViewComponent } from './modeler-hotspot-view.component';

describe('ModelerHotspotViewComponent', () => {
  let component: ModelerHotspotViewComponent;
  let fixture: ComponentFixture<ModelerHotspotViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelerHotspotViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelerHotspotViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

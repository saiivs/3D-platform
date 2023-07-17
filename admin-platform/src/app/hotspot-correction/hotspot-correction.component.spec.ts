import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotspotCorrectionComponent } from './hotspot-correction.component';

describe('HotspotCorrectionComponent', () => {
  let component: HotspotCorrectionComponent;
  let fixture: ComponentFixture<HotspotCorrectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HotspotCorrectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotspotCorrectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

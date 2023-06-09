import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllModelsComponent } from './all-models.component';

describe('AllModelsComponent', () => {
  let component: AllModelsComponent;
  let fixture: ComponentFixture<AllModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllModelsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

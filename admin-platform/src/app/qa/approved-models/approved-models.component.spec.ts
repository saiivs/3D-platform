import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedModelsComponent } from './approved-models.component';

describe('ApprovedModelsComponent', () => {
  let component: ApprovedModelsComponent;
  let fixture: ComponentFixture<ApprovedModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApprovedModelsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovedModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

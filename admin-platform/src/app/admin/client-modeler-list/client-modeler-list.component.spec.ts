import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientModelerListComponent } from './client-modeler-list.component';

describe('ClientModelerListComponent', () => {
  let component: ClientModelerListComponent;
  let fixture: ComponentFixture<ClientModelerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientModelerListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientModelerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

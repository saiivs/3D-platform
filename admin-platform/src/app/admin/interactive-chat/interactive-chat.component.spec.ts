import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveChatComponent } from './interactive-chat.component';

describe('InteractiveChatComponent', () => {
  let component: InteractiveChatComponent;
  let fixture: ComponentFixture<InteractiveChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractiveChatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractiveChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

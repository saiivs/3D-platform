import { TestBed } from '@angular/core/testing';

import { ModalerGuard } from './modaler.guard';

describe('ModalerGuard', () => {
  let guard: ModalerGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ModalerGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

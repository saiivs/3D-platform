import { TestBed } from '@angular/core/testing';

import { QAGuardGuard } from './qa-guard.guard';

describe('QAGuardGuard', () => {
  let guard: QAGuardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(QAGuardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

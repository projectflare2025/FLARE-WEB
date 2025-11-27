import { TestBed } from '@angular/core/testing';

import { RealtimeDbService } from '../services/realtime-db';

describe('RealtimeDb', () => {
  let service: RealtimeDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealtimeDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

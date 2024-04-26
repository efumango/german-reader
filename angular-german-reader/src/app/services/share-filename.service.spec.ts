import { TestBed } from '@angular/core/testing';

import { ShareFilenameService } from './share-filename.service';

describe('ShareFilenameService', () => {
  let service: ShareFilenameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareFilenameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

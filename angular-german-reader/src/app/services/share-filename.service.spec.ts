import { TestBed } from '@angular/core/testing';

import { ShareFilename } from './share-filename.service';

describe('ShareFilenameService', () => {
  let service: ShareFilename;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareFilename);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

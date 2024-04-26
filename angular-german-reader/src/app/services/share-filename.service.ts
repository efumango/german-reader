import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShareFilename {
  private filename: string | null = null;

  setFilename(filename: string): void {
    this.filename = filename;
  }

  getFilename(): string | null {
    return this.filename;
  }
}

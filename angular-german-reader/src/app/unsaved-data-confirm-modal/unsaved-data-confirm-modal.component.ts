import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'unsaved-data-confirm-modal',
  standalone: true,
  templateUrl: './unsaved-data-confirm-modal.component.html',
})
export class UnsavedDataConfirmModal {
	constructor(public activeModal: NgbActiveModal) {}

  confirm() {
    this.activeModal.close();
  }

  dismiss() {
    this.activeModal.dismiss();
  }
}
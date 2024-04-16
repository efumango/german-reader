import { inject } from '@angular/core';
import { DirtyComponent } from './dirty-component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnsavedDataConfirmModal } from './unsaved-data-confirm-modal/unsaved-data-confirm-modal.component';

export const hasUnsavedChangesGuard = (async (component: DirtyComponent) => {
  const isDirty = component.isDirty();
  let shouldNavigate = true;
  if (isDirty) {
    const modalService = inject(NgbModal);
    const modalRef = modalService.open(UnsavedDataConfirmModal);
    shouldNavigate = await modalRef.result;
  }
  return shouldNavigate;
});

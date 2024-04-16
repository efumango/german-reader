import { Routes } from '@angular/router';
import { VocabComponent } from './vocab/vocab.component';
import { hasUnsavedChangesGuard } from './has-unsaved-changes.guard';

export const routes: Routes = [
    {
        path: 'vocab', 
        component: VocabComponent,
        canDeactivate: [hasUnsavedChangesGuard]
    }
];

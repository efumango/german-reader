import { Component } from '@angular/core';
import { VocabService } from '../vocab.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface VocabItem {
  id: number;
  word: string;
  definition: string;
  sentence: string;
  selected?: boolean; 
  modified?: boolean;
  isEditingWord?: boolean;
  isEditingDefinition?: boolean;
  isEditingSentence?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-vocab',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './vocab.component.html',
  styleUrl: './vocab.component.scss'
})
export class VocabComponent {
  vocabList: VocabItem[] = [];
  currentVocabPage: VocabItem[] = [];
  editingState: { id: string | null, field: string | null } = { id: null, field: null };
  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 0;
  allSelected = false;

  constructor(private vocabService: VocabService){ 
  }


  ngOnInit() {
    this.fetchVocabList();
  }

  fetchVocabList() {
    this.vocabService.getVocabList().subscribe({
      next: (data) => {
        this.vocabList = data.map(item => ({ ...item, selected: false }));
      },
      error: (err) => console.error('Failed to fetch vocab list', err)
    });
  }

  deleteSelected() {
    // Collect the IDs of selected vocab words
    const selectedWordIds = this.vocabList.filter(vocab => vocab.selected).map(vocab => vocab.id);
 
    // Check if there's anything to delete
    if (selectedWordIds.length > 0) {
      // Call the service method to delete selected words
      this.vocabService.deleteSelectedWords(selectedWordIds).subscribe({
        next: (response) => {
          console.log('Delete successful', response);
          this.vocabList = this.vocabList.filter(vocab => !vocab.selected);
        },
        error: (error) => console.error('Error deleting words', error)
      });
    } else {
      console.log('No words selected for deletion');
    }
  }
  
  deduplicate() {
    const unique = new Map();
    this.vocabList.forEach(vocab => {
      const key = `${vocab.word}:${vocab.definition}`;
      if (!unique.has(key)) {
        unique.set(key, vocab);
      }
    });
    this.vocabList = Array.from(unique.values());
    this.vocabService.deduplicateWords().subscribe({
      next: (response) => {
        console.log('Deduplicates removed', response);
      },
      error: (error) => console.error('Error deleting words', error)
    });
  }

  exportToCSV() {
    // Filter for selected items only
    const selectedItems = this.vocabList.filter(vocab => vocab.selected);

    // Proceed only if there are selected items
    if (selectedItems.length > 0) {
        const data = selectedItems.map(({ word, definition, sentence }) => {
            const csvWord = `"${word.replace(/"/g, '""')}"`;
            const csvDefinition = `"${definition.replace(/"/g, '""')}"`;
            const csvSentence = `"${sentence.replace(/"/g, '""')}"`;
            return [csvWord, csvDefinition, csvSentence].join(',');
        }).join('\n');
        const utf8BOM = "\uFEFF"; // UTF-8 Byte Order Mark
        const blob = new Blob([utf8BOM + data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected-vocab-list.csv';  
        a.click();
    } else {
        alert('No items selected for export.');
    }
}

  
  selectAllToggle: boolean = false;

  toggleAllSelections() {
    // Ensure only current page items are toggled
    this.currentVocabPage.forEach(vocab => vocab.selected = this.selectAllToggle);
  }

  enableEdit(vocab: any, field: string) {
    // Check if we are already editing another field
    if (this.editingState.id !== null && (this.editingState.id !== vocab.id || this.editingState.field !== field)) {
        console.log("Finish editing the current field before moving to another.");
        return;
    }

    this.editingState = { id: vocab.id, field }; 

    // Reset editing state for all items and fields
    this.vocabList.forEach(v => {
        ['Word', 'Definition', 'Inflection', 'Sentence'].forEach(f => {
            v[`isEditing${f}`] = false; 
        });
    });

    // Enable editing for the selected item and field
    vocab[`isEditing${field.charAt(0).toUpperCase() + field.slice(1)}`] = true;
}

  saveVocab(vocab: any, field: string) {
    vocab.modified = true;
    vocab[`isEditing${field.charAt(0).toUpperCase() + field.slice(1)}`] = false;
    this.editingState = { id: null, field: null }; 
  }

  saveAllChanges(): void {
    const modifiedVocabs = this.vocabList.filter(vocab => vocab.modified);
    if (modifiedVocabs.length > 0) {
      this.vocabService.saveModifiedVocabs(modifiedVocabs).subscribe({
        next: (response) => {
          // Clear the modified flag for all processed items
          modifiedVocabs.forEach(vocab => vocab.modified = false);
          alert('Changes saved successfully');
        },
        error: (error) => {
          // Handle save error
          console.error('Error saving changes:', error);
          alert('Failed to save changes');
        }
      });
    } else {
      alert('No changes to save');
    }
  }
  

}

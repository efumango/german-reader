import { Component } from '@angular/core';
import { VocabService } from '../vocab.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vocab',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './vocab.component.html',
  styleUrl: './vocab.component.css'
})
export class VocabComponent {
  vocabList: any[] = [];

  constructor(private vocabService: VocabService){ }
  
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
      const data = selectedItems.map(({ word, definition }) => `"${word}","${definition}"`).join('\n');
      const blob = new Blob([data], { type: 'text/csv' });
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

  selectAll() {
  this.selectAllToggle = !this.selectAllToggle;
  this.vocabList.forEach(vocab => vocab.selected = this.selectAllToggle);
}


}

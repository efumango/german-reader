import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabService } from '../vocab.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-definition-pop-up',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './definition-pop-up.component.html',
  styleUrl: './definition-pop-up.component.css'
})
export class DefinitionPopUpComponent {
  @Input() data: any[] = [];
  preparedItems: any[] = [];
  customItems: any[] = [];
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };
  @Input() loading: boolean = true;
  @Input() visible: boolean = false;

  @Input() searchQuery: string = '';
  @Output() searchAllClicked: EventEmitter<string> = new EventEmitter<string>();
  
  constructor(private vocabService: VocabService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.filterData();
    }
  }

  private filterData(): void {
    this.preparedItems = this.data.filter(item => item.source === 'prepared');
    this.customItems = this.data.filter(item => item.source !== 'prepared');
  }
  
  addWordToVocabList(item: any): void {
    this.vocabService.addWord(item.word, item.definition, item.inflection).subscribe({
      next: response => {
        console.log('Word added', response);
        item.isAdded = true;
      },
      error: err => console.error('Error adding word', err)
    });
  }
  

  searchAll(): void{
    this.searchAllClicked.emit(this.searchQuery);
  }
  
  formatInflection(inflection: string): string {
    if (!inflection) {
      return '';
    }
    // Replace '##' with line breaks
    return inflection.replace(/##/g, '<br>##');
  }
  
}

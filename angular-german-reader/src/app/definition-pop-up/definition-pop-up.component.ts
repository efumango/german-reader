import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabService } from '../services/vocab.service';
import { FormsModule } from '@angular/forms';
import { TextSelectionDirective } from '../directives/text-selection.directive';
import { LoggingService } from '../services/logging.service';
import { ShareFilename } from '../services/share-filename.service';

@Component({
  selector: 'app-definition-pop-up',
  standalone: true,
  imports: [CommonModule, FormsModule, TextSelectionDirective],
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
  @Output() decompoundClicked: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild(TextSelectionDirective) textSelectionDirective!: TextSelectionDirective;

  context: string = '';

  constructor(private vocabService: VocabService, 
              private shareFilenameService: ShareFilename,
              private loggingService: LoggingService
  ) {
  }

  ngOnInit() {
    document.addEventListener('pointerdown', this.stopPropagating, true);
  }

  ngOnDestroy() {
    document.removeEventListener('pointerdown', this.stopPropagating, true);
  }

  private stopPropagating(event: Event) {
    event.stopPropagation();
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
    this.loggingService.log('click add word button');
    
    let selectedText = this.textSelectionDirective.getSelectedText();

    let sentence = this.textSelectionDirective.getSentenceContainingWord();
    // If sentence is empty, use the sentence that contains last selected text 
    if (sentence === null) {
      sentence = this.textSelectionDirective.getSentenceContainingLastSelectedWord();
    }
  
    if (sentence !== null) {
      this.context = this.textSelectionDirective.trimSentenceWithEllipsis(sentence, selectedText, 5, 5);
    } else {
      this.context = '';
    }

    // Get filename 
    const filename = this.shareFilenameService.getFilename();

    this.vocabService.addWord(item.word, item.definition, item.inflection, this.context, filename!).subscribe({
      next: response => {
        console.log('Word added', response);
        item.isAdded = true;

        // Log word adding activity
        if (filename !== null) {
          this.loggingService.log('add to vocab', filename, item.word);
        }

      },
      error: err => console.error('Error adding word', err)
    });
  }


  searchAll(): void {
    this.searchAllClicked.emit(this.searchQuery);    // Get filename 
    const filename = this.shareFilenameService.getFilename();
    // Log 'show all' activity
    if (filename !== null) {
      this.loggingService.log('search all results', filename, this.searchQuery);
    }
  }

  decompound(): void {
    this.decompoundClicked.emit(this.searchQuery);
    // Get filename 
    const filename = this.shareFilenameService.getFilename();
    // Log 'show all' activity
    if (filename !== null) {
      this.loggingService.log('decompound', filename, this.searchQuery);
    }
  }
  formatInflection(inflection: string): string {
    if (!inflection) {
      return '';
    }
    // Replace '##' with line breaks
    return inflection.replace(/##/g, '<br>##');
  }

}

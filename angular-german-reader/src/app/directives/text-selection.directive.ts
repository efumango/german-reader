import { Directive, ElementRef, Renderer2, HostListener, Output, EventEmitter } from '@angular/core';
import nlp from 'de-compromise';
import { ShareFilename } from '../services/share-filename.service';
import { LoggingService } from '../services/logging.service';

@Directive({
  selector: '[appTextSelection]',
  standalone: true
})
export class TextSelectionDirective {
  private selectedText: string = '';
  private button: HTMLElement | null = null;
  private removeClickListener: Function | null = null;
  private isSelecting: boolean = false;
  private lastSelectedText: string = '';
  private lastSelectedSentence: string | null = null;

  @Output() textSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() textContext: EventEmitter<{ text: string, context: string }> = new EventEmitter<{ text: string, context: string }>();
  @Output() popUpPosition: EventEmitter<{ x: number, y: number}> = new EventEmitter<{ x: number, y: number }>();
  @Output() clickOutsidePopUp: EventEmitter<void> = new EventEmitter<void>();

  constructor(private el: ElementRef, 
              private renderer: Renderer2, 
              private shareFilenameService: ShareFilename,
              private loggingService: LoggingService) {}
  
    
  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    this.isSelecting = true; // Start the selection tracking
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (!this.isSelecting) return; // Only process moves if a selection started
  }
            
  @HostListener('pointerup') onPointerUp() {
  
    if (!this.isSelecting) return;
    this.isSelecting = false; // End the selection tracking
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      return;
    }

    // Get selected text
    const currentSelectedText = selection.toString().trim();

    // Only proceed if the selected text is different from the already selected text
    if (this.selectedText === currentSelectedText && this.button) {
      return; // If the selected text hasn't changed and button exists, do nothing
    }

    this.selectedText = currentSelectedText;

    // Clear previous highlights
    this.clearHighlights();

    // Highlight selection
    this.highlightSelection(selection);

    // Check if the selected text contains more than 5 words
    const wordCount = currentSelectedText.split(/\s+/).length;

    if (wordCount < 5) {
      // Get filename 
      const filename = this.shareFilenameService.getFilename();

      // Get the word that is being looked up 
      const word = selection.toString().trim();
      
      // Logging look up activity
      if (filename !== null) {
        this.loggingService.log('look up', filename, word);
      }

      this.emitContextAndSelection(selection);
      this.emitPopupPosition(selection);
    }

    // Update last selected text and sentence
    this.lastSelectedText = currentSelectedText;
    this.lastSelectedSentence = this.getSentenceContainingWord();
  }
  
  
  @HostListener('document:click', ['$event']) onDocumentClick(event: PointerEvent) {
    const popUpElement = document.querySelector('.popup'); // Query for pop-up element 
    // Check if the click is outside the pop-up element 
    if (popUpElement && !popUpElement.contains(event.target as Node)) {
      this.clickOutsidePopUp.emit(); // Emit event to signal that click happened outside the pop-up
    }

    if (!this.el.nativeElement.contains(event.target)) {
      this.clearHighlights();
    }
  }

  private highlightSelection(selection: Selection) {
    const range = selection.getRangeAt(0);
    const span = this.renderer.createElement('span');
    this.renderer.addClass(span, 'highlight');
    range.surroundContents(span);
  }

  private clearHighlights() {
    const highlightedElements = this.el.nativeElement.querySelectorAll('.highlight');
    highlightedElements.forEach((element: HTMLElement) => {
      const parent = this.renderer.parentNode(element);
      while (element.firstChild) {
        // moves the first child of the element (the highlighted <span>) to be a direct child of the parent (<p>)
        this.renderer.insertBefore(parent, element.firstChild, element);
      }
      // removes the now-empty <span> element
      this.renderer.removeChild(parent, element);
    });
  }


private emitContextAndSelection(selection: Selection) {
  const sentence = this.getSentenceContainingWord();
  if (sentence) {
    this.textContext.emit({ text: this.selectedText, context: sentence });
  }
}

  getSentenceContainingWord(): string | null {
    this.clearHighlights();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
  
    // Get the range and the paragraph that contains the selection.
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    if (container.nodeType !== Node.ELEMENT_NODE) {
      container = container.parentNode!;
    }
    if (container instanceof Element && container.nodeName !== 'P') {
      container = container.closest('p')!;
    }
    if (!(container instanceof HTMLParagraphElement)) return null;
  
    const paragraphText = container.textContent || '';
    const sentences = paragraphText.split(/(?<=[.!?;.])\s+/);
    const rangeStartOffset = this.getRangeStartOffsetWithinParagraph(range, container);
  
    let cumulativeLength = 0;
    for (const sentence of sentences) {
      cumulativeLength += sentence.length + 1; // +1 for the space after the sentence
      if (cumulativeLength > rangeStartOffset) {
        // Replace » and « with '
        const cleanedSentence = sentence.replace(/[»«]/g, "'");
        // Found the sentence containing the selection
        return cleanedSentence.trim();
      }
    }
  
    return null; // Return null if no sentence is found
  }

  public getSelectedText(): string {
    return window.getSelection()?.toString().trim() || '';
  }
  
  public getLastSelectedText(): string {
    return this.lastSelectedText;
  }
  
  public getSentenceContainingLastSelectedWord(): string | null {
    return this.lastSelectedSentence;
  }

  // Helper method to calculate the selection's start offset relative to the paragraph
  private getRangeStartOffsetWithinParagraph(range: Range, paragraph: Element): number {
    const preRange = document.createRange();
    preRange.selectNodeContents(paragraph);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  }

  // Get context for vocabulary list 
  public trimSentenceWithEllipsis(sentence: string, selectedPhrase: string, beforeWords: number, afterWords: number): string {
    const words = sentence.split(/\s+/);
    // Find the starting index of the selectedPhrase in the sentence
    const phraseStartIndex = sentence.toLowerCase().indexOf(selectedPhrase.toLowerCase());
    if (phraseStartIndex === -1) return sentence; // If phrase not found, return original sentence

    // Convert the start index of the phrase to a word index
    const wordsBeforePhrase = sentence.substring(0, phraseStartIndex).split(/\s+/).length - 1;

    // Calculate the start and end indexes for slicing the words array
    const start = Math.max(0, wordsBeforePhrase - beforeWords);
    const phraseWordCount = selectedPhrase.split(/\s+/).length;
    const end = Math.min(words.length, wordsBeforePhrase + phraseWordCount + afterWords);

    // Building the resulting sentence with ellipses if necessary
    let result = '';
    if (start > 0) {
        result += '... ';
    }
    result += words.slice(start, end).join(' ');
    if (end < words.length) {
        result += ' ...';
    }
    
    return result;
  }

  private emitPopupPosition(selection: Selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const estimatedPopupHeight = 100; // An estimate of expected height

    // Determine initial Y position (above or below the selection)
    let popupPositionY = rect.top + window.scrollY; // Default to below
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow < estimatedPopupHeight && spaceAbove > estimatedPopupHeight) {
        // Not enough space below and more space above, position above
        popupPositionY -= estimatedPopupHeight;
    } else {
        // Default or enough space below, position below
        popupPositionY += rect.height;
    }
    
    let popupPositionX = rect.left + window.scrollX + (rect.width / 2);

    // Emit the initial position
    this.popUpPosition.emit({
        x: popupPositionX,
        y: popupPositionY
    });
  }
  
}


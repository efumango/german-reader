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
  @Output() textContext: EventEmitter<{ text: string, context: string, wordType: string }> = new EventEmitter<{ text: string, context: string, wordType: string }>();
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
      this.removeButton();
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

    // Create button if it doesn't already exist
    if (!this.button) {
      this.createButton(selection);
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
      this.removeButton();
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

  private createButton(selection: Selection) {
    // Remove button if already exists
    if (this.button) {
      this.removeButton();
    }
  
    // Create a button element
    this.button = this.renderer.createElement('button');
    this.renderer.addClass(this.button, 'text-selection-button');
    if (this.button){
    this.button.textContent = 'Look Up';
  
    // Get the bounding rectangle of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
  
    // Calculate the top and left positions
    const topPosition = rect.top + window.scrollY - 30; 
    // Center the button over the selection
    const leftPosition = rect.left + window.scrollX + (rect.width / 2);
  
    // Set position for the button
    this.renderer.setStyle(this.button, 'top', `${topPosition}px`);
    this.renderer.setStyle(this.button, 'left', `${leftPosition}px`);
  
    // Append the button to the body of the document
    this.renderer.appendChild(document.body, this.button);
  
    // Listen for the click event on the button
    this.removeClickListener = this.renderer.listen(this.button, 'click', (event) => {
      event.stopPropagation(); // Prevent the document:click event

      // Get filename 
      const filename = this.shareFilenameService.getFilename();

      // Get word that is being looked up 
      const word = selection.toString().trim();
      
      // Logging look up activity
      if (filename !== null) {
        this.loggingService.log('look up', filename, word);
      }

      this.determineContextAndEmit(selection);
      this.emitPopupPosition(selection);
      this.removeButton();
    });
  }
}

  private determineContextAndEmit(selection: Selection) {
    const numWords = this.selectedText.split(/\s+/).length;
    const containsVerb = this.containsVerb(this.selectedText);
    const isLikelyPrefix = this.isLikelyPrefix(this.selectedText);
    const beginsWithInseparablePrefix = this.beginsWithInseparablePrefix(this.selectedText);
    var wordType = ''

    // For more than two words, emit only the selected text without context.
    if (numWords >= 2) {
      this.textSelected.emit(this.selectedText);
      return; // Exit the method early
    }

    // Proceed with context determination for other cases
    let beforeWords = 0, afterWords = 0;

    if (containsVerb && !beginsWithInseparablePrefix) {
      // For single verbs that are likely to be separable: find prefix
      // emit selected text with extended context after the verb: 2 words before, 10 words after
      beforeWords = 2;
      afterWords = 10;
      wordType = 'canBeSepVerb'
    } else if (numWords === 1 && isLikelyPrefix) {
      // For single words that are likely prefixes: find verb
      // emit selected text with extended context before the prefix: 10 words before, 2 words after
      beforeWords = 10;
      afterWords = 2;
      wordType = 'canBePrefix'
    } else {
      beforeWords = 10;
      afterWords = 10;
      wordType = 'default'
    }

    // Retrieve and trim the sentence based on calculated beforeWords and afterWords
    const sentence = this.getSentenceContainingWord();
    if (sentence) {
      const context = (beforeWords === 0 && afterWords === 0) ? "" : this.trimSentenceAroundSelectedWord(sentence, this.selectedText, beforeWords, afterWords);
      this.textContext.emit({ text: this.selectedText, context, wordType });
    }
  }

  private removeButton() {
    if (this.button) {

      if (this.removeClickListener) {
        this.removeClickListener();
        this.removeClickListener = null;
      }

      // Remove the button from the DOM
      this.button.remove();

      // Nullify the button reference to prevent accidental re-use
      this.button = null;
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
  
  public trimSentenceAroundSelectedWord(sentence: string, selectedWord: string, beforeWords: number, afterWords: number): string {
    const words = sentence.split(/\s+/);
    let selectedIndex = words.findIndex(word => new RegExp(`\\b${selectedWord}\\b`, 'i').test(word));

    if (selectedIndex === -1) return sentence;
    
    const start = Math.max(0, selectedIndex - beforeWords);
    const end = Math.min(words.length, selectedIndex + afterWords + 1);
    console.log('context: ' + words.slice(start, end).join(' '));
    return words.slice(start, end).join(' ');
    
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

  // List of separable verb prefixes
  private separableVerbPrefixes: string[] = [
    'ab', 'an', 'auf', 'aus', 'auseinander', 'bei', 'da', 'dabei', 'dar', 'daran',
    'dazwischen', 'durch', 'ein', 'empor', 'entgegen', 'entlang', 'entzwei', 'fehl',
    'fern', 'fest', 'fort', 'frei', 'gegenüber', 'gleich', 'heim', 'her', 'herab',
    'heran', 'herauf', 'heraus', 'herbei', 'herein', 'herüber', 'herum', 'herunter',
    'hervor', 'hin', 'hinab', 'hinauf', 'hinaus', 'hinein', 'hinterher', 'hinunter',
    'hinweg', 'hinzu', 'hoch', 'los', 'mit', 'nach', 'nebenher', 'nieder', 'statt',
    'um', 'vor', 'voran', 'voraus', 'vorbei', 'vorüber', 'vorweg', 'weg', 'weiter',
    'wieder', 'zu', 'zurecht', 'zurück', 'zusammen', 'durch', 'über', 'um', 'unter',
    'voll', 'wieder'
  ];

  private inseparableVerbPrefixes: string[] = [
    'be', 'emp', 'ent', 'er', 'ge', 'hinter', 'miss', 'wider', 'ver', 'zer'
  ];

  private isLikelyPrefix(word: string): boolean {
    // Normalize the word by removing trailing punctuation and converting to lowercase
    const normalizedWord = word.replace(/[^\w\s]|_$/, '').toLowerCase();
    return this.separableVerbPrefixes.includes(normalizedWord);
  }

  private beginsWithInseparablePrefix(word: string): boolean {
    // Normalize the word by converting to lowercase for comparison
    const normalizedWord = word.toLowerCase();

    // Check if the word begins with any of the inseparable prefixes
    return this.inseparableVerbPrefixes.some(prefix => normalizedWord.startsWith(prefix));
  }

  private containsVerb(word: string): boolean{
    let doc = nlp(word);
    return doc.has('#Verb')
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


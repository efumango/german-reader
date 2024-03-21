import { Directive, ElementRef, Renderer2, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appTextSelection]',
  standalone: true
})
export class TextSelectionDirective {
  private selectedText: string = '';
  private button: HTMLElement | null = null;
  private removeClickListener: Function | null = null;
  @Output() textSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() textContext: EventEmitter<{ text: string, context: string }> = new EventEmitter<{ text: string, context: string }>();

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseup') onMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      this.removeButton();
      return;
    }

    this.selectedText = selection.toString().trim();
    
    // Clear previous highlights
    this.clearHighlights();

    // Highlight selection & create lookup button 
    this.highlightSelection(selection);
    this.createButton(selection);

  }

  @HostListener('document:click', ['$event']) onDocumentClick(event: MouseEvent) {
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
        this.renderer.insertBefore(parent, element.firstChild, element);
      }
      this.renderer.removeChild(parent, element);
    });
  }

  private createButton(selection: Selection) {
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
    this.textSelected.emit(this.selectedText);
    // Emit selected text and its context
    const sentence = this.getSentenceContainingWord(this.selectedText);
    if (sentence) {
    const trimmedSentence = this.trimSentenceAroundSelectedWord(sentence, this.selectedText, 10, 10);
    this.textContext.emit({text: this.selectedText, context: trimmedSentence});
    }
    this.removeButton();
    event.stopPropagation(); // Prevent the document:click event
    });
  }}

  private removeButton() {
    if (this.button) {
      if (this.removeClickListener) {
        this.removeClickListener();
        this.removeClickListener = null;
      }
      this.renderer.removeChild(document.body, this.button);
      this.button = null;
    }
  }

  private getSentenceContainingWord(selectedText: string): string | null {
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
    const sentences = paragraphText.split(/(?<=[.!?])\s+/);
    const rangeStartOffset = this.getRangeStartOffsetWithinParagraph(range, container);
  
    let cumulativeLength = 0;
    for (const sentence of sentences) {
      cumulativeLength += sentence.length + 1; // +1 for the space after the sentence
      if (cumulativeLength > rangeStartOffset) {
        // Found the sentence containing the selection
        return sentence.trim();
      }
    }
  
    return null; // Return null if no sentence is found
  }
  
  // Helper method to calculate the selection's start offset relative to the paragraph
  private getRangeStartOffsetWithinParagraph(range: Range, paragraph: Element): number {
    const preRange = document.createRange();
    preRange.selectNodeContents(paragraph);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  }
  
  private trimSentenceAroundSelectedWord(sentence: string, selectedWord: string, beforeWords: number, afterWords: number): string {
    const selectedWordRegex = new RegExp(`\\b${selectedWord}\\b`, 'i'); // Use regex for word boundary detection
    const words = sentence.split(/\s+/);
    let selectedIndex = -1;

    // Find the index of the word that matches the selected word, accounting for punctuation.
    for (let i = 0; i < words.length; i++) {
        if (selectedWordRegex.test(words[i])) {
            selectedIndex = i;
            break; // Stop at the first occurrence
        }
    }

    if (selectedIndex === -1) return sentence;

    const start = Math.max(0, selectedIndex - beforeWords);
    const end = Math.min(words.length, selectedIndex + afterWords + 1);

    return words.slice(start, end).join(' ');
  }
}

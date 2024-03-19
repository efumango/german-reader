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
  
    // Set styles for the button
    this.renderer.setStyle(this.button, 'position', 'absolute');
    this.renderer.setStyle(this.button, 'top', `${topPosition}px`);
    // Adjust the button's left position to account for its own width
    this.renderer.setStyle(this.button, 'transform', `translateX(-50%)`);
    this.renderer.setStyle(this.button, 'left', `${leftPosition}px`);
    this.renderer.setStyle(this.button, 'z-index', '1000');
  
    // Append the button to the body of the document
    this.renderer.appendChild(document.body, this.button);
  
    // Listen for the click event on the button
    this.removeClickListener = this.renderer.listen(this.button, 'click', (event) => {
      this.textSelected.emit(this.selectedText);
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
}

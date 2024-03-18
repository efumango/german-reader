import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appTextSelection]',
  standalone: true
})
export class TextSelectionDirective {
  private actionBox: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseup') onMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      this.removeActionBox();
      return;
    }
    
    // Clear previous highlights
    this.clearHighlights();

    const range = selection.getRangeAt(0);
    if (!range) return;
    
    // Highlight selection
    const span = this.renderer.createElement('span');
    this.renderer.addClass(span, 'highlight');
    range.surroundContents(span);
    
    // Position the action box
    this.positionActionBox(span);

    // Clear selection
    window.getSelection()?.removeAllRanges();
  }

  @HostListener('document:click', ['$event']) onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.clearHighlights();
      this.removeActionBox(); 
    }
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

  private positionActionBox(span: HTMLElement) {
    if (this.actionBox) {
      this.renderer.removeChild(this.el.nativeElement, this.actionBox);
    }

    // Create the action box element
    this.actionBox = this.renderer.createElement('div');
    this.renderer.addClass(this.actionBox, 'action-box');
    if (this.actionBox){
      this.actionBox.textContent = 'Lookup'; // Set the call to action text

      // Initially set the box to be invisible to measure its dimensions
      this.renderer.setStyle(this.actionBox, 'visibility', 'hidden');

      // Append the action box to the container to measure its dimensions
      this.renderer.appendChild(this.el.nativeElement, this.actionBox);

      // Measure dimensions
      const actionBoxHeight = this.actionBox.offsetHeight;
      const actionBoxWidth = this.actionBox.offsetWidth;
      const spanWidth = span.offsetWidth;

      // Calculate the center position
      const centerLeft = span.offsetLeft + (spanWidth / 2) - (actionBoxWidth / 2);
      
      // Set position of action box 
      this.renderer.setStyle(this.actionBox, 'top', `${span.offsetTop - actionBoxHeight - 5}px`); // Above the selected text
      this.renderer.setStyle(this.actionBox, 'left', `${centerLeft}px`); // In the middle of the selected text 
      this.renderer.setStyle(this.actionBox, 'visibility', 'visible'); // Make the box visible

      // Listen for clicks on the action box
      this.actionBox.addEventListener('click', this.onActionBoxClick.bind(this));
    }
  }

  private onActionBoxClick() {
    console.log('Action box clicked');
    // Define what should happen when the action box is clicked
  }

  private removeActionBox() {
    if (this.actionBox) {
      this.actionBox.removeEventListener('click', this.onActionBoxClick.bind(this));
      this.renderer.removeChild(this.el.nativeElement, this.actionBox);
      this.actionBox = null;
    }
  }
}

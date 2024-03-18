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
      this.removeActionBox(); // Remove the action box when clicking outside the text
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
      
      // Style the action box
      this.renderer.setStyle(this.actionBox, 'position', 'absolute');
      this.renderer.setStyle(this.actionBox, 'top', `${span.offsetTop - this.actionBox.offsetHeight}px`);
      this.renderer.setStyle(this.actionBox, 'left', `${span.offsetLeft}px`);
      this.renderer.setStyle(this.actionBox, 'background', 'black');
      this.renderer.setStyle(this.actionBox, 'color', 'white');
      this.renderer.setStyle(this.actionBox, 'padding', '4px 8px');
      this.renderer.setStyle(this.actionBox, 'cursor', 'pointer');
      this.renderer.setStyle(this.actionBox, 'border-radius', '4px');

      // Append the action box to the container
      this.renderer.appendChild(this.el.nativeElement, this.actionBox);

      // Listen for clicks on the action box
      this.actionBox.addEventListener('click', this.onActionBoxClick.bind(this));
    }
  }

  private onActionBoxClick() {
    console.log('Action box clicked');
    // Here you can define what should happen when the action box is clicked
  }

  private removeActionBox() {
    if (this.actionBox) {
      this.actionBox.removeEventListener('click', this.onActionBoxClick.bind(this));
      this.renderer.removeChild(this.el.nativeElement, this.actionBox);
      this.actionBox = null;
    }
  }
}

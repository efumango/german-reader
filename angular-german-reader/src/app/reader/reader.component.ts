import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextSelectionDirective } from '../text-selection.directive';
import nlp from 'de-compromise';
import { DefinitionPopUpComponent } from '../definition-pop-up/definition-pop-up.component';
 
  @Component({
    selector: 'app-reader',
    standalone: true,
    imports: [CommonModule, TextSelectionDirective, DefinitionPopUpComponent],
    templateUrl: './reader.component.html',
    styleUrl: './reader.component.css'
  })
  export class ReaderComponent {
    textContent: string = '';
    token = this.authService.getCurrentUserToken();

    popupData: any[] = [];
    popupPosition: { x: number, y: number } = { x: 0, y: 0 };
    showPopup: boolean = false;
    loadingPopUp: boolean = false;

    constructor(
      private http: HttpClient, 
      private authService: AuthService,
      private route: ActivatedRoute,
    ) { }

    ngOnInit(): void {
      this.route.params.subscribe(params => {
        const filename = params['filename'];
        if (filename) {
          this.onView(filename);
        }
      });
    }

    onView(filename: string): void {
      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }
    
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });
    
      this.http.get(`http://127.0.0.1:5000/api/files/${filename}`, { headers, responseType: 'text' })
        .subscribe({
          next: (content) => {
            // Format the content for display
            this.textContent = this.formatContentForDisplay(content);
          },
          error: (error) => {
            console.error('Failed to fetch file', error);
          }
        });
    }
    
    formatContentForDisplay(text: string): string {
      // Split the text into paragraphs at one or more newline characters
      const paragraphs = text.split(/\n\s*\n/);
      // Wrap each paragraph in <p> tags and join them into a single string
      return paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('');
    }    
    
    onTextSelected(text: string){
      this.loadingPopUp = true;
      this.showPopup = true;

      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });

      this.loadingPopUp = true;
      this.http.post(`http://127.0.0.1:5000/api/query-db`, {text}, {headers}).
      subscribe({
        next: (response: any) => {
          console.log('Response from backend:', response);
          this.processResponse(response);
        },
          error: (error) => {
            console.error('Error:', error);
            this.loadingPopUp = false;
          }
        }
      );
    }

    onTextContext(textContext: { text: string, context: string }) {
      if (!this.token) {
        console.error('No token available for authentication.');
        return;
      }
    
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });
      
      this.loadingPopUp = true;
      // Call the endpoint that handles the selected text with context
      this.http.post('http://127.0.0.1:5000/api/process-and-query-db', textContext, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Response from backend:', response);
            this.processResponse(response);  
          },
          error: (error) => {
            console.error('Error:', error);
            this.loadingPopUp = false;
          }
        });
      }

    private processResponse(response: any): void {
      if (Array.isArray(response)) {
        // Process the array of results
        this.popupData = response.map(item => ({
          word: item.word,
          definition: item.definition
        }));
      } else if (response && typeof response.error === 'string') {
        // Handle case where response is an error object with a string message
        this.popupData = [{ word: 'Info', definition: response.error }];
      }
      this.loadingPopUp = false;
      this.showPopup = true;
    }
    
    handlePopUp(position: { x: number, y: number }){
      this.popupPosition = position;
    }

    handleClickOutsidePopUp(): void {
      this.showPopup = false;
    }  

    ngAfterViewChecked() {
      if (this.showPopup) {
        this.adjustPopUpPositionIfNeeded();
      }
    }
    
    adjustPopUpPositionIfNeeded() {
      requestAnimationFrame(() => { 
          const popUpElement = document.querySelector('.popup') as HTMLElement; 
          if (!popUpElement) return;
  
          const popUpRect = popUpElement.getBoundingClientRect();
          let { y } = this.popupPosition; 
  
          if (y + popUpRect.height > window.innerHeight) {
              // The pop-up overflows the viewport, adjust it upwards
              y -= (y + popUpRect.height - window.innerHeight + 10); // 10px for a small buffer
          }
  
          popUpElement.style.top = `${y}px`;
      });
    }
  }

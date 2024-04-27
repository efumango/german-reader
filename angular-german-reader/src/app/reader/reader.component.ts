import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextSelectionDirective } from '../directives/text-selection.directive';
import { DefinitionPopUpComponent } from '../definition-pop-up/definition-pop-up.component';
import { environment } from '../../environments/environment';
import { LoggingService } from '../services/logging.service';
import { ShareFilename } from '../services/share-filename.service';

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
  loadingPopUp: boolean = true;

  searchQuery: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private loggingService: LoggingService,
    private shareFilenameService: ShareFilename
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

    // Log the filename when the user opens the file
    this.loggingService.log('open file',  `${filename}`);

    // Set filename to share it to other components that need it 
    this.shareFilenameService.setFilename(`${filename}`);

    this.http.get(`${environment.apiUrl}/files/${filename}`, { headers, responseType: 'text' })
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

  private makeHttpPostRequest(endpoint: string, payload: any, queryParams: any = {}): void {
    if (!this.token) {
      console.error('No token available for authentication.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
    });

    let queryString = Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).join('&');
    if (queryString) queryString = `?${queryString}`;

    this.loadingPopUp = true;
    this.http.post(`${environment.apiUrl}/${endpoint}${queryString}`, payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Response from backend:', response);
          this.processResponse(response);
        },
        error: (error) => {
          console.error('Error:', error);
          this.loadingPopUp = false;
        },
      });
  }

  limitedQueryWithoutContext(text: string) {
    this.makeHttpPostRequest('query', { text });
  }

  limitedQueryWithContext(textContext: { text: string; context: string }) {
    this.makeHttpPostRequest('process-and-query-db', textContext);
    console.log(textContext);
  }

  queryAllWithoutContext(searchQuery: string) {
    if (!searchQuery) return;
    this.makeHttpPostRequest('query', { searchQuery }, { all: 'true' });
  }

  private processResponse(response: any): void {
    if (Array.isArray(response)) {
      // Process the array of results
      this.popupData = response.map(item => ({
        word: item.word,
        definition: item.definition,
        queried_word: item.queried_word,
        inflection: item.inflection,
        source: item.source,
        isWord: true,
        isAdded: false
      }));

    } else if (response && typeof response.error === 'string') {
      // Handle case where response is an error object with a string message
      this.popupData = [{ word: 'Info', definition: response.error, isWord: false, queried_word: response.queried_word }];
    }
    this.loadingPopUp = false;
    this.showPopup = true;
    this.searchQuery = this.popupData[0].queried_word;
  }

  handlePopUp(position: { x: number, y: number }) {
    this.popupPosition = position;
  }

  handleClickOutsidePopUp(): void {
    this.showPopup = false;
  }

  ngAfterViewChecked() {
    if (this.showPopup) {
      this.adjustPopUpPosition();
    }
  }

  adjustPopUpPosition() {
    requestAnimationFrame(() => {
      const popUpElement = document.querySelector('.popup') as HTMLElement;
      if (!popUpElement) return;

      const popUpRect = popUpElement.getBoundingClientRect();
      let { x, y } = this.popupPosition;

      if (y + popUpRect.height > window.innerHeight) {
        // The pop-up overflows the viewport, adjust it upwards
        y -= (y + popUpRect.height - window.innerHeight + 10); // 10px for a small buffer
      }

      // Adjust X if the popup overflows the viewport horizontally
      if (x + popUpRect.width / 2 > window.innerWidth) {
        x -= (x + popUpRect.width / 2 - window.innerWidth + 10); // Adjust if overflows to the right
      } else if (x - popUpRect.width / 2 < 0) {
        x += Math.abs(x - popUpRect.width / 2) + 10; // Adjust if overflows to the left
      }

      popUpElement.style.left = `${x}px`;
      popUpElement.style.top = `${y}px`;
    });
  }
}

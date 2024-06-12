import { TestBed } from '@angular/core/testing';
import { TextSelectionDirective } from './text-selection.directive';
import { ElementRef, Renderer2 } from '@angular/core';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('TextSelectionDirective', () => {
  let directive: TextSelectionDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            TextSelectionDirective,
            { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } },
            Renderer2,
            HttpClient, HttpHandler ]
        });

    directive = TestBed.inject(TextSelectionDirective);
  });

 
  it('should return the correct start offset of the range within the paragraph', () => {
    // Create a mock paragraph element
    const paragraph = document.createElement('p');
    paragraph.textContent = 'This is a test paragraph. It has multiple sentences.';

    // Create a mock range
    const range = document.createRange();
    const textNode = paragraph.firstChild;
    if (textNode) {
      // Test different positions in the text
      const testCases = [
        { startOffset: 0, expectedOffset: 0 },   // Beginning of the text
        { startOffset: 5, expectedOffset: 5 },   // Middle of a word
        { startOffset: 8, expectedOffset: 8 },   // End of a word
        { startOffset: 15, expectedOffset: 15 }, // Within another sentence
      ];

      testCases.forEach(testCase => {
        range.setStart(textNode, testCase.startOffset);
        range.setEnd(textNode, testCase.startOffset);

        // Call the method
        const offset = directive['getRangeStartOffsetWithinParagraph'](range, paragraph);

        // Verify the output
        expect(offset).toBe(testCase.expectedOffset, `Failed at startOffset: ${testCase.startOffset}`);
      });
    }
  });
  
  it('should return the sentence containing the selected word', () => {
    // Mock container element
    const container = document.createElement('p');
    container.textContent = 'This is a test sentence. This is another sentence.';

    // Mock selection event
    const selection = {
      toString: () => 'test',
      getRangeAt: () => ({
        commonAncestorContainer: container,
        startContainer: container,
        startOffset: 0
      }),
      rangeCount: 1
    } as unknown as Selection;

    // Mock window.getSelection
    spyOn(window, 'getSelection').and.returnValue(selection);

    const result = directive.getSentenceContainingWord();

    expect(result).toEqual('This is a test sentence.');
  });

  it('should return null if no sentence is found', () => {
    // Mock selection event with no range count
    const selection = {
      rangeCount: 0
    } as unknown as Selection;

    // Mock window.getSelection
    spyOn(window, 'getSelection').and.returnValue(selection);

    const result = directive.getSentenceContainingWord();

    expect(result).toBeNull();
  });

  it('should trim sentence around selected word', () => {
    const sentence = 'This is a test sentence for checking the functionality.';
    const selectedWord = 'test';

    const result = directive.trimSentenceAroundSelectedWord(sentence, selectedWord, 2, 2);
    expect(result).toBe('is a test sentence for');

    // Edge cases
    const result2 = directive.trimSentenceAroundSelectedWord(sentence, selectedWord, 10, 10);
    expect(result2).toBe(sentence);

    const result3 = directive.trimSentenceAroundSelectedWord(sentence, 'notInSentence', 2, 2);
    expect(result3).toBe(sentence);

    const result4 = directive.trimSentenceAroundSelectedWord(sentence, 'This', 2, 2);
    expect(result4).toBe('This is a');

    const result5 = directive.trimSentenceAroundSelectedWord(sentence, 'functionality', 2, 2);
    expect(result5).toBe('checking the functionality.');
  });

  it('should trim sentence with ellipsis around selected phrase', () => {
    const sentence = 'This is a test sentence for checking the functionality of the method.';
    const selectedPhrase = 'checking the functionality';

    const result = directive.trimSentenceWithEllipsis(sentence, selectedPhrase, 2, 2);
    expect(result).toBe('... sentence for checking the functionality of the ...');

    // Edge cases
    const result2 = directive.trimSentenceWithEllipsis(sentence, selectedPhrase, 10, 10);
    expect(result2).toBe(sentence);

    const result3 = directive.trimSentenceWithEllipsis(sentence, 'notInSentence', 2, 2);
    expect(result3).toBe(sentence);

    const result4 = directive.trimSentenceWithEllipsis(sentence, 'This is', 2, 2);
    expect(result4).toBe('This is a test ...');

    const result5 = directive.trimSentenceWithEllipsis(sentence, 'the method', 2, 2);
    expect(result5).toBe('... functionality of the method.');

    const result6 = directive.trimSentenceWithEllipsis(sentence, 'is a test', 1, 1);
    expect(result6).toBe('This is a test sentence ...');

    const result7 = directive.trimSentenceWithEllipsis(sentence, 'test sentence', 1, 1);
    expect(result7).toBe('... a test sentence for ...');

    const result8 = directive.trimSentenceWithEllipsis(sentence, 'for checking', 0, 0);
    expect(result8).toBe('... for checking ...');
  });
});


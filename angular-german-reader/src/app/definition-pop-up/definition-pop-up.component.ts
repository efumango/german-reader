import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-definition-pop-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './definition-pop-up.component.html',
  styleUrl: './definition-pop-up.component.css'
})
export class DefinitionPopUpComponent {
  @Input() data: any[] = [];
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };
  @Input() loading: boolean = true;
  @Input() visible: boolean = false;
}

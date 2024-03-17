import { Component } from '@angular/core';
import { UploadDictionariesComponent } from '../upload-dictionaries/upload-dictionaries.component';
import { UploadTextComponent } from '../upload-text/upload-text.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [UploadDictionariesComponent, UploadTextComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}

import { Component } from '@angular/core';
import { UploadDictionariesComponent } from '../upload-dictionaries/upload-dictionaries.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [UploadDictionariesComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}

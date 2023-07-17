import { Component , Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-correction-image',
  templateUrl: './correction-image.component.html',
  styleUrls: ['./correction-image.component.css']
})
export class CorrectionImageComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){
    console.log(data);
    
  }
}

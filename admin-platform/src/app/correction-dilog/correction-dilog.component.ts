import { Component , Inject} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { correctionData } from 'src/app/models/interface';


@Component({
  selector: 'app-correction-dilog',
  templateUrl: './correction-dilog.component.html',
  styleUrls: ['./correction-dilog.component.css']
})
export class CorrectionDilogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: correctionData){

  }
   
}

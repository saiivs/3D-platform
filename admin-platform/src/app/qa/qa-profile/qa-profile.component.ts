import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-qa-profile',
  templateUrl: './qa-profile.component.html',
  styleUrls: ['./qa-profile.component.css']
})
export class QaProfileComponent implements OnInit{

  constructor(private backEndService:BackendService){};

  QAData:any = {}

  ngOnInit(): void {
    this.backEndService.getQAForProfile(localStorage.getItem('userEmail')).subscribe((res)=>{
      this.QAData = res
    });
    
  }
}

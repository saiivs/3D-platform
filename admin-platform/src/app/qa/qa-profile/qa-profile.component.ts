import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-qa-profile',
  templateUrl: './qa-profile.component.html',
  styleUrls: ['./qa-profile.component.css']
})
export class QaProfileComponent implements OnInit,OnDestroy{

  constructor(private backEndService:BackendService,private notficationService:NotificationService){};

  QAData:any = {}
  subscription1!:Subscription;
  subscription2!:Subscription;
  
  ngOnInit(): void {
    this.subscription1 = this.backEndService.getQAForProfile(localStorage.getItem('userEmail')).subscribe((res)=>{
      this.QAData = res
    });
    this.subscription2 = this.notficationService.getNotificationForQA(localStorage.getItem("rollNo")).subscribe((data)=>{ 
      this.notficationService.setNotificationForQA(data);
    }) 
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
  }
}

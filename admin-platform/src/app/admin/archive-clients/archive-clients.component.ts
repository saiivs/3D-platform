import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { client } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-archive-clients',
  templateUrl: './archive-clients.component.html',
  styleUrls: ['./archive-clients.component.css']
})
export class ArchiveClientsComponent implements OnInit{

  constructor(private backEndService: BackendService,private titleService:Title,private notificationService:NotificationService,private router:Router){

  }

  title:string = "Admin-archive";
  clientTableData:Array<any> = [];
  totalRecords:number = 0;
  page:number = 1
  subscription!:Subscription;
  subscription1!:Subscription;

  ngOnInit(){
    this.titleService.setTitle(this.title)
    this.subscription = this.backEndService.getApprovedClients().subscribe((data)=>{
      
        this.clientTableData = data
        this.totalRecords = this.clientTableData.length; 
    })
    this.subscription1 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  viewProList(clientId:any){
    this.router.navigate(['admin/products',clientId]);
  }

  sendClientName(name:string){
    this.backEndService.getClientName(name)
  }

  ngOnDestroy(){
    if(this.subscription)this.subscription.unsubscribe()
    if(this.subscription1)this.subscription1.unsubscribe()
  }
}

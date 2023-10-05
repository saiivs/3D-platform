import { AfterViewInit, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BackendService } from '../services/backend.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'admin-root',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit,OnDestroy{
  

  title = 'Admin';
  notifyData:Array<any> = [];
  notifyDeadLine:Array<any> = [];
  checkUrl:any;
  closeBtn:boolean = false;
  searchBtn!:boolean;
  searchBar:boolean = false;
  searchValue:string = ""
  notificationLen:number = 0;
  seeMoreToggle:boolean = true;
  userName!:string|null;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;
  subscription4!:Subscription;

  
  constructor(private titleService:Title,private route:Router,private backEnd:BackendService,private dialog : MatDialog,private search:NotificationService,private router:ActivatedRoute,private cdr: ChangeDetectorRef,private notificationService:NotificationService){

  }

  ngOnInit() {
    this.titleService.setTitle(this.title);
    this.userName = localStorage.getItem("userName") || null
    this.subscription1 = this.search.enableSearch.subscribe((flag)=>{
      if(flag){
        this.searchBtn = true;
      }else{
        this.searchBtn = false;
      }
      this.cdr.detectChanges();
    })
    this.subscription2 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
      this.subscription3 = this.notificationService.notification_admin.subscribe((data)=>{
      console.log({data});
      this.notifyData = [...data.modelers];
      this.notifyDeadLine = [...data.clients];
      this.notifyDeadLine = this.notifyDeadLine.filter(obj => obj.project_deadline == 'exceeded' || obj.internal_deadline == 'exceeded')
      this.notificationLen = this.notifyData.length + this.notifyDeadLine.length;
      })
      
    })
  }

  
  invokeService(){
    this.search.setSearchalue(this.searchValue);
  }

  viewModelersList(modelerId:string,clientId:string){
    this.subscription4 = this.backEnd.updateNotificationViewForAdmin(modelerId,clientId).subscribe(()=>{})
    this.route.navigate(['admin/modeler/productList',modelerId])
  }

  enableBar(){
    this.searchBar = true;
    this.closeBtn = true;
    this.searchBtn = false;
  }

  closeBar(){
    this.searchBar = false;
    this.closeBtn = false;
    this.searchBtn =true;
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe()
    if(this.subscription4)this.subscription4.unsubscribe()  
  }
}

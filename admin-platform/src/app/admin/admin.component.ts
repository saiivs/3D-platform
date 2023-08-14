import { AfterViewInit, ChangeDetectorRef, Component, DoCheck, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BackendService } from '../services/backend.service';
import { correctionData } from '../models/interface';
import { CorrectionDilogComponent } from '../correction-dilog/correction-dilog.component';
import { compilePipeFromMetadata } from '@angular/compiler';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'admin-root',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit{
  

  title = 'Admin-Clients';
  notifyData:Array<any> = [];
  checkUrl:any;
  closeBtn:boolean = false;
  searchBtn!:boolean;
  searchBar:boolean = false;
  searchValue:string = ""
  notificationLen:number = 0;
  seeMoreToggle:boolean = true;
  userName!:string|null;
  
  constructor(private titleService:Title,private route:Router,private backEnd:BackendService,private dialog : MatDialog,private search:NotificationService,private router:ActivatedRoute,private cdr: ChangeDetectorRef,private notificationService:NotificationService){

  }

  ngOnInit() {
    this.titleService.setTitle("Admin-Clients");
    this.userName = localStorage.getItem("userName") || null
    this.search.enableSearch.subscribe((flag)=>{
      if(flag){
        this.searchBtn = true;
      }else{
        this.searchBtn = false;
      }
      this.cdr.detectChanges();
    })
    this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
      this.notificationService.notification_admin.subscribe((data)=>{
      console.log(data);
      this.notifyData = [...data];
      this.notificationLen += this.notifyData.length;
      })
      
    })
  }

  
  invokeService(){
    this.search.setSearchalue(this.searchValue);
  }

  viewModelersList(modelerId:string,clientId:string){
    this.backEnd.updateNotificationViewForAdmin(modelerId,clientId).subscribe(()=>{})
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
}

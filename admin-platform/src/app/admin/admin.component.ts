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
  
  constructor(private titleService:Title,private route:Router,private backEnd:BackendService,private dialog : MatDialog,private search:NotificationService,private router:ActivatedRoute,private cdr: ChangeDetectorRef){

  }

  ngOnInit() {
    this.titleService.setTitle("Admin-Clients");
    this.search.enableSearch.subscribe((flag)=>{
      if(flag){
        this.searchBtn = true;
      }else{
        this.searchBtn = false;
      }
      this.cdr.detectChanges();
    })
    this.backEnd.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notifyData = [...data];
      this.notificationLen += this.notifyData.length;
    })
  }

  openDialog(correctionString:string): void {
    const corrData : correctionData = {
      correction:correctionString
    }
    const dialogRef = this.dialog.open(CorrectionDilogComponent,{
      width:"35rem",
      data:corrData
    });
  }

  invokeService(){
    this.search.setSearchalue(this.searchValue);
  }

  getAllNotification(flag:string){
    this.seeMoreToggle = !this.seeMoreToggle;
    this.backEnd.getNotificationForAdmin(flag).subscribe((data)=>{
      this.notifyData = [...data];
    })
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

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { client } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-archive-clients',
  templateUrl: './archive-clients.component.html',
  styleUrls: ['./archive-clients.component.css']
})
export class ArchiveClientsComponent implements OnInit{

  constructor(private backEndService: BackendService,private titleService:Title){

  }

  title:string = "Admin-archive";
  clientTableData:client[] = [];
  totalRecords:number = 0;
  page:number = 1
  subscription!:Subscription;

  ngOnInit(){
    this.titleService.setTitle(this.title)
    this.subscription = this.backEndService.getClient().subscribe((data)=>{
        this.clientTableData = data.data.filter(obj => obj.status == "completed")
        this.totalRecords = this.clientTableData.length; 
    })
  }

  sendClientName(name:string){
    this.backEndService.getClientName(name)
  }

  ngOnDestroy(){
    this.subscription.unsubscribe()
  }

}

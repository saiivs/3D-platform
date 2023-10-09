import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
})
export class ErrorPageComponent implements OnInit,OnDestroy{

  constructor(private titleService : Title,private route:ActivatedRoute){

  }

  title:string = "Error";
  errorMessage:String = ""
  status:string = ""
  subscription!:Subscription

  ngOnInit() {
    this.titleService.setTitle(this.title)
   this.subscription = this.route.queryParams.subscribe((params)=>{
      this.errorMessage = params['message'];
      console.log(this.errorMessage);
      
      this.status = params['statusCode']
      console.log(this.status);
    })
  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe();
  }

}

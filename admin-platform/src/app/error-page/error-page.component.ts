import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
})
export class ErrorPageComponent implements OnInit{

  constructor(private titleService : Title,private route:ActivatedRoute){

  }

  title:string = "Error";
  errorMessage:String = ""
  status:string = ""

  ngOnInit() {
    this.titleService.setTitle(this.title)
    this.route.queryParams.subscribe((params)=>{
      this.errorMessage = params['message'];
      console.log(this.errorMessage);
      
      this.status = params['statusCode']
      console.log(this.status);
    })
  }

}

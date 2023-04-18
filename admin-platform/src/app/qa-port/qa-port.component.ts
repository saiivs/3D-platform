import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-qa-port',
  templateUrl: './qa-port.component.html',
  styleUrls: ['./qa-port.component.css']
})
export class QAPortComponent implements OnInit{

  constructor(private titleService : Title){

  }

  title:string = "QA-Portal"

  ngOnInit(){
    this.titleService.setTitle(this.title)
  }


}

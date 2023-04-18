import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";

@Component({
  selector: "qa-root",
  templateUrl: "./qa.component.html",
  styleUrls: ["./qa.component.css"]
})

export class QaComponent implements OnInit{

  title = 'QA-Clients';

  constructor(private titleService:Title,private route:Router){

  }

  ngOnInit() {
    this.titleService.setTitle(this.title)
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }

}

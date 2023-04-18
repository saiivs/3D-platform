import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";


@Component({
  selector: "modaler-root",
  templateUrl : "./modaler.component.html",
  styleUrls : ["./modaler.component.css"]
})

export class ModalerComponent implements OnInit{

  title = '3D_Modaler-Clients';

  constructor(private titleService:Title,private route:Router){

  }

  ngOnInit() {
    this.titleService.setTitle("3D_Modaler-Clients")
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }
}

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-root',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit{
  title = 'Admin-Clients';

  constructor(private titleService:Title,private route:Router){

  }

  ngOnInit() {
    this.titleService.setTitle("Admin-Clients")
  }

  logOut(){
    localStorage.clear();
    this.route.navigate(['/'])
  }
}

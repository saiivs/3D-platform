import { Component, OnInit } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { environment } from 'src/environments/environment';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-actual-full-scren',
  templateUrl: './actual-full-scren.component.html',
  styleUrls: ['./actual-full-scren.component.css']
})
export class ActualFullScrenComponent implements OnInit{

  constructor(
    private backEndService:BackendService,
    private route:ActivatedRoute,
    private router:Router
  ){ }

  private clientName!:string;
  private articleId!:string;
  private version!:string;
  src!:string
  previousUrl:any


  ngOnInit(): void {
    this.clientName = this.route.snapshot.params['client'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version'];
    this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
    this.router.events.pipe(filter((event: any)=>event instanceof NavigationStart || event instanceof NavigationError)).subscribe((event)=>{
      if (event instanceof NavigationStart) {
        this.previousUrl = this.router.url;
        console.log(this.previousUrl);  
      }
    })
    
  }

  exitFullScreenMode(){
    console.log(this.previousUrl); 
  }
}

import { Component, OnInit } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { environment } from 'src/environments/environment';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
  private clientId!:any;
  src!:string
  previousUrl:any
  subscription!:Subscription


  ngOnInit(): void {
    this.subscription = this.route.params.subscribe(params =>{
      this.clientName = params['client'],
      this.articleId = params['articleId'],
      this.version = params['version'],
      this.clientId = params['clientId']
    })
    this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
  }

  exitFullScreenMode(){
   this.router.navigate(['/QA_panel',this.articleId,this.clientId,this.version])
  }
}

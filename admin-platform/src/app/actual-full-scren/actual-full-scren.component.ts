import { Component, OnInit } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-actual-full-scren',
  templateUrl: './actual-full-scren.component.html',
  styleUrls: ['./actual-full-scren.component.css']
})
export class ActualFullScrenComponent implements OnInit{

  constructor(
    private backEndService:BackendService,
    private route:ActivatedRoute,
  ){ }

  private clientName!:string;
  private articleId!:string;
  private version!:string;
  src!:string

  ngOnInit(): void {
    this.clientName = this.route.snapshot.params['client'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version'];
    this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version}/${this.articleId}.glb`
  }

}

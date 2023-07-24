import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {

  constructor(private socket:Socket){}

connectToSocketServer(){
  // this.socket.connect()
}

}

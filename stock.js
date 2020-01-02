class Stock {
    constructor() {      
    }
    set id(id){
      this._id=id;
    }
    get id(){
      return this._id;
    }
    
    set name(name) {
      this._name = name;
    }
    get name() {
      return this._name;
    } 
    set price(price)  {
      this._price=price;
    }
    get price(){
      return this._price;
    }
    set volume(volume){
      this._volume=volume;
    }
    get volume(){
      return this._volume;
    }

    set change(change){
      this._change=change;
    }
    get change(){
      return this._change;
    }        

    set changePercent(changePercent){
      this._changePercent=changePercent;
    }

    get changePercent(){
      return this._changePercent;
    }
    set time(time){
      this._time=time;
    }
    get time(){
      return this._time;
    }
  }
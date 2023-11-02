


interface HttpPostCallback {
	(x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
const g_id = random_id(12);
var gName: string = "";
var gObjects: number[] = [];

const thing_names: string[] = [
	"chair", // 0
	"lamp",
	"mushroom", // 2
	"outhouse",
	"pillar", // 4
	"pond",
	"rock", // 6
	"statue",
	"tree", // 8
	"turtle",
];



// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
	let request = new XMLHttpRequest();
	request.onreadystatechange = () => {
		if(request.readyState === 4)
		{
			if(request.status === 200) {
				let response_obj;
				try {
					response_obj = JSON.parse(request.responseText);
				} catch(err) {}
				if (response_obj) {
					callback(response_obj);
				} else {
					callback({
						status: 'error',
						message: 'response is not valid JSON',
						response: request.responseText,
					});
				}
			} else {
				if(request.status === 0 && request.statusText.length === 0) {
					callback({
						status: 'error',
						message: 'connection failed',
					});
				} else {
					callback({
						status: 'error',
						message: `server returned status ${request.status}: ${request.statusText}`,
					});
				}
			}
		}
	};
	request.open('post', `${g_origin}/${page_name}`, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(payload));
}



class Sprite {

	x: number;
	y: number;
	name: string;
	image: HTMLImageElement;
	speed: number = 4;
	dest_x?: number;
	dest_y?: number;
	update: () => void;
	onclick: (x: number, y: number) => void;

	constructor(name: string, x: number, y: number, image_url: string, update_method: () => void, onclick_method: (x: number, y: number) => void) {
		this.name = name;
		this.x = x;
		this.y = y;
        this.speed = 4;
		this.image = new Image();
		this.image.src = image_url;
		this.update = update_method;
		this.onclick = onclick_method;
	}

	set_destination(x: number, y: number) {
		
		this.dest_x = x;
		this.dest_y = y;
	}

	ignore_click(x: number, y: number) {
	}

	move(dx: number, dy: number) {
		this.dest_x = this.x + dx;
		this.dest_y = this.y + dy;
	}

	go_toward_destination() {
		if(this.dest_x === undefined)
			return;
		if (this.dest_y === undefined)
			return;
		if(this.x < this.dest_x)
			this.x += Math.min(this.dest_x - this.x, this.speed);
		else if(this.x > this.dest_x)
			this.x -= Math.min(this.x - this.dest_x, this.speed);
		if(this.y < this.dest_y)
			this.y += Math.min(this.dest_y - this.y, this.speed);
		else if(this.y > this.dest_y)
			this.y -= Math.min(this.y - this.dest_y, this.speed);
	}

	sit_still() {
	
	}
}

// stores a record of pther players in the game 
let idToSprite: Record<string, Sprite> = {}


class Model {

	sprites: Sprite[];
	player1: Sprite;

	constructor() {
		this.sprites = [];
		// this.sprites.push(new Sprite(200, 100, "lettuce.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
		this.player1 = new Sprite(gName, 50, 50, "robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
		this.sprites.push(this.player1);
	}

	update() {
		for (const sprite of this.sprites) {
			sprite.update();
		}
	}

	onclick(x: number, y: number) {
		for (const sprite of this.sprites) {
			sprite.onclick(x, y);
		}
	}

	move(dx: number, dy: number) {
		this.player1.move(dx, dy);
	}
}


class View
{
	model: Model;
	canvas: HTMLCanvasElement;
	player1: HTMLImageElement;
	scrollX: number;
	scrollY: number;
	
	constructor(model: Model) {
		this.model = model;
		this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this.player1 = new Image();
		this.player1.src = "robot.png";
		this.scrollX = 0;
		this.scrollY = 0;
	}

	update() {
		let ctx = this.canvas.getContext("2d");
		ctx?.clearRect(0, 0, 1000, 500);
		
		for (const sprite of this.model.sprites) {
			const drawX = sprite.x - this.scrollX;
			const drawY = sprite.y - this.scrollY;

			ctx?.drawImage(sprite.image, drawX - sprite.image.width / 2, drawY - sprite.image.height);
			if (ctx){
				ctx.font = "20px Verdana";
				ctx.fillText(sprite.name, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height - 10);
			}
			const center_x = this.canvas.width / 2;
			const center_y = this.canvas.height / 2;
			const scroll_rate = 0.03;

			this.scrollX += scroll_rate * (sprite.x - this.scrollX - center_x);
			this.scrollY += scroll_rate * (sprite.y - this.scrollY - center_y);

			// Ensure scrollX and scrollY stay within bounds to prevent wandering off the screen
            this.scrollX = Math.max(0, Math.min(this.scrollX, 1000 - this.canvas.width));
            this.scrollY = Math.max(0, Math.min(this.scrollY, 500 - this.canvas.height));
		}
	}
}


class Controller
{
	model: Model;
	view: View;
	key_right: boolean;
	key_left: boolean;
	key_up: boolean;
	key_down: boolean;
	speed: number = 4;
	lastUpdateRequestTime: number = Date.now();

	constructor(model: Model, view: View) {
		this.model = model;
		this.view = view;
		this.key_right = false;
		this.key_left = false;
		this.key_up = false;
		this.key_down = false;
		let self = this;
		view.canvas.addEventListener("click", function(event) { self.onClick(event); });
		document.addEventListener('keydown', function(event) { self.keyDown(event); }, false);
		document.addEventListener('keyup', function(event) { self.keyUp(event); }, false);
		
	}

	onClick(event: MouseEvent) {
		const x = event.pageX - this.view.canvas.offsetLeft;
		const y = event.pageY - this.view.canvas.offsetTop;
		this.model.onclick(x, y);
		httpPost('ajax.html', {
			id: g_id,
			action: 'iJustClicked',
			name: gName,
			x: x,
			y: y,
		}, this.onAcknowledgeClick);
	}

	keyDown(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = true;
		else if(event.keyCode == 37) this.key_left = true;
		else if(event.keyCode == 38) this.key_up = true;
		else if(event.keyCode == 40) this.key_down = true;
	}

	keyUp(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = false;
		else if(event.keyCode == 37) this.key_left = false;
		else if(event.keyCode == 38) this.key_up = false;
		else if(event.keyCode == 40) this.key_down = false;
	}

	onReceiveUpdates(ob: any){
		
		for (let i =0; i < ob.updates.length; i++) {
			let update = ob.updates[i];
			let id = update[0];
			let name = update[1];
			let x = update[2];
			let y = update[3];
		
			// checks to see if player is already in the game
			// adds to the record if not 
			let sprite = idToSprite[id];
			if (sprite === undefined)
			{
				// to distinguish between self and other players
				if (id != g_id)
				{
					// console.log(`ob = ${JSON.stringify(ob)}`);
					let newPlayer = "robot.png";
					sprite = new Sprite(name, x, y, newPlayer, Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
					this.model.sprites.push(sprite);
					idToSprite[id] = sprite;
					//console.log("New Player has arrived:" + id,name,x,y);
				}
			}

			//updates locations of other players 
			sprite.set_destination(x, y);
			//console.log(x, y);
			
		}
	}

	requestUpdate() {
			let payload = {
				action: "iWantUpdates", 
				id: g_id
			}
		
		httpPost("ajax.html", payload, (ob) => {return this.onReceiveUpdates(ob)});
	}

	update() {
		let dx = 0;
		let dy = 0;
        let speed = this.model.player1.speed;
		if(this.key_right) dx += speed;
		if(this.key_left) dx -= speed;
		if(this.key_up) dy -= speed;
		if(this.key_down) dy += speed;
		if(dx != 0 || dy != 0)
			this.model.move(dx, dy);

		const time = Date.now();
  		if (time - this.lastUpdateRequestTime >= 1000) {
    	this.lastUpdateRequestTime = time;
    	this.requestUpdate();
 		}

	}


	onAcknowledgeClick(ob: any) {
		//console.log(`Response to move: ${JSON.stringify(ob)}`);
	}
}


class Game {
	model: Model;
	view: View;
	controller: Controller;
	constructor() {
		this.model = new Model();
		//load map here
		this.getMap();
		this.view = new View(this.model);
		this.controller = new Controller(this.model, this.view);
	}

	onTimer() {
		this.controller.update();
		this.model.update();
		this.view.update();
	}

	getMap()
	{
		let payload = {
			action: 'getMap',
		}
		httpPost("ajax.html", payload, (ob) => {return this.onReceiveMap(ob)});
	}

	onReceiveMap(ob: any)
	{
		//console.log(JSON.stringify(ob));
		for (const thing of ob.map.things)
		{
			let mapX: number = thing.x;
			let mapY: number = thing.y;
			let mapKind: number = thing.kind;

			let image = thing_names[mapKind] + ".png";
			this.model.sprites.push(new Sprite("", mapX, mapY, image, Sprite.prototype.sit_still, Sprite.prototype.ignore_click));	
		}
	
	}

}

// essentially the main function 
//html calls this function on click of submit button 
function submitClicked() {
	
    console.log("The submit button has been pressed");
    let userName = (document.getElementById("userName") as HTMLInputElement).value.trim();
	
    if (userName === '') {
		alert("Please enter a valid username.");
    }
    else {
        
		gName = userName;
    	const content = document.getElementById('content')!;
        content.innerHTML = ''; // Clear the content div
        let s: string[] = [];
        s.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc;">`);
        s.push(`</canvas>`);
        content.innerHTML = s.join('');
		let game = new Game();
		let timer = setInterval(() => { game.onTimer(); }, 40);
    }
	
}
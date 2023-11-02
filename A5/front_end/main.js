"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var random_id = function (len) {
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return __spreadArray([], Array(len), true).reduce(function (a) { return a + p[Math.floor(Math.random() * p.length)]; }, '');
};
var g_origin = new URL(window.location.href).origin;
var g_id = random_id(12);
var gName = "";
var gObjects = [];
var thing_names = [
    "chair",
    "lamp",
    "mushroom",
    "outhouse",
    "pillar",
    "pond",
    "rock",
    "statue",
    "tree",
    "turtle",
];
// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
var httpPost = function (page_name, payload, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var response_obj = void 0;
                try {
                    response_obj = JSON.parse(request.responseText);
                }
                catch (err) { }
                if (response_obj) {
                    callback(response_obj);
                }
                else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            }
            else {
                if (request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                }
                else {
                    callback({
                        status: 'error',
                        message: "server returned status ".concat(request.status, ": ").concat(request.statusText),
                    });
                }
            }
        }
    };
    request.open('post', "".concat(g_origin, "/").concat(page_name), true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
};
var Sprite = /** @class */ (function () {
    function Sprite(name, x, y, image_url, update_method, onclick_method) {
        this.speed = 4;
        this.name = name;
        this.x = x;
        this.y = y;
        this.speed = 4;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
    }
    Sprite.prototype.set_destination = function (x, y) {
        this.dest_x = x;
        this.dest_y = y;
    };
    Sprite.prototype.ignore_click = function (x, y) {
    };
    Sprite.prototype.move = function (dx, dy) {
        this.dest_x = this.x + dx;
        this.dest_y = this.y + dy;
    };
    Sprite.prototype.go_toward_destination = function () {
        if (this.dest_x === undefined)
            return;
        if (this.dest_y === undefined)
            return;
        if (this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if (this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    };
    Sprite.prototype.sit_still = function () {
    };
    return Sprite;
}());
// stores a record of pther players in the game 
var idToSprite = {};
var Model = /** @class */ (function () {
    function Model() {
        this.sprites = [];
        // this.sprites.push(new Sprite(200, 100, "lettuce.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
        this.player1 = new Sprite(gName, 50, 50, "robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
        this.sprites.push(this.player1);
    }
    Model.prototype.update = function () {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.update();
        }
    };
    Model.prototype.onclick = function (x, y) {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.onclick(x, y);
        }
    };
    Model.prototype.move = function (dx, dy) {
        this.player1.move(dx, dy);
    };
    return Model;
}());
var View = /** @class */ (function () {
    function View(model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        this.player1 = new Image();
        this.player1.src = "robot.png";
        this.scrollX = 0;
        this.scrollY = 0;
    }
    View.prototype.update = function () {
        var ctx = this.canvas.getContext("2d");
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, 1000, 500);
        for (var _i = 0, _a = this.model.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            var drawX = sprite.x - this.scrollX;
            var drawY = sprite.y - this.scrollY;
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite.image, drawX - sprite.image.width / 2, drawY - sprite.image.height);
            if (ctx) {
                ctx.font = "20px Verdana";
                ctx.fillText(sprite.name, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height - 10);
            }
            var center_x = this.canvas.width / 2;
            var center_y = this.canvas.height / 2;
            var scroll_rate = 0.03;
            this.scrollX += scroll_rate * (sprite.x - this.scrollX - center_x);
            this.scrollY += scroll_rate * (sprite.y - this.scrollY - center_y);
            // Ensure scrollX and scrollY stay within bounds to prevent wandering off the screen
            this.scrollX = Math.max(0, Math.min(this.scrollX, 1000 - this.canvas.width));
            this.scrollY = Math.max(0, Math.min(this.scrollY, 500 - this.canvas.height));
        }
    };
    return View;
}());
var Controller = /** @class */ (function () {
    function Controller(model, view) {
        this.speed = 4;
        this.lastUpdateRequestTime = Date.now();
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        var self = this;
        view.canvas.addEventListener("click", function (event) { self.onClick(event); });
        document.addEventListener('keydown', function (event) { self.keyDown(event); }, false);
        document.addEventListener('keyup', function (event) { self.keyUp(event); }, false);
    }
    Controller.prototype.onClick = function (event) {
        var x = event.pageX - this.view.canvas.offsetLeft;
        var y = event.pageY - this.view.canvas.offsetTop;
        this.model.onclick(x, y);
        httpPost('ajax.html', {
            id: g_id,
            action: 'iJustClicked',
            name: gName,
            x: x,
            y: y,
        }, this.onAcknowledgeClick);
    };
    Controller.prototype.keyDown = function (event) {
        if (event.keyCode == 39)
            this.key_right = true;
        else if (event.keyCode == 37)
            this.key_left = true;
        else if (event.keyCode == 38)
            this.key_up = true;
        else if (event.keyCode == 40)
            this.key_down = true;
    };
    Controller.prototype.keyUp = function (event) {
        if (event.keyCode == 39)
            this.key_right = false;
        else if (event.keyCode == 37)
            this.key_left = false;
        else if (event.keyCode == 38)
            this.key_up = false;
        else if (event.keyCode == 40)
            this.key_down = false;
    };
    Controller.prototype.onReceiveUpdates = function (ob) {
        for (var i = 0; i < ob.updates.length; i++) {
            var update = ob.updates[i];
            var id = update[0];
            var name_1 = update[1];
            var x = update[2];
            var y = update[3];
            // checks to see if player is already in the game
            // adds to the record if not 
            var sprite = idToSprite[id];
            if (sprite === undefined) {
                // to distinguish between self and other players
                if (id != g_id) {
                    // console.log(`ob = ${JSON.stringify(ob)}`);
                    var newPlayer = "robot.png";
                    sprite = new Sprite(name_1, x, y, newPlayer, Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
                    this.model.sprites.push(sprite);
                    idToSprite[id] = sprite;
                    //console.log("New Player has arrived:" + id,name,x,y);
                }
            }
            //updates locations of other players 
            sprite.set_destination(x, y);
            //console.log(x, y);
        }
    };
    Controller.prototype.requestUpdate = function () {
        var _this = this;
        var payload = {
            action: "iWantUpdates",
            id: g_id
        };
        httpPost("ajax.html", payload, function (ob) { return _this.onReceiveUpdates(ob); });
    };
    Controller.prototype.update = function () {
        var dx = 0;
        var dy = 0;
        var speed = this.model.player1.speed;
        if (this.key_right)
            dx += speed;
        if (this.key_left)
            dx -= speed;
        if (this.key_up)
            dy -= speed;
        if (this.key_down)
            dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
        var time = Date.now();
        if (time - this.lastUpdateRequestTime >= 1000) {
            this.lastUpdateRequestTime = time;
            this.requestUpdate();
        }
    };
    Controller.prototype.onAcknowledgeClick = function (ob) {
        //console.log(`Response to move: ${JSON.stringify(ob)}`);
    };
    return Controller;
}());
var Game = /** @class */ (function () {
    function Game() {
        this.model = new Model();
        //load map here
        this.getMap();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }
    Game.prototype.onTimer = function () {
        this.controller.update();
        this.model.update();
        this.view.update();
    };
    Game.prototype.getMap = function () {
        var _this = this;
        var payload = {
            action: 'getMap',
        };
        httpPost("ajax.html", payload, function (ob) { return _this.onReceiveMap(ob); });
    };
    Game.prototype.onReceiveMap = function (ob) {
        //console.log(JSON.stringify(ob));
        for (var _i = 0, _a = ob.map.things; _i < _a.length; _i++) {
            var thing = _a[_i];
            var mapX = thing.x;
            var mapY = thing.y;
            var mapKind = thing.kind;
            var image = thing_names[mapKind] + ".png";
            this.model.sprites.push(new Sprite("", mapX, mapY, image, Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
        }
    };
    return Game;
}());
// essentially the main function 
//html calls this function on click of submit button 
function submitClicked() {
    console.log("The submit button has been pressed");
    var userName = document.getElementById("userName").value.trim();
    if (userName === '') {
        alert("Please enter a valid username.");
    }
    else {
        gName = userName;
        var content = document.getElementById('content');
        content.innerHTML = ''; // Clear the content div
        var s = [];
        s.push("<canvas id=\"myCanvas\" width=\"1000\" height=\"500\" style=\"border:1px solid #cccccc;\">");
        s.push("</canvas>");
        content.innerHTML = s.join('');
        var game_1 = new Game();
        var timer = setInterval(function () { game_1.onTimer(); }, 40);
    }
}


$(function() {
    $('#parameterForm').submit(function(){
        currentMap = mapGenerator(
                parseInt($('#inputWidth').val()),
                parseInt($('#inputHeight').val()),
                parseFloat($('#inputWallL').val()),
                parseFloat($('#inputOneWayL').val()),
                $('#inputBlindLane').prop('checked'),
                $('#inputGrowingMode').val(),
                parseInt($('#inputGrowingMax').val()),
                $('#inputInitialMode').val()
        );
        drawMap($('#canvas')[0], currentMap);
        return false;
    });
    $('#buttonDownload').click(function() {downloadMap(currentMap)});
});

function mapGenerator(width, height, wallL, oneWayL, allowBlindLane, growingMode, growingMax, initialFoodMode) {
    
    // Build map
    var map = [];
    for (var y = 0; y < height; y++) {
        map[y] = [];
        for (var x = 0; x < width; x++) {
            var n = (Math.random() < wallL || y == 0) ? "n" : "";
            var e = (Math.random() < wallL || x == width-1) ? "e" : "";
            var s = (Math.random() < wallL || y == height-1) ? "s" : "";
            var w = (Math.random() < wallL || x == 0) ? "w" : "";
            
            map[y][x] = {
                "growthRate": 0,
                "initialResources": 0,
                "walls": n+e+s+w
            };
        }
    }
    
    // Transform oneway walls to full walls
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (hasDirection(map[y][x].walls,"n") && y != 0 && Math.random() >= oneWayL)
                map[y-1][x].walls = addDirection(map[y-1][x].walls,"s");
            if (hasDirection(map[y][x].walls,"e") && x != width-1 && Math.random() >= oneWayL)
                map[y][x+1].walls = addDirection(map[y][x+1].walls,"w");
            if (hasDirection(map[y][x].walls,"s") && y != height-1 && Math.random() >= oneWayL)
                map[y+1][x].walls = addDirection(map[y+1][x].walls,"n");
            if (hasDirection(map[y][x].walls,"w") && x != 0 && Math.random() >= oneWayL)
                map[y][x-1].walls = addDirection(map[y][x-1].walls,"e");
        }
    }
    
    // Delete blind lanes
    if (!allowBlindLane) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                while (map[y][x].walls.length > 2) {
                    var deletable = [];
                    if (y != 0 && hasDirection(map[y][x].walls, "n"))
                        deletable.push("n");
                    if (x != width-1 && hasDirection(map[y][x].walls, "e"))
                        deletable.push("e");
                    if (y != height-1 && hasDirection(map[y][x].walls, "s"))
                        deletable.push("s");
                    if (x != 0 && hasDirection(map[y][x].walls, "w"))
                        deletable.push("w");
                    
                    var i = Math.floor(Math.random()*deletable.length);
                    map[y][x].walls = removeDirection(map[y][x].walls,deletable[i]);
                    
                    // Delete other side, too, if we don't want oneway walls
                    if (Math.random() >= oneWayL) {
                        var othercell;
                        var wall;
                        switch(deletable[i]) {
                            case 'n':
                                othercell = map[y-1][x];
                                wall = 's';
                                break;
                            case 'e':
                                othercell = map[y][x+1];
                                wall = 'w';
                                break;
                            case 's':
                                othercell = map[y+1][x];
                                wall = 'n';
                                break;
                            case 'w':
                                othercell = map[y][x-1];
                                wall = 'e';
                                break;
                        }
                        othercell.walls = removeDirection(othercell.walls,wall);
                    }
                }
            }
        }
    }
    
    // generate growing rate
    if (growingMode == 'r') {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                map[y][x].growthRate = Math.random() < 1 ? Math.round(1/(1/growingMax/100 + Math.random()*(1/growingMax)*90/100)) : 0;
            }
        }
    } else if (growingMode == 's') {
        var countSpots = 1 + Math.random() * 4;
        var decrease = 40/Math.sqrt(width*height);
        var spotPeak = growingMax*countSpots/4;
        
        for (var i=0;i<countSpots;i++) {
            var cx = Math.random() * width;
            var cy = Math.random() * height;
            console.log(cx + " - " + cy);
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    var distance = Math.sqrt(Math.pow(x-cx,2)+Math.pow(y-cy,2));
                    map[y][x].growthRate = 1/(
                            (map[y][x].growthRate == 0 ? 0 : 1/map[y][x].growthRate)
                            + 1/(1 + decrease * distance) * 1/spotPeak);
                }
            }
        }
    }
            
    // generate inital food
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (initialFoodMode == 'f') {
                map[y][x].initialResources = 10;
            } else if (initialFoodMode == 'n') {
                map[y][x].initialResources = 0;                
            } else if (initialFoodMode == 'g') {
                map[y][x].initialResources = (map[y][x].growthRate == 0) ? 0 :
                        Math.max(0,Math.min(10,Math.round((1/map[y][x].growthRate) * growingMax * 9 - 1)));
            }
        }
    }
    
    return map;
}

function hasDirection(current, direction) {
    for (var i=0; i<current.length; i++)
        if (current[i] == direction)
            return true;
    return false;
}
function addDirection(current, direction) {
    if (hasDirection(current, direction))
        return current;
    else
        return current + direction;
}
function removeDirection(current, direction) {
    return current.replace(direction, "");
}


function downloadMap(map) {
    var mapHeight = map.length;
    var mapWidth = map[0].length;
    
    // generate "possibleDirections"
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            var walls = "nesw";
            var pDirections = "";
            for (var i = 0;i<walls.length;i++) {
                if (!hasDirection(map[y][x].walls,walls[i]))
                    pDirections += walls[i];
            }
            map[y][x].possibleDirections = pDirections;
        }
    }
    
    // Round growingRate
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            map[y][x].growthRate = Math.round(map[y][x].growthRate);
        }
    }    
    
    var output = JSON.stringify({
            "map": {
                "version": 1,
                "width": mapWidth,
                "height": mapHeight,
                "fields": map,
                "gameParameters": {
                    "movementSpeed" : parseFloat($('#inputRobotSpeed').val()),
                    "maxStayTime": parseInt($('#inputHesitationTime').val())
                }
            }
    });
    
    // Initiate download
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([output], {type: 'application/json'}));
    a.download = 'Map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function drawMap(canvas, map) {
    var mapHeight = map.length;
    var mapWidth = map[0].length;
    
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fitToContainer(canvas);
    
    // find maximum inverted growingRate
    var maxInvGrowing = 0;
    var minInvGrowing = 0;
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (map[y][x].growthRate != 0 && 1/map[y][x].growthRate > maxInvGrowing)
                maxInvGrowing = 1/map[y][x].growthRate;
            if (map[y][x].growthRate != 0 && 1/map[y][x].growthRate < minInvGrowing)
                minInvGrowing = 1/map[y][x].growthRate;
        }
    }
    
    // Draw growing rates
    var fieldPixelWidth = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (map[y][x].growthRate != 0) {
                ctx.fillStyle = "rgba(255, 0, 255, "+ (1/map[y][x].growthRate/maxInvGrowing) +")";
                ctx.fillRect(x*fieldPixelWidth, y*fieldPixelWidth, fieldPixelWidth, fieldPixelWidth);
                
                ctx.fillStyle = "green";
                ctx.textAlign = "center";
                ctx.font = "8pt Helvetica";
                ctx.fillText((Math.round(map[y][x].growthRate / 100)/10), (x+.5)*fieldPixelWidth, (y+.9)*fieldPixelWidth);
                ctx.fillStyle = "blue";
                ctx.fillText(map[y][x].initialResources, (x+.5)*fieldPixelWidth, (y+.5)*fieldPixelWidth);
            }
        }
    }
    
    
    ctx.lineWidth = fieldPixelWidth / 20;
    ctx.lineCap = "square";
    // Draw walls
    for (var y = 0; y < mapHeight-1; y++) {
        for (var x = 0; x < mapWidth-1; x++) {
            var te = hasDirection(map[y][x].walls,"e");
            var nw = hasDirection(map[y][x+1].walls,"w");
            var ts = hasDirection(map[y][x].walls,"s");
            var nn = hasDirection(map[y+1][x].walls,"n");
            
            if (te || nw) {
                ctx.setLineDash([]);
                if (!(te && nw)) {
                    if (nw)
                        canvas_arrow(ctx,(x+.8)*fieldPixelWidth,(y+.5)*fieldPixelWidth,(x+1.2)*fieldPixelWidth,(y+.5)*fieldPixelWidth,ctx.lineWidth * 3);
                    else
                        canvas_arrow(ctx,(x+1.2)*fieldPixelWidth,(y+.5)*fieldPixelWidth,(x+.8)*fieldPixelWidth,(y+.5)*fieldPixelWidth,ctx.lineWidth * 3);
                    ctx.setLineDash([ctx.lineWidth * 3,ctx.lineWidth * 3]);                        
                }
                ctx.beginPath();
                ctx.moveTo((x+1)*fieldPixelWidth, (y)*fieldPixelWidth);
                ctx.lineTo((x+1)*fieldPixelWidth, (y+1)*fieldPixelWidth);
                ctx.stroke();
                ctx.closePath();
            }
            
            if (ts || nn) {
                ctx.setLineDash([]);
                if (!(ts && nn)) {
                    if (nn)
                        canvas_arrow(ctx,(x+.5)*fieldPixelWidth,(y+.8)*fieldPixelWidth,(x+.5)*fieldPixelWidth,(y+1.2)*fieldPixelWidth,ctx.lineWidth * 3);
                    else
                        canvas_arrow(ctx,(x+.5)*fieldPixelWidth,(y+1.2)*fieldPixelWidth,(x+.5)*fieldPixelWidth,(y+.8)*fieldPixelWidth,ctx.lineWidth * 3);
                    ctx.setLineDash([ctx.lineWidth * 3,ctx.lineWidth * 3]);                        
                }
                ctx.beginPath();
                ctx.moveTo((x)*fieldPixelWidth, (y+1)*fieldPixelWidth);
                ctx.lineTo((x+1)*fieldPixelWidth, (y+1)*fieldPixelWidth);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function fitToContainer(canvas){
  // Make it visually fill the positioned parent
  canvas.style.width ='100%';
  canvas.style.height='100%';
  // ...then set the internal size to match
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
function canvas_arrow(context, fromx, fromy, tox, toy, headlen){
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
    context.stroke();
    context.closePath();
}

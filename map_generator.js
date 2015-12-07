
$(function() {
    $('#generateForm').submit(function(){
        currentMap = generateMap(
                parseInt($('#inputWidth').val()),
                parseInt($('#inputHeight').val())
        );
        drawMap($('#canvas')[0], currentMap);
        
        // Do other tasks automatically
        $('#wallsForm').submit();
        $('#growingForm').submit();
        $('#foodForm').submit();
        $('#startsForm').submit();
        
        return false;
    });
    
    $('#wallsForm').submit(function(){
        generateWalls(
                currentMap,
                parseFloat($('#inputWallL').val()),
                parseFloat($('#inputOneWayL').val()),
                $('#inputBlindLane').prop('checked')
        );
        drawMap($('#canvas')[0], currentMap);
        return false;
    });
    
    $('#growingForm').submit(function(){
        generateGrowing(
                currentMap,
                $('#inputGrowingMode').val(),
                parseInt($('#inputGrowingMax').val()),
                parseFloat($('#inputGrowingL').val()),
                parseFloat($('#inputGrowingGrad').val())
        );
        drawMap($('#canvas')[0], currentMap);
        return false;
    });
    
    $('#foodForm').submit(function(){
        generateFood(
                currentMap,
                $('#inputInitialMode').val(),
                parseInt($('#inputFoodMax').val())
        );
        drawMap($('#canvas')[0], currentMap);
        return false;
    });
    
    $('#startsForm').submit(function(){
        generateStarts(
                currentMap,
                parseInt($('#inputStartNumber').val()),
                parseFloat($('#inputStartDist').val())
        );
        drawMap($('#canvas')[0], currentMap);
        return false;
    });
    
    $('#downloadForm').submit(function() {
        downloadMap(currentMap)
        return false;
    });
    
    /* Generate inital map */
    $('#generateForm').submit();
});

function generateMap(width, height) {
    // Build map
    var map = [];
    for (var y = 0; y < height; y++) {
        map[y] = [];
        for (var x = 0; x < width; x++) {
            map[y][x] = {
                "growthRate": 0,
                "initialResources": 0,
                "walls": ""
            };
        }
    }
    return map;
}

function generateWalls(map, wallL, oneWayL, allowBlindLane) {
    var height = map.length;
    var width = map[0].length;
  
    // Generate random walls
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var n = (Math.random() < wallL || y == 0) ? "n" : "";
            var e = (Math.random() < wallL || x == width-1) ? "e" : "";
            var s = (Math.random() < wallL || y == height-1) ? "s" : "";
            var w = (Math.random() < wallL || x == 0) ? "w" : "";
            
            map[y][x].walls = n+e+s+w;
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
    
    // Delete blind lanes and closed boxes
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            while (map[y][x].walls.length > (allowBlindLane ? 3 : 2)) {
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


function generateGrowing(map, growingMode, growingMax, growingL, gradient) {
    var height = map.length;
    var width = map[0].length;
    
    // Clear growing rates
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            map[y][x].growthRate = 0;
        }
    }
  
    // Remove growing rates -- so do nothing
    if (growingMode == 'n') {
        
    
    // Generate constant growing rates
    } else if (growingMode == 'c') {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                map[y][x].growthRate = growingMax;
            }
        }
    
    // Generate constant growing rates on random fields
    } else if (growingMode == 'cr') {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                map[y][x].growthRate = Math.random() < growingL ? growingMax : 0;
            }
        }
    
    // Generate random growing rates
    } else if (growingMode == 'r') {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                map[y][x].growthRate = Math.round(1/(1/growingMax/1000 + Math.random()*(1/growingMax)*.999));
            }
        }
    
    // Generate growing spots
    } else if (growingMode == 's') {
        var countSpots = 1 + Math.random() * 8 * growingL;
        var decrease = gradient/Math.sqrt(width*height);
        var spotPeak = growingMax*countSpots/gradient*7;
        
        for (var i=0;i<countSpots;i++) {
            var cx = Math.random() * width;
            var cy = Math.random() * height;
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    var distance = Math.sqrt(Math.pow(x-cx,2)+Math.pow(y-cy,2));
                    map[y][x].growthRate = 1/(
                            (map[y][x].growthRate == 0 ? 0 : 1/map[y][x].growthRate)
                            + 1/(1 + decrease * Math.pow(distance,1.6)) * 1/spotPeak);
                }
            }
        }
    }
}

function generateFood (map, initialFoodMode, intialFoodValue) {
    var height = map.length;
    var width = map[0].length;
  
    // find maximum inverted growingRate
    var maxInvGrowing = 0;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (map[y][x].growthRate != 0 && 1/map[y][x].growthRate > maxInvGrowing)
                maxInvGrowing = 1/map[y][x].growthRate;
        }
    }
    
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            // Constant initial food
            if (initialFoodMode == 'c') {
                map[y][x].initialResources = intialFoodValue;
            
            // Random initial food
            } else if (initialFoodMode == 'r') {
                map[y][x].initialResources = Math.floor(Math.random(intialFoodValue+1));
            
            // No initial food
            } else if (initialFoodMode == 'n') {
                map[y][x].initialResources = 0;
            
            // Constant initial food
            } else if (initialFoodMode == 'g') {
                map[y][x].initialResources = (map[y][x].growthRate == 0) ? 0 :
                        Math.round((1/map[y][x].growthRate /maxInvGrowing) * intialFoodValue);
            }
        }
    }
}

function generateStarts (map, number, minDist) {
    var height = map.length;
    var width = map[0].length;
    
    // Clear start positions
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            delete map[y][x].startPosition;
        }
    }
    
    var i = 0;
    var n = 0; // Used to prevent endless loop
    // Stores all fields blocked by start positions and the next field the roboters will enter
    var blockedFields = [];
    
    while(i < number && n < 100*number) {
        n++;
        var x = Math.floor(Math.random()*width);
        var y = Math.floor(Math.random()*height);
        
        if (map[y][x].startPosition || minDistOfList(x,y,blockedFields) < minDist)
            continue;
        
        var directions = [];
        var walls = "nesw";
        for (var j=0;j<walls.length;j++)
            if (!hasDirection(map[y][x].walls,walls[j]) &&
                    minDistOfList(nextCell(x,y, walls[j]).x,nextCell(x,y,walls[j]).y,blockedFields) > minDist)
                directions.push(walls[j]);
        
        if (directions.length == 0)
            continue;
        
        var d = directions[Math.floor(Math.random() * directions.length)];
        map[y][x].startPosition = d;
        blockedFields.push({x:x,y:y});
        blockedFields.push(nextCell(x,y,d));
        i++;
    }
}
function minDistOfList(x,y,fields) {
    var minDist = Number.POSITIVE_INFINITY;
    for (var i=0; i<fields.length; i++) {
        var dist = Math.sqrt(Math.pow(fields[i].x-x,2)+Math.pow(fields[i].y-y,2));
        if (dist < minDist)
            minDist = dist;
    }
    return minDist;
}

/* **************** *
 * Helper functions *
 * **************** */
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
function nextCell(x,y,orientation) {var nextX;
    var nextY;
    switch(orientation) {
        case 'n':
            nextX = x;
            nextY = y-1;
            break;
        case 'e':
            nextX = x+1;
            nextY = y;
            break;
        case 's':
            nextX = x;
            nextY = y+1;
            break;
        case 'w':
            nextX = x-1;
            nextY = y;
            break;
    }
    
    return {x:nextX,y:nextY};
}

/* ************ *
 * Map download *
 * ************ */
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
    a.download = getCountry() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


/* *********** *
 * Map drawing *
 * *********** */
function drawMap(canvas, map) {
    var mapHeight = map.length;
    var mapWidth = map[0].length;
    
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fitToContainer(canvas);
    
    var fieldPixelWidth = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
    
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
    
    // Draw growingRate background
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (map[y][x].growthRate != 0) {
                ctx.fillStyle = "rgba(255, 0, 255, "+ (1/map[y][x].growthRate/maxInvGrowing*0.8) +")";
                ctx.fillRect(x*fieldPixelWidth, y*fieldPixelWidth, fieldPixelWidth, fieldPixelWidth);
            }
        }
    }
    
    // Draw start positions
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255, 127, 0, .5)";
    ctx.strokeStyle = "rgba(255, 127, 0, .9)";
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (map[y][x].startPosition) {
                var rotation;
                switch(map[y][x].startPosition) {
                    case 'n':
                        rotation = Math.PI*3/2;
                        break;
                    case 'e':
                        rotation = 0;
                        break;
                    case 's':
                        rotation = Math.PI/2;
                        break;
                    case 'w':
                        rotation = Math.PI;
                        break;
                }
                
                canvas_rotated_triangle(ctx,(x+.5)*fieldPixelWidth,(y+.5)*fieldPixelWidth,.4*fieldPixelWidth,rotation);
            }
        }
    }
    
    // Draw growing rates, initial food and numbers
    ctx.textAlign = "center";
    ctx.font = Math.round(fieldPixelWidth * 0.18) + "pt Helvetica";
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (map[y][x].growthRate != 0) {
                ctx.fillStyle = "blue";
                ctx.fillText((Math.round(map[y][x].growthRate / 100)/10) + "s", (x+.6)*fieldPixelWidth, (y+.8)*fieldPixelWidth);
            }
            if (map[y][x].initialResources != 0) {
                ctx.fillStyle = "rgba(0,255,0,.5)";
                for(var i=1; i<=map[y][x].initialResources; i++) {
                    ctx.fillRect((x+.05)*fieldPixelWidth, (y+1-i/12-5/84)*fieldPixelWidth, fieldPixelWidth*.2, fieldPixelWidth/14);
                }
                ctx.fillStyle = "green";
                ctx.fillText(map[y][x].initialResources, (x+.6)*fieldPixelWidth, (y+.4)*fieldPixelWidth);
            }
        }
    }
    
    // draw grid
    ctx.lineWidth = 1;
    ctx.setLineDash([3,3]);
    ctx.strokeStyle = '#888';
    for (var y = 0; y <= mapHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y*fieldPixelWidth);
        ctx.lineTo(mapWidth*fieldPixelWidth,y*fieldPixelWidth);
        ctx.stroke();
        ctx.closePath();
    }
    for (var x = 0; x <= mapWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x*fieldPixelWidth,0);
        ctx.lineTo(x*fieldPixelWidth,mapHeight*fieldPixelWidth);
        ctx.stroke();
        ctx.closePath();
    }
    
    // Draw walls
    ctx.lineWidth = fieldPixelWidth / 20;
    ctx.lineCap = "square";
    ctx.strokeStyle = 'black';
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (x < mapWidth-1) {
                var te = hasDirection(map[y][x].walls,"e");
                var nw = hasDirection(map[y][x+1].walls,"w");
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
            }
            
            if (y < mapHeight-1) {
                var ts = hasDirection(map[y][x].walls,"s");
                var nn = hasDirection(map[y+1][x].walls,"n");
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
function canvas_rotated_triangle(context,x,y,r,rotation) {
    context.beginPath();
    context.moveTo(x + r*Math.cos(rotation), y+r*Math.sin(rotation));
    context.lineTo(x + r*Math.cos(rotation+Math.PI*2/3), y+r*Math.sin(rotation+Math.PI*2/3));
    context.lineTo(x + r*Math.cos(rotation+Math.PI*4/3), y+r*Math.sin(rotation+Math.PI*4/3));
    context.lineTo(x + r*Math.cos(rotation), y+r*Math.sin(rotation));
    context.stroke();
    context.fill();
    context.closePath();
}


function getCountry() {
     var countries = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antarctica','Argentina','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belgium','Bermuda','Bhutan','Bolivia','Brazil','Bulgaria','Cameroon','Canada','Chad','Chile','China','Colombia','Comoros','Congo','Croatia','Cuba','Cyprus','Denmark','Djibouti','Ecuador','Egypt','Eritrea','Ethiopia','Fiji','Finland','France','Georgia','Germany','Ghana','Gibraltar','Greece','Greenland','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Korea','Lebanon','Liechtenstein','Lithuania','Luxembourg','Madagascar','Maldives','Malta','Mexico','Monaco','Morocco','Myanmar','Namibia','Nepal','Netherlands','Nigeria','Norway','Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Senegal','Seychelles','Singapore','Slovakia','Slovenia','Somalia','Spain','Sudan','Sweden','Switzerland','Taiwan','Thailand','Togo','Tunisia','Turkey','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe'];
    
    return countries[Math.floor(Math.random()*countries.length)];
}

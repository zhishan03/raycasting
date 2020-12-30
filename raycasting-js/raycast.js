const TILE_SIZE = 32;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

// the width of the column of pixels
const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.2;

class Map {
    constructor() {
        this.grid = [
            // 1,2,3 is a wall, 0 is empty space
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 3, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 3, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }

    hasWallAt(x, y) {
        // if the player is outside of the grid
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return true;
        }
        var mapGridIndexX = Math.floor(x / TILE_SIZE);
        var mapGridIndexY = Math.floor(y / TILE_SIZE);
        if (this.grid[mapGridIndexY][mapGridIndexX] > 0) {
            return true;
        } else {
            return false;
        }
    }

    getWallContentAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return 0;
        }
        var mapGridIndexX = Math.floor(x / TILE_SIZE);
        var mapGridIndexY = Math.floor(y / TILE_SIZE);
        return this.grid[mapGridIndexY][mapGridIndexX];
    }

    render() {
        for (var i = 0; i < MAP_NUM_ROWS; i++) {
            for (var j = 0; j < MAP_NUM_COLS; j++) {
                // position on the x and y axis
                var tileX = j * TILE_SIZE;
                var tileY = i * TILE_SIZE;
                var tileColor = this.grid[i][j] > 0 ? "#222": "#fff";
                stroke('#222');
                fill(tileColor);
                rect(
                    MINIMAP_SCALE_FACTOR * tileX, 
                    MINIMAP_SCALE_FACTOR * tileY, 
                    MINIMAP_SCALE_FACTOR * TILE_SIZE, 
                    MINIMAP_SCALE_FACTOR * TILE_SIZE);
            }
        }
    }
}

class Player {
    constructor() {
        this.x = WINDOW_WIDTH / 2;
        this.y = WINDOW_HEIGHT / 2;
        // the radius of the circle
        this.radius = 3;
        this.turnDirection = 0; // -1 if left, +1 if right
        this.walkDirection = 0; // -1 if back, +1 if front
        this.rotationAngle = Math.PI / 2; 
        this.moveSpeed = 2.0;
        // converting 2 degrees to radians
        this.rotationSpeed = 2 * Math.PI / 180;
    }
    render() {
        noStroke();
        fill("red");
        circle(
            MINIMAP_SCALE_FACTOR * this.x, 
            MINIMAP_SCALE_FACTOR * this.y, 
            MINIMAP_SCALE_FACTOR * this.radius);
        // stroke("red");
        // line(
        //     this.x,
        //     this.y,
        //     // new x and y position
        //     this.x + Math.cos(this.rotationAngle) * 20,
        //     this.y + Math.sin(this.rotationAngle) * 20,
        //     );
    }

    update() {
        // update player position based on turnDirection and walkDirection
        this.rotationAngle += this.turnDirection * this.rotationSpeed;
        
        var moveStep = this.walkDirection * this.moveSpeed;

        var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
        var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;

        // to check and prevent collision (only set new player position if it's not colliding with the wall)
        if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
            this.x = newPlayerX;
            this.y = newPlayerY;
        }
    }
}

class Ray {
    constructor(rayAngle) {
        this.rayAngle = normalizeAngle(rayAngle);
        this.wallHitX = 0;
        this.wallHitY = 0;
        this.distance = 0;
        this.hitWallColor = 0;
        this.wasHitVertical = false;

        this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
        this.isRayFacingUp = !this.isRayFacingDown;

        this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
        this.isRayFacingLeft = !this.isRayFacingRight;
    }

    cast() {
        var xintercept, yintercept;
        var xstep, ystep;

        ///////////////////////////////////////////
        // HORIZONTAL RAY-GRID INTERSECTION CODE
        ///////////////////////////////////////////
        var foundHorzWallHit = false;
        var horzWallHitX = 0;
        var horzWallHitY = 0;
        var horzWallColor = 0;

        // Find the y-coordinate of the closest horizontal grid intersenction
        yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
        yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

        // Find the x-coordinate of the closest horizontal grid intersection
        xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);

        // Calculate the increment xstep and ystep
        ystep = TILE_SIZE;
        ystep *= this.isRayFacingUp ? -1 : 1;

        xstep = TILE_SIZE / Math.tan(this.rayAngle);
        xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

        var nextHorzTouchX = xintercept;
        var nextHorzTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(
                nextHorzTouchX,
                nextHorzTouchY + (this.isRayFacingUp ? -1 : 0) // if ray is facing up, force one pixel up so we are inside a grid cell
            );
            if (wallGridContent != 0) {
                foundHorzWallHit = true;
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
                horzWallColor = wallGridContent;
                break;
            } else {
                nextHorzTouchX += xstep;
                nextHorzTouchY += ystep;
            }
        }
        
        ///////////////////////////////////////////
        // VERTICAL RAY-GRID INTERSECTION CODE
        ///////////////////////////////////////////
        var foundVertWallHit = false;
        var vertWallHitX = 0;
        var vertWallHitY = 0;
        var vertWallColor = 0;

        // Find the x-coordinate of the closest vertical grid intersenction
        xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
        xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

        // Find the y-coordinate of the closest vertical grid intersection
        yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);

        // Calculate the increment xstep and ystep
        xstep = TILE_SIZE;
        xstep *= this.isRayFacingLeft ? -1 : 1;

        ystep = TILE_SIZE * Math.tan(this.rayAngle);
        ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
        ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

        var nextVertTouchX = xintercept;
        var nextVertTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(
                nextVertTouchX + (this.isRayFacingLeft ? -1 : 0), // if ray is facing left, force one pixel left so we are inside a grid cell
                nextVertTouchY
            );
            if (wallGridContent != 0) {
                foundVertWallHit = true;
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                vertWallColor = wallGridContent;
                break;
            } else {
                nextVertTouchX += xstep;
                nextVertTouchY += ystep;
            }
        }

        // Calculate both horizontal and vertical distances and choose the smallest value
        var horzHitDistance = (foundHorzWallHit)
            ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
            : Number.MAX_VALUE;
        var vertHitDistance = (foundVertWallHit)
            ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
            : Number.MAX_VALUE;

        // only store the smallest of the distances
        if (vertHitDistance < horzHitDistance) {
            this.wallHitX = vertWallHitX;
            this.wallHitY = vertWallHitY;
            this.distance = vertHitDistance;
            this.hitWallColor = vertWallColor;
            this.wasHitVertical = true;
        } else {
            this.wallHitX = horzWallHitX;
            this.wallHitY = horzWallHitY;
            this.distance = horzHitDistance;
            this.hitWallColor = horzWallColor;
            this.wasHitVertical = false;
        }
    }
    
    render() {
        stroke("rgba(255, 0, 0, 0.3)");
        line(
            MINIMAP_SCALE_FACTOR * player.x,
            MINIMAP_SCALE_FACTOR * player.y,
            MINIMAP_SCALE_FACTOR * this.wallHitX,
            MINIMAP_SCALE_FACTOR * this.wallHitY
        );
    }
}

var grid = new Map();
var player = new Player();
// a list of ray objects
var rays = [];

function keyPressed() {
    if (keyCode == UP_ARROW) {
        // walk forward
        player.walkDirection = +1;
    } else if (keyCode == DOWN_ARROW) {
        // walk backward
        player.walkDirection = -1;
    } else if (keyCode == RIGHT_ARROW) {
        // turn right
        player.turnDirection = +1;
    } else if (keyCode == LEFT_ARROW) {
        // turn left
        player.turnDirection = -1;
    }
}

// when the user released the key
function keyReleased() {
    if (keyCode == UP_ARROW) {
        // walk forward
        player.walkDirection = 0;
    } else if (keyCode == DOWN_ARROW) {
        // walk backward
        player.walkDirection = 0;
    } else if (keyCode == RIGHT_ARROW) {
        // turn right
        player.turnDirection = 0;
    } else if (keyCode == LEFT_ARROW) {
        // turn left
        player.turnDirection = 0;
    }
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function setup() {
    // initialize the game
    createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function castAllRays() {

    // start first ray by subtracting half of the FOV
    var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);

    rays = [];

    // loop all columns casting the rays
    // for (var i = 0; i < NUM_RAYS; i++) {
    for (var col = 0; col < NUM_RAYS; col++) {
        var ray = new Ray(rayAngle);
        ray.cast();
        rays.push(ray);
        
        rayAngle += FOV_ANGLE / NUM_RAYS;
    }
}

function renderCeiling() {
    noStroke();
    fill('#414141');
    rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT/2);
}

function renderFloor() {
    noStroke();
    fill('#818181');
    rect(0, WINDOW_HEIGHT/2, WINDOW_WIDTH, WINDOW_HEIGHT)
}

function render3DProjectedWalls() {
    renderCeiling();
    renderFloor();
    // loop every ray in the array of rays
    for (var i = 0; i < NUM_RAYS; i++) {
        // the current ray
        var ray = rays[i];

        var correctWallDistance = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);

        var distanceProjectPlane = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2);

        // calculate projected wall height
        var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectPlane;

        // set a darker color if the wall is facing north-south
        var colorBrightness = ray.wasHitVertical ? 255 : 200;

        // set the correct color based on the wall hit grid content (1=Red, 2=Green, 3=Blue)
        var colorR = ray.hitWallColor == 1 ? colorBrightness : 0;
        var colorG = ray.hitWallColor == 2 ? colorBrightness : 0;
        var colorB = ray.hitWallColor == 3 ? colorBrightness : 0;
        var alpha = 1.0;

        fill("rgba(" + colorR + ", " + colorG + ", " + colorB + ", " + alpha + ")");
        noStroke();

        rect(
            // x position
            i * WALL_STRIP_WIDTH,
            // y position (render it in the middle of the screen)
            (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
            WALL_STRIP_WIDTH,
            wallStripHeight,
        )
    }
}

function normalizeAngle(angle) {
    angle = angle % (2 * Math.PI);
    // if the angle is negative, add 2*PI to the angle
    if (angle < 0) {
        angle += 2 * Math.PI;
    }
    return angle;
}

function update() {
    // TODO: update all game objects before we render the next frame
    player.update();
    castAllRays();
}

function draw() {
    clear("#212121");
    update();

    render3DProjectedWalls();
    // render the grid itself
    grid.render();
    // render the ray in rays list
    for (ray of rays) {
        ray.render();
    }
    player.render();
}


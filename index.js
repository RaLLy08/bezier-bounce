class Canvas {
    static WIDTH = 900;
    static HEIGHT = 800;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.canvas.width = Canvas.WIDTH;
        this.canvas.height = Canvas.HEIGHT;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    drawPoint(x, y, r=4) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    drawCircle(x, y, r) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    drawText(x, y, text) {
        this.ctx.font = '24px serif';
        this.ctx.fillText(text, x + 20, y + 20);
    }
}

const canvasEl = document.getElementById("canvas");

const canvas = new Canvas(canvasEl);

const centerY = Canvas.HEIGHT / 2;
const centerX = Canvas.WIDTH / 2;

// canvas.drawPoint(centerX, centerY);
const displayOptions = {
    showLines: false,
}

const options = {
    koef: 100,
    fadeKoef: 1.07,
    tension: 0.1,
}

const env = {
    mousePressed: false,
    draggedPoint: null,
    draggedPointIndex: null,
    positionsFixed: true,
}

// class bezeir

const getSteps = (point1, point2, koef=4) => {
    const steps = [];
    const {x: x1, y: y1} = point1;
    const {x: x2, y: y2} = point2;

    const xStep = (x2 - x1) / koef;
    const yStep = (y2 - y1) / koef;

    for (let i = 0; i < koef; i++) {
        const xStepPosition = x1 + xStep * i;
        const yStepPosition = y1 + yStep * i;

        steps.push({x: xStepPosition, y: yStepPosition});
    }

    return steps;
}

const getPointsOnLines = (abSteps, bcSteps) => {
    const pointsOnLines = [];

    for (let i = 0; i < abSteps.length; i++) {
        const abStep = abSteps[i];
        const bcStep = bcSteps[i];

        const steps = getSteps(abStep, bcStep, options.koef);

        pointsOnLines.push(steps[i]);
    }

    return pointsOnLines;
}


const getBezierPoints = (points, options) => {
    const abSteps = getSteps(points[0], points[1], options.koef);
    const bcSteps = getSteps(points[1], points[2], options.koef);

    const cbSteps = getSteps(points[3], points[2], options.koef);
    const baSteps = getSteps(points[2], points[1], options.koef);

    
    const pointsOnLinesABBC = getPointsOnLines(abSteps, bcSteps);

    const pointsOnLinesCBBA = getPointsOnLines(cbSteps, baSteps);

    const pointsOnLines = getPointsOnLines(pointsOnLinesABBC, pointsOnLinesCBBA.reverse());

    // side effect 
    if (displayOptions.showLines) {
        drawLinesSteps(abSteps, bcSteps);
        drawLinesSteps(cbSteps, baSteps);

        drawConnectPoints(points);
    }


    return pointsOnLines;
}

const fixedPositions = [
    new Vector(400, Canvas.HEIGHT - 200),
    new Vector(400, 400),
    new Vector(400, 200),
    new Vector(400, 200),
]

const points = [
    { position: fixedPositions[0], properties: { r: 12, text: 'A' },         velocity: new Vector(0, 0),
    acceleration: new Vector(0, 0), },
    { 
        position: fixedPositions[1], 
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: {
            text: "B", hide: false, r: 12
        }
    },
    { position: fixedPositions[2], properties: {
        r: 12, text: 'C',  
    },        velocity: new Vector(0, 0),
    acceleration: new Vector(0, 0) },
    { properties: { r: 12, text: 'D' }, position: fixedPositions[3],         velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0), },
]



canvasEl.onmousemove = (e) => {
    changePositions(e.offsetX, e.offsetY);
}

canvasEl.ontouchmove = (e) => {
    changePositions(e.touches[0].clientX, e.touches[0].clientY);
}


const changePositions = (x, y) => {
    if (!env.mousePressed) return;

    const p = getBezierPoints(points.map(el => el.position), options);

    points.forEach((point, i) => {
        const mouseNear = ((x - point.position.x)**2 + (y - point.position.y)**2) < (point.properties.r + 20)**2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point.position;
            env.controlPoints = true;
            env.draggedPointIndex = i;
        }

        if (env.draggedPoint) {
            if (env.positionsFixed) {
                fixedPositions[env.draggedPointIndex].x = x;
                fixedPositions[env.draggedPointIndex].y = y;
            }

            env.draggedPoint.x = x;
            env.draggedPoint.y = y;
        }
    });
   
    if (env.draggedPoint && env.controlPoints || env.positionsFixed) return
    
    p.forEach((point) => {
        const mouseNear = ((x - point.x)**2 + (y - point.y)**2) < 30**2;

        if (mouseNear && !env.draggedPoint) {
            let minPoint = null;
            let minDistance = Infinity;
            let minPointIndex = null;

            points.forEach((point2, i, arr) => {
                const distance = ((point.x - point2.position.x)**2 + (point.y - point2.position.y)**2);
                
                if (distance < minDistance && i !== 0 && i !== arr.length - 1) {
                    minDistance = distance;
                    minPoint = point2;
                    minPointIndex = i;
                }
            });

            env.draggedPoint = minPoint;
            env.draggedPointIndex = minPointIndex;
            env.controlPoints = false;
        }

        if (env.draggedPoint) {
            env.draggedPoint.position.x = x - (env.startPositionX - fixedPositions[env.draggedPointIndex].x);
            env.draggedPoint.position.y = y - (env.startPositionY - fixedPositions[env.draggedPointIndex].y);
        }
    });
}


canvasEl.onmousedown = (e) => {
    env.mousePressed = true;
    env.startPositionX = e.offsetX;
    env.startPositionY = e.offsetY;
}

canvasEl.ontouchstart = (e) => {
    env.mousePressed = true;
}

canvasEl.onmouseup = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
}

canvasEl.ontouchend = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
}

canvasEl.onmouseleave = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
}


const drawPoint = (point={}) => {
    if (point.hide) return;

    canvas.drawPoint(point.x, point.y, point.r);
    point.text && canvas.drawText(point.x, point.y, point.text);
}

const drawPoints = (points) => {
    points.forEach(drawPoint);
}

const drawConnectPoints = (points) => {
    points.forEach((point, index) => {
        if (index === 0) return;
        canvas.drawLine(points[index - 1].x, points[index - 1].y, point.x, point.y);
    });
}


const drawLinesSteps = (abSteps, bcSteps) => {
    for (let i = 0; i < abSteps.length; i++) {
        const lineFrom = abSteps[i];
        const lineTo = bcSteps[i];
        
        canvas.drawLine(lineFrom.x, lineFrom.y, lineTo.x, lineTo.y);
    }
}

const elastic = {
    v: 100,
    tensionLength: 0,
}

const toRadians = (amplitude, maxAmplitude) => {
    amplitude = amplitude % maxAmplitude;

    return (amplitude * 2 * Math.PI) / maxAmplitude;
}


const roundBy = (number, roundBy) => {
    return Math.round(number / roundBy) * roundBy;
}

const getSpringEffect = (point, anchorVector, fade=1, tension=0.1) => {
    const ellasticForce = point.position
        .sub(anchorVector)
        .scaleBy(tension)
        .negate();

    return {
        acceleration: ellasticForce,
        velocity: point.velocity.scaleBy(1 / fade),
    }
}

const frame = () => {
    canvas.clear();
    window.requestAnimationFrame(frame);

    drawPoints(points.map(el => ({...el.position, ...el.properties})));
    drawPoints(getBezierPoints(points.map(el => el.position), options));


    if (env.draggedPoint || env.positionsFixed) return;


    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const anchor = fixedPositions[i];

        const { acceleration, velocity } = getSpringEffect(
            point, 
            anchor, 
            options.fadeKoef, 
            options.tension
        );
    
        point.velocity = velocity;
        point.acceleration = acceleration;
    
        point.velocity = point.velocity.add(point.acceleration);
        point.position = point.position.add(point.velocity);
    }
}

frame()


step.oninput = (e) => {
    options.koef = 100 / e.target.value;

    step_label.innerHTML = 'Step: ' + e.target.value;
}


step.value = 100 / options.koef;
step_label.innerHTML = 'Step: ' + 100 / options.koef;


point_positions_btn.onclick = () => {
    env.positionsFixed = !env.positionsFixed;
    point_positions_btn.innerHTML = env.positionsFixed ? 'Lock points' : 'Unlock points';
}

show_lines.onchange = (e) => {
    displayOptions.showLines = e.target.checked;
}

tension_koef.oninput = (e) => {
    options.tension = e.target.value;
    tension_koef_label.innerHTML = 'Tension koef: ' + e.target.value;
}
tension_koef_label.innerHTML = 'Tension koef: ' + options.tension;



fade_koef.oninput = (e) => {
    options.fadeKoef = +e.target.value || 1;
    fade_koef_label.innerHTML = 'Fade koef: ' + e.target.value;
}
fade_koef_label.innerHTML = 'Fade koef: ' + options.fadeKoef;

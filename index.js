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
    draggedPoint: null
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


    // side effect 
    if (displayOptions.showLines) {
        drawLinesSteps(abSteps, bcSteps);
        drawConnectPoints(points);
    }


    const pointsOnLines = getPointsOnLines(abSteps, bcSteps);

    return pointsOnLines;
}

const points = [
    { position: new Vector(200, Canvas.HEIGHT - 200), properties: { r: 12 } },
    { 
        position: new Vector(Canvas.WIDTH/2, Canvas.HEIGHT/2), 
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: {
            text: "B", hide: true, r: 1
        }
    },
    { position: new Vector(Canvas.WIDTH - 200, 200), properties: {
         r: 12
    } },
    // { x: Canvas.WIDTH, y: 300, text: "D", r: 10 },
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

    points.forEach((point) => {
        const mouseNear = ((x - point.position.x)**2 + (y - point.position.y)**2) < (point.properties.r + 20)**2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point.position;
            env.controlPoints = true;

        }

        if (env.draggedPoint) {
            env.draggedPoint.x = x;
            env.draggedPoint.y = y;
        }
    });

    if (env.draggedPoint && env.controlPoints) return

    p.forEach((point) => {
        const mouseNear = ((x - point.x)**2 + (y - point.y)**2) < 30**2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point;
            env.controlPoints = false;
        }

        if (env.draggedPoint) {
            points[1].position.x = x;
            points[1].position.y = y;
        }
    });
}


canvasEl.onmousedown = (e) => {
    env.mousePressed = true;
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

const getSpringEffect = (vector, anchorVector, fade=1, tension=0.1) => {
    const ellasticForce = vector
        .sub(anchorVector)
        .scaleBy(tension)
        .negate();

    return {
        acceleration: ellasticForce,
        velocity: points[1].velocity.scaleBy(1 / fade),
    }
}


const frame = () => {
    canvas.clear();
    window.requestAnimationFrame(frame);

    drawPoints(points.map(el => ({...el.position, ...el.properties})));
    drawPoints(getBezierPoints(points.map(el => el.position), options));

    const middleAC = points[0].position.add(points[2].position).scaleBy(0.5);


    if (env.draggedPoint) return;

    const { acceleration, velocity } = getSpringEffect(
        points[1].position, 
        middleAC, 
        options.fadeKoef, 
        options.tension
    );

    points[1].velocity = velocity;
    points[1].acceleration = acceleration;


    points[1].velocity = points[1].velocity.add(points[1].acceleration);
    points[1].position = points[1].position.add(points[1].velocity);
}

frame()


step.oninput = (e) => {
    options.koef = 100 / e.target.value;

    step_label.innerHTML = 'Step: ' + e.target.value;
}


step.value = 100 / options.koef;
step_label.innerHTML = 'Step: ' + 100 / options.koef;




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

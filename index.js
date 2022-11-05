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
    fadeKoef: 1.1,
    tension: 20,
}

const env = {
    mousePressed: false,
    draggedPoint: null
}

const points = [
    { x: 200, y: Canvas.HEIGHT - 200, text: "A", r: 10 },
    { x: Canvas.WIDTH/2, y: Canvas.HEIGHT/2, text: "B", hide: true },
    { x: Canvas.WIDTH - 200, y: 200, text: "C", r: 10 },
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

    const abSteps = getSteps(points[0], points[1], options.koef);
    const bcSteps = getSteps(points[1], points[2], options.koef);
    const p = getPointsOnLines(abSteps, bcSteps);

    points.forEach((point) => {
        const mouseNear = ((x - point.x)**2 + (y - point.y)**2) < point.r**2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point;
            env.controlPoints = true;

        }

        if (env.draggedPoint) {
            env.draggedPoint.x = x;
            env.draggedPoint.y = y;
        }
    });

    if (env.draggedPoint && env.controlPoints) return

    p.forEach((point) => {
        const mouseNear = ((x - point.x)**2 + (y - point.y)**2) < 60**2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point;
            env.controlPoints = false;
        }

        if (env.draggedPoint) {
            points[1].x = x;
            points[1].y = y;
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

const frame = () => {
    canvas.clear();

    drawPoints(points);

    const middleAC = {
        x: (points[0].x + points[2].x) / 2,
        y: (points[0].y + points[2].y) / 2,
    }


    // const vxSign = Math.sign(middleAC.x - points[1].x);
    // const vySign = Math.sign(middleAC.y - points[1].y);

    const distBTOAC = Math.sqrt((points[1].x - middleAC.x)**2 + (points[1].y - middleAC.y)**2);

    if (env.draggedPoint) {
        elastic.tensionLength = distBTOAC;
        elastic.x = points[1].x;
        elastic.y = points[1].y;
        elastic.tx = middleAC.x;
        elastic.ty = middleAC.y;
        elastic.t = 0;
        elastic.fade = 1
        // console.log((middleAC.x - points[1].x) / distBTOAC)
    } 

    const tensionKoef = 0.00055;

    const totalDist = distBTOAC + elastic.tensionLength;
    // const totalDist = distBTOAC;

    if (!env.draggedPoint && elastic.tensionLength > 0) {
        elastic.t += 1;

        // const sin = (middleAC.x - points[1].x) / distBTOAC;
        // const cos = (middleAC.y - points[1].y) / distBTOAC;
    
        // const vx = sin * totalDist**2 * tensionKoef;
        // const vy = cos * totalDist**2 * tensionKoef;
        
        const k = options.tension;
        const wave = Math.cos(-elastic.t * k * (Math.PI / 180))

        const xLen = (elastic.x - elastic.tx) * elastic.fade;
        const yLen = (elastic.y - elastic.ty) * elastic.fade;

        const prevX = points[1].x;
        const prevY = points[1].y;
        
        points[1].x = wave * xLen + middleAC.x;
        points[1].y = wave * yLen + middleAC.y;
    
        const v = Math.hypot(prevX - points[1].x, prevY - points[1].y);
    
        if (distBTOAC < v) {
            elastic.fade /= +options.fadeKoef
        }
    }
   

    const abSteps = getSteps(points[0], points[1], options.koef);
    const bcSteps = getSteps(points[1], points[2], options.koef);
    // const cdSteps = getSteps(points[2], points[3], options.koef);

    drawPoint(abSteps[1]);
    drawPoint(bcSteps.at(-1));
    // drawPoint(cdSteps[1]);

    if (displayOptions.showLines) {
        drawLinesSteps(abSteps, bcSteps);
        drawConnectPoints(points);

        // drawLinesSteps(bcSteps, cdSteps);
    }

    const pointsOnLines = getPointsOnLines(abSteps, bcSteps);
    

    drawPoints(pointsOnLines);

    window.requestAnimationFrame(frame);
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



// const vx = (middleAC.x - points[1].x + (middleAC.x - elastic.x)) / totalDist;
// const vy = (middleAC.y - points[1].y + (middleAC.y - elastic.y)) / totalDist;

/* v2

    if (env.draggedPoint) {
        elastic.tensionLength = distBTOAC;
        elastic.x = points[1].x;
        elastic.y = points[1].y;
        elastic.tx = middleAC.x;
        elastic.ty = middleAC.y;
        elastic.v = 100;

    } 
    // console.log(elastic.tensionLength)

    const tensionKoef = 0.00055;

    const totalDist = distBTOAC + elastic.tensionLength;
    // const totalDist = distBTOAC;

    if (!env.draggedPoint && elastic.tensionLength && distBTOAC > 100) {
        // points[1].x += (0.5 * (middleAC.x - points[1].x))**2 * vxSign / distBTOAC;
        // points[1].y += (0.5 * (middleAC.y - points[1].y))**2 * vySign / distBTOAC;

        const vx = ( (elastic.x - elastic.tx) / elastic.tensionLength ) * totalDist**2;
        const vy = ( (elastic.y - elastic.ty) / elastic.tensionLength ) * totalDist**2;

        points[1].x -= vx * tensionKoef;
        points[1].y -= vy * tensionKoef;
        console.log((elastic.x - elastic.tx) / elastic.tensionLength)
        // elastic.tensionLength -= (elastic.tensionLength / elastic.v);

        // elastic.v -= 1;
    }

*/
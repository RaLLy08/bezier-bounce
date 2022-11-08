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
    drawPoint(x, y, r = 4) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    drawCircle(x, y, r) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    drawText(x, y, text, size=24) {
        this.ctx.font = `${size}px serif`;
        this.ctx.fillText(text, x + 20, y + 20);
    }
}

const canvasEl = document.getElementById("canvas");

const canvas = new Canvas(canvasEl);
const userEvents = new UserEvents(canvasEl);

const displayOptions = {
    showLines: false,
};

const options = {
    koef: 1,
    fadeKoef: 1.07,
    tension: 0.1,
};

const env = {
    mousePressed: false,
    draggedPoint: null,
    positionsFixed: true,
};


const lagrangeInterpolate = (points, x) => {
    let result = 0;

    for (let i = 0; i < points.length; i++) {
        const { x: xi, y: yi } = points[i];

        let li = 1;

        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;

            const { x: xj, y: yj } = points[j];

            li *= (x - xj) / (xi - xj);
        }

        result += li * yi;
    }

    return result;
};

const getBezierPoints = (points, options) => {
    const pointsDensity = 500 ;
    const t = pointsDensity * options.koef;

    const getCurvePoint = (points, t) => {
        if (points.length === 1) {
            return points[0];
        }

        const newPoints = Array(points.length - 1);

        for (let i = 0; i <= newPoints.length - 1; i++) {
            const x = (1 - t) * points[i].x + t * points[i + 1].x;
            const y = (1 - t) * points[i].y + t * points[i + 1].y;

            newPoints[i] = { x, y, t };
        }

        return getCurvePoint(newPoints, t);
    };

    return Array.from({ length: t }, (_, i) => getCurvePoint(points, i / t));
};

const fixedPositions = [
    new Vector(200, 300),
    new Vector(400, 500),
    new Vector(500, 600),
    new Vector(600, 700),
    new Vector(700, 800),
];

const points = [
    {
        fixedPosition: new Vector(200, 300),
        position: new Vector(200, 300),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: { r: 12, text: "A" },
    },
    {   
        fixedPosition: new Vector(200, 500),
        position: new Vector(200, 500),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: {
            text: "B",
            r: 12,
        },
    },
    {
        fixedPosition: new Vector(500, 600),
        position: new Vector(500, 600),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: {
            r: 12,
            text: "C",
        },
    },
    {
        fixedPosition: new Vector(700, 300),
        position: new Vector(700, 300),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: { r: 12, text: "D" },
    },
    {
        fixedPosition: new Vector(700, 100),
        position: new Vector(700, 100),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: { r: 12, text: "E" },
    },
    {
        fixedPosition: new Vector(300, 100),
        position: new Vector(300, 100),
        velocity: new Vector(0, 0),
        acceleration: new Vector(0, 0),
        properties: { r: 12, text: "F" },
    },
];

userEvents.onMousePress = () => {
    changePositions(userEvents)
}

userEvents.onMouseUnpress = () => {
    env.draggedPoint = null;
};
const fixedBezier = [];

const changePositions = (userEvents) => {
    const { syncPressedVelocity, syncPressedPosition, syncPressedPostionFromStart, startPostion } = userEvents;

    const mouseVector = new Vector(syncPressedPosition.x, syncPressedPosition.y);
    
    const bezierPoints = getBezierPoints(
        points.map((el) => el.position),
        options
    );

    if (!env.positionsFixed) {
        fixedBezier.push(...bezierPoints.map(el => ({...el})));
    }
    // let len = 0;

    // for (let i = 0; i < bezierPoints.length - 1; i++) {
    //     const el = bezierPoints[i];
    //     const nextEl = bezierPoints[i + 1];

    //     len += Math.hypot(el.x - nextEl.x, el.y - nextEl.y);
    // }

    points.forEach((point, i) => {
        const mouseNear = new Vector(startPostion.x, startPostion.y).distance(point.position) < point.properties.r;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point;
            env.controlPoints = true;
        }

        if (env.draggedPoint && !env.positionsFixed) {
            env.draggedPoint.fixedPosition = mouseVector;
            env.draggedPoint.position = mouseVector;
        }
    });

    
    if (env.draggedPoint && env.positionsFixed) { 
        const newPosX = env.draggedPoint.fixedPosition.x + syncPressedPostionFromStart.x;
        const newPosY = env.draggedPoint.fixedPosition.y + syncPressedPostionFromStart.y;
    
        const v = new Vector(newPosX - env.draggedPoint.position.x, newPosY - env.draggedPoint.position.y);
    
        env.draggedPoint.position = env.draggedPoint.position.add(v);
    }



    if ((env.draggedPoint && env.controlPoints) || !env.positionsFixed) return;


    if (!env.draggedPoint) {
        bezierPoints.forEach((point, i) => {
            const pointR = 4
            const mouseNear = (startPostion.x - point.x) ** 2 + (startPostion.y - point.y) ** 2 < pointR ** 2;
    
            if (mouseNear) {
                let minPoint = null;
                let minDistance = Infinity;
    
                points.forEach((point2, i, arr) => {
                    const distance =
                        (point.x - point2.position.x) ** 2 +
                        (point.y - point2.position.y) ** 2;
    
                    if (distance < minDistance && i !== 0 && i !== arr.length - 1) {
                        minDistance = distance;
                        minPoint = point2;
                        minPointIndex = i;
                    }
                });
    
                env.draggedPoint = minPoint;
                env.controlPoints = false;
            }
    
        });
    }

    if (env.draggedPoint) {
        env.draggedPoint.position = env.draggedPoint.fixedPosition.add(syncPressedPostionFromStart)
    }
};


const drawPoint = (point = {}) => {
    if (point.hide) return;

    canvas.drawPoint(point.x, point.y, point.r);
    point.text && canvas.drawText(point.x, point.y, point.text, point.textSize);
};

const drawPoints = (points) => {
    points.forEach(drawPoint);
};


const elastic = {
    v: 100,
    tensionLength: 0,
};

const toRadians = (amplitude, maxAmplitude) => {
    amplitude = amplitude % maxAmplitude;

    return (amplitude * 2 * Math.PI) / maxAmplitude;
};

const roundBy = (number, roundBy) => {
    return Math.round(number / roundBy) * roundBy;
};

const getSpringEffect = (point, anchorVector, fade = 1, tension = 0.1) => {
    const ellasticForce = point.position
        .sub(anchorVector)
        .scaleBy(tension)
        .negate();

    return {
        acceleration: ellasticForce,
        velocity: point.velocity.scaleBy(1 / fade),
    };
};

const frame = () => {
    canvas.clear();
    window.requestAnimationFrame(frame);

    userEvents.sync();

    drawPoints(points.map((el) => ({ ...el.position, ...el.properties })));
    drawPoints(
        getBezierPoints(
            points.map((el) => el.position),
            options
        )
    );
    if (env.draggedPoint) return


    points.forEach(point => {

        point.velocity = point.velocity.add(point.acceleration);
        point.position = point.position.add(point.velocity);
    })

    if (!env.positionsFixed) return;


    for (let i = 0; i < points.length; i++) {
        const point = points[i];

        const { acceleration, velocity } = getSpringEffect(
            point,
            point.fixedPosition,
            options.fadeKoef,
            options.tension
        );

        point.velocity = velocity;
        point.acceleration = acceleration;
    }

};

frame();

step.oninput = (e) => {
    options.koef = e.target.value;

    step_label.innerHTML = "Step: " + e.target.value;
};

step.value = options.koef;
step_label.innerHTML = "Step: " + options.koef;

point_positions_btn.onclick = () => {
    env.positionsFixed = !env.positionsFixed;


    if (!env.positionsFixed) {
        points.forEach((point, i) => {
            point.velocity = new Vector(0, 0);
            point.acceleration = new Vector(0, 0);
        });
    }

    point_positions_btn.innerHTML = !env.positionsFixed
        ? "Lock points"
        : "Unlock points";
};

show_lines.onchange = (e) => {
    displayOptions.showLines = e.target.checked;
};

tension_koef.oninput = (e) => {
    options.tension = e.target.value;
    tension_koef_label.innerHTML = "Tension koef: " + e.target.value;
};
tension_koef_label.innerHTML = "Tension koef: " + options.tension;

fade_koef.oninput = (e) => {
    options.fadeKoef = +e.target.value || 1;
    fade_koef_label.innerHTML = "Fade koef: " + e.target.value;
};
fade_koef_label.innerHTML = "Fade koef: " + options.fadeKoef;

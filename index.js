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
    drawText(x, y, text) {
        this.ctx.font = "24px serif";
        this.ctx.fillText(text, x + 20, y + 20);
    }
}

const canvasEl = document.getElementById("canvas");

const canvas = new Canvas(canvasEl);


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

    return Array.from({ length: t }, (_, i) =>
        getCurvePoint(points, i / t)
    );
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
            hide: false,
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
const test = {
    x: 0,
    y: 0,
    r: 4
}
canvasEl.onmousemove = (e) => {
    changePositions(e.offsetX, e.offsetY);
};

canvasEl.ontouchmove = (e) => {
    changePositions(e.touches[0].clientX, e.touches[0].clientY);
};

const changePositions = (x, y) => {
    if (!env.mousePressed) return;

    const p = getBezierPoints(
        points.map((el) => el.position),
        options
    );

    points.forEach((point, i) => {
        // if (env.draggedCurvePoint) return;

        const mouseNear =
            (x - point.position.x) ** 2 + (y - point.position.y) ** 2 <
            (point.properties.r + 20) ** 2;

        if (mouseNear && !env.draggedPoint) {
            env.draggedPoint = point;
            env.controlPoints = true;
        }

        if (env.draggedPoint) {
            if (env.positionsFixed) {
                env.draggedPoint.fixedPosition.x = x;
                env.draggedPoint.fixedPosition.y = y;
            }

            env.draggedPoint.position.x = x;
            env.draggedPoint.position.y = y;
        }
    });

    if ((env.draggedPoint && env.controlPoints) || env.positionsFixed) return;

    p.forEach((point) => {
        const mouseNear = (x - point.x) ** 2 + (y - point.y) ** 2 < 30 ** 2;

        if (mouseNear && !env.draggedPoint) {
            let minPoint = null;
            let minDistance = Infinity;

            points.forEach((point2, i, arr) => {
                const distance =
                    (point.x - point2.position.x) ** 2 +
                    (point.y - point2.position.y) ** 2;

                if (distance < minDistance && i !== 0 && i !== arr.length - 1) {
                    minDistance = distance;
                    env.draggedCurvePoint = point;
                    minPoint = point2;
                    minPointIndex = i;
                }
            });

            env.draggedPoint = minPoint;
            env.controlPoints = false;
        }

        if (env.draggedPoint) {
            // const { x, y, t } = env.draggedCurvePoint;
  
            // const ut = (1 - t**2) / (t**2 + (1 - t)**2)

            // const cx = ut*points[0].position.x + (1 - ut) * points[2].position.x;
            // const cy = ut*points[0].position.y + (1 - ut) * points[2].position.y;


            // test.x = ( x - points[0].position.x * (1 - t)**2 - points[2].position.x * t**2 ) / (2 * t);
            // test.y = ( y - points[0].position.y * (1 - t)**2 - points[2].position.y * t**2 ) / (2 * t);

            env.draggedPoint.position.x =
                x -
                (env.startPositionX - env.draggedPoint.fixedPosition.x);
            env.draggedPoint.position.y =
                y -
                (env.startPositionY - env.draggedPoint.fixedPosition.y);
        }
    });
};

canvasEl.onmousedown = (e) => {
    env.mousePressed = true;
    env.startPositionX = e.offsetX;
    env.startPositionY = e.offsetY;
};

canvasEl.ontouchstart = (e) => {
    env.mousePressed = true;
};

canvasEl.onmouseup = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
};

canvasEl.ontouchend = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
};

canvasEl.onmouseleave = (e) => {
    env.mousePressed = false;
    env.draggedPoint = null;
};

const drawPoint = (point = {}) => {
    if (point.hide) return;

    canvas.drawPoint(point.x, point.y, point.r);
    point.text && canvas.drawText(point.x, point.y, point.text);
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
    drawPoint(test)
    drawPoints(points.map((el) => ({ ...el.position, ...el.properties })));
    drawPoints(
        getBezierPoints(
            points.map((el) => el.position),
            options
        )
    );


    points.forEach(point => {
        if (env.draggedPoint === point) return

        point.velocity = point.velocity.add(point.acceleration);
        point.position = point.position.add(point.velocity);
    })

    if (env.positionsFixed) return;


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
    point_positions_btn.innerHTML = env.positionsFixed
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

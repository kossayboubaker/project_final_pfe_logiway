function clamp01(x) {
    return Math.min(1, Math.max(0, x));
}

export function makeCubicBezierEasing(x1, y1, x2, y2) {
    // P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)

    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    function xOfT(t) {
        return ((ax * t + bx) * t + cx) * t;
    }

    function yOfT(t) {
        return ((ay * t + by) * t + cy) * t;
    }

    function dxdt(t) {
        return (3 * ax * t + 2 * bx) * t + cx;
    }

    function solveTForX(x) {
        // Newton-Raphson
        let t = x;
        for (let i = 0; i < 8; i++) {
            const f = xOfT(t) - x;
            const d = dxdt(t);
            if (Math.abs(f) < 1e-7) {return t;}
            if (Math.abs(d) < 1e-7) {break;}
            t -= f / d;
        }
        // Bisection fallback
        let lo = 0,
            hi = 1;
        t = x;
        for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            const xm = xOfT(mid);
            if (Math.abs(xm - x) < 1e-7) {return mid;}
            if (xm < x) {lo = mid;} else {hi = mid;}
        }
        return (lo + hi) / 2;
    }

    return (x) => {
        const clampedX = clamp01(x);
        if (clampedX === 0 || clampedX === 1) {return clampedX;}
        const t = solveTForX(clampedX);
        return yOfT(t);
    };
}

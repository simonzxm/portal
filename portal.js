/**
 * Portal Ring Layout — asymmetric variant
 * Places items on a tilted, off-center elliptical arc with
 * non-uniform spacing so the result looks hand-placed.
 */
(function () {
    const MOBILE_BP = 768;

    // Deterministic pseudo-random from index (stable across resizes)
    function hash(i) {
        let h = i * 2654435761 >>> 0;
        return (h & 0xffff) / 0xffff;          // 0..1
    }

    function layout() {
        const items = document.querySelectorAll('.ring .node, .ring .footer');
        if (!items.length) return;

        if (window.innerWidth <= MOBILE_BP) {
            items.forEach(el => { el.style.top = ''; el.style.left = ''; });
            return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // ---- Asymmetry knobs ----
        // Ellipse center shifted slightly right & down (title is above)
        const cx = vw * 0.48;
        const cy = vh * 0.50;

        // Different horizontal / vertical radii
        const rx = vw * 0.33;
        const ry = vh * 0.28;

        // Tilt the entire ellipse ~8° clockwise
        const tilt = 8 * Math.PI / 180;

        // Arc: skip the TOP portion (~85°) — gap faces upward
        const gapDeg    = 85;
        const gapRad    = gapDeg * Math.PI / 180;
        const arcSpan   = 2 * Math.PI - gapRad;
        // Start just past the gap on the upper-right, sweep clockwise
        // -π/2 is top-dead-center; offset half the gap to the right
        const startAngle = -Math.PI / 2 + gapRad / 2;

        const count = items.length;

        // Non-uniform spacing: pre-compute "weight" per slot
        // so gaps between items vary by ~±30 %
        const weights = [];
        for (let i = 0; i < count; i++) {
            weights.push(0.7 + hash(i + 3) * 0.3);   // 0.7 – 1.0
        }
        const wSum = weights.reduce((a, b) => a + b, 0);

        // Cumulative parameter values
        const cum = [0];
        for (let i = 0; i < count; i++) {
            cum.push(cum[i] + weights[i] / wSum);
        }

        items.forEach((el, i) => {
            // t ∈ [0, 1] — non-uniform position on the arc
            const t = (cum[i] + cum[i + 1]) / 2;      // centre of this slot
            const angle = startAngle + arcSpan * t;

            // Ellipse point before tilt
            const ex = rx * Math.cos(angle);
            const ey = ry * Math.sin(angle);

            // Apply tilt rotation
            const cosT = Math.cos(tilt);
            const sinT = Math.sin(tilt);
            const px = cx + ex * cosT - ey * sinT;
            const py = cy + ex * sinT + ey * cosT;

            // Per-item jitter (±22 px horizontal, ±16 px vertical)
            const jx = (hash(i * 7 + 1) - 0.5) * 44;
            const jy = (hash(i * 7 + 2) - 0.5) * 32;

            const rect = el.getBoundingClientRect();
            el.style.left = (px + jx - rect.width  / 2) + 'px';
            el.style.top  = (py + jy - rect.height / 2) + 'px';
        });
    }

    let timer;
    window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(layout, 80);
    });

    if (document.readyState === 'complete') {
        layout();
    } else {
        window.addEventListener('load', layout);
    }
})();

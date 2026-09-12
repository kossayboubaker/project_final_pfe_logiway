import * as easingFunctions from './easing-functions';
import { limitValue, now } from '../util';
import { animationFrame, Class } from '../common';
import AnimationFactory from './animation-factory';
import { makeCubicBezierEasing } from './motion';

const defaultOptions = {
    duration: 500,
    easing: 'swing'
};

class Animation extends Class {
    static create(type, element, options) {
        return AnimationFactory.current.create(type, element, options);
    }

    get options() {
        return this._options || defaultOptions;
    }

    set options(value) {
        this._options = value;
    }

    constructor(element, options) {
        super();

        this.options = Object.assign({}, this.options, options);
        this.element = element;
    }

    setup() {}
    step() {}

    play() {
        const options = this.options;

        if (typeof options.easing === 'string' && easingFunctions[options.easing]) {
            options.easing = easingFunctions[options.easing];
        } else if (Array.isArray(options.easing) && options.easing.length === 4) {
            options.easing = makeCubicBezierEasing(...options.easing);
        } else {
            options.easing = easingFunctions[defaultOptions.easing];
        }

        const { duration, delay = 0, easing } = options;
        const start = now() + delay;
        const finish = start + duration;

        if (duration === 0) {
            this.step(1);
            this.abort();
        } else {
            setTimeout(() => {
                const loop = () => {
                    if (this._stopped) {
                        return;
                    }

                    const wallTime = now();

                    const time = limitValue(wallTime - start, 0, duration);
                    const eased = easing(time / duration);

                    this.step(eased);

                    if (wallTime < finish) {
                        animationFrame(loop);
                    } else {
                        this.abort();
                    }
                };

                loop();
            }, delay);
        }
    }

    abort() {
        this._stopped = true;
    }

    destroy() {
        this.abort();
    }
}

export default Animation;

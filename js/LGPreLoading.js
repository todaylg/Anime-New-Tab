'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

var Grad = function () {
    function Grad(x, y, z) {
        _classCallCheck(this, Grad);

        this.x = x;this.y = y;this.z = z;
    }

    _createClass(Grad, [{
        key: 'dot2',
        value: function dot2(x, y) {
            return this.x * x + this.y * y;
        }
    }, {
        key: 'dot3',
        value: function dot3(x, y, z) {
            return this.x * x + this.y * y + this.z * z;
        }
    }]);

    return Grad;
}();

var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
// To remove the need for index wrapping, double the permutation table length
var perm = new Array(512);
var gradP = new Array(512);

// This isn't a very good seeding function, but it works ok. It supports 2^16
// different seed values. Write something better if you need more seeds.

/*
for(let i=0; i<256; i++) {
  perm[i] = perm[i + 256] = p[i];
  gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
}*/

// Skewing and unskewing factors for 2, 3, and 4 dimensions
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;

var F3 = 1 / 3;
var G3 = 1 / 6;

var Noise = function () {
    function Noise() {
        _classCallCheck(this, Noise);
    }

    _createClass(Noise, [{
        key: 'seed',
        value: function seed(_seed) {
            if (_seed > 0 && _seed < 1) {
                // Scale the seed out
                _seed *= 65536;
            }

            _seed = Math.floor(_seed);
            if (_seed < 256) {
                _seed |= _seed << 8;
            }

            for (var i = 0; i < 256; i++) {
                var v = void 0;
                if (i & 1) {
                    v = p[i] ^ _seed & 255;
                } else {
                    v = p[i] ^ _seed >> 8 & 255;
                }

                perm[i] = perm[i + 256] = v;
                gradP[i] = gradP[i + 256] = grad3[v % 12];
            }
        }
        // 2D simplex noise

    }, {
        key: 'simplex2',
        value: function simplex2(xin, yin) {
            var n0 = void 0,
                n1 = void 0,
                n2 = void 0; // Noise contributions from the three corners
            // Skew the input space to determine which simplex cell we're in
            var s = (xin + yin) * F2; // Hairy factor for 2D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var t = (i + j) * G2;
            var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
            var y0 = yin - j + t;
            // For the 2D case, the simplex shape is an equilateral triangle.
            // Determine which simplex we are in.
            var i1 = void 0,
                j1 = void 0; // Offsets for second (middle) corner of simplex in (i,j) coords
            if (x0 > y0) {
                // lower triangle, XY order: (0,0)->(1,0)->(1,1)
                i1 = 1;j1 = 0;
            } else {
                // upper triangle, YX order: (0,0)->(0,1)->(1,1)
                i1 = 0;j1 = 1;
            }
            // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
            // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
            // c = (3-sqrt(3))/6
            var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
            var y1 = y0 - j1 + G2;
            var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
            var y2 = y0 - 1 + 2 * G2;
            // Work out the hashed gradient indices of the three simplex corners
            i &= 255;
            j &= 255;
            var gi0 = gradP[i + perm[j]];
            var gi1 = gradP[i + i1 + perm[j + j1]];
            var gi2 = gradP[i + 1 + perm[j + 1]];
            // Calculate the contribution from the three corners
            var t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) {
                n0 = 0;
            } else {
                t0 *= t0;
                n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
            }
            var t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) {
                n1 = 0;
            } else {
                t1 *= t1;
                n1 = t1 * t1 * gi1.dot2(x1, y1);
            }
            var t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) {
                n2 = 0;
            } else {
                t2 *= t2;
                n2 = t2 * t2 * gi2.dot2(x2, y2);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 70 * (n0 + n1 + n2);
        }
        // 3D simplex noise

    }, {
        key: 'simplex3',
        value: function simplex3(xin, yin, zin) {
            var n0 = void 0,
                n1 = void 0,
                n2 = void 0,
                n3 = void 0; // Noise contributions from the four corners

            // Skew the input space to determine which simplex cell we're in
            var s = (xin + yin + zin) * F3; // Hairy factor for 2D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var k = Math.floor(zin + s);

            var t = (i + j + k) * G3;
            var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
            var y0 = yin - j + t;
            var z0 = zin - k + t;

            // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
            // Determine which simplex we are in.
            var i1 = void 0,
                j1 = void 0,
                k1 = void 0; // Offsets for second corner of simplex in (i,j,k) coords
            var i2 = void 0,
                j2 = void 0,
                k2 = void 0; // Offsets for third corner of simplex in (i,j,k) coords
            if (x0 >= y0) {
                if (y0 >= z0) {
                    i1 = 1;j1 = 0;k1 = 0;i2 = 1;j2 = 1;k2 = 0;
                } else if (x0 >= z0) {
                    i1 = 1;j1 = 0;k1 = 0;i2 = 1;j2 = 0;k2 = 1;
                } else {
                    i1 = 0;j1 = 0;k1 = 1;i2 = 1;j2 = 0;k2 = 1;
                }
            } else {
                if (y0 < z0) {
                    i1 = 0;j1 = 0;k1 = 1;i2 = 0;j2 = 1;k2 = 1;
                } else if (x0 < z0) {
                    i1 = 0;j1 = 1;k1 = 0;i2 = 0;j2 = 1;k2 = 1;
                } else {
                    i1 = 0;j1 = 1;k1 = 0;i2 = 1;j2 = 1;k2 = 0;
                }
            }
            // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
            // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
            // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
            // c = 1/6.
            var x1 = x0 - i1 + G3; // Offsets for second corner
            var y1 = y0 - j1 + G3;
            var z1 = z0 - k1 + G3;

            var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
            var y2 = y0 - j2 + 2 * G3;
            var z2 = z0 - k2 + 2 * G3;

            var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
            var y3 = y0 - 1 + 3 * G3;
            var z3 = z0 - 1 + 3 * G3;

            // Work out the hashed gradient indices of the four simplex corners
            i &= 255;
            j &= 255;
            k &= 255;
            var gi0 = gradP[i + perm[j + perm[k]]];
            var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
            var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
            var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

            // Calculate the contribution from the four corners
            var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 < 0) {
                n0 = 0;
            } else {
                t0 *= t0;
                n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
            }
            var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 < 0) {
                n1 = 0;
            } else {
                t1 *= t1;
                n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
            }
            var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 < 0) {
                n2 = 0;
            } else {
                t2 *= t2;
                n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
            }
            var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 < 0) {
                n3 = 0;
            } else {
                t3 *= t3;
                n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 32 * (n0 + n1 + n2 + n3);
        }
    }, {
        key: 'perlin2',
        value: function perlin2(x, y) {
            // Find unit grid cell containing point
            var X = Math.floor(x),
                Y = Math.floor(y);
            // Get relative xy coordinates of point within that cell
            x = x - X;y = y - Y;
            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255;Y = Y & 255;

            // Calculate noise contributions from each of the four corners
            var n00 = gradP[X + perm[Y]].dot2(x, y);
            var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
            var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
            var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

            // Compute the fade curve value for x
            var u = fade(x);

            // Interpolate the four results
            return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
        }
    }, {
        key: 'perlin3',
        value: function perlin3(x, y, z) {
            // Find unit grid cell containing point
            var X = Math.floor(x),
                Y = Math.floor(y),
                Z = Math.floor(z);
            // Get relative xyz coordinates of point within that cell
            x = x - X;y = y - Y;z = z - Z;
            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255;Y = Y & 255;Z = Z & 255;

            // Calculate noise contributions from each of the eight corners
            var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
            var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
            var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
            var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
            var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
            var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
            var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
            var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

            // Compute the fade curve value for x, y, z
            var u = fade(x);
            var v = fade(y);
            var w = fade(z);

            // Interpolate
            return lerp(lerp(lerp(n000, n100, u), lerp(n001, n101, u), w), lerp(lerp(n010, n110, u), lerp(n011, n111, u), w), v);
        }
    }]);

    return Noise;
}();

new Noise().seed(0);

var TAU = 2 * Math.PI;
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}
function parabola(x, k) {
    return Math.pow(4 * x * (1 - x), k);
}

function pointInEllipse(a, b, theta, t) {
    //r*cos(A+B) = r*[cos(A)Cos(B) - sin(A)sin(B)]
    //https://www.quora.com/How-is-x-x-cos-theta-+-y-sin-theta  
    var x = a * Math.cos(t * TAU) * Math.cos(theta) - b * Math.sin(t * TAU) * Math.sin(theta);
    var y = a * Math.cos(t * TAU) * Math.sin(theta) + b * Math.sin(t * TAU) * Math.cos(theta);
    return { x: x, y: y };
}

// r: radius
// theta: 0-Pi
// phi: 0-Tau
function sphericalToCartesian(r, theta, phi) {
    var x = r * Math.sin(theta) * Math.cos(phi);
    var y = r * Math.sin(theta) * Math.sin(phi);
    var z = r * Math.cos(theta);
    return { x: x, y: y, z: z };
}

function cartesianToSpherical(x, y, z) {
    var r = Math.sqrt(x * x + y * y + z * z);
    var theta = Math.acos(z / r);
    var phi = Math.atan2(y, x);
    return { r: r, theta: theta, phi: phi };
}

var loadingTextArr = ['L', 'O', 'A', 'D', 'I', 'N', 'G'];

var LGPreLoading = function () {
    function LGPreLoading(canvas) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, LGPreLoading);

        this.canvas = canvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.context = canvas.getContext('2d');
        this.RADIUS = .6 * this.canvas.width;
        this.fontSize = 24;
        this.endFlag = false;
        this.startTime = performance.now();
        this.textStartTime = performance.now();
        this.textFadeTime = opts.textFadeTime || .08;
        this.loopDuration = opts.loopDuration || 2.5;
        this.circleNum = opts.circleNum || 25;
        this.circles = [];
        this.init();
    }

    _createClass(LGPreLoading, [{
        key: 'init',
        value: function init() {
            var _this = this;

            var noise = new Noise();
            noise.seed(0);
            for (var j = 0; j < this.circleNum; j++) {
                var a = randomInRange(.3, .9);
                var b = randomInRange(.3, .9);
                var theta = randomInRange(0, TAU);
                var offset = randomInRange(0, 1);
                var thickness = randomInRange(2, 6); //虚线粗细
                this.circles.push({ a: a, b: b, theta: theta, offset: offset, thickness: thickness });
            }

            var update = function update() {
                _this.draw();
                requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        }
    }, {
        key: 'finish',
        value: function finish(callback) {
            this.callback = callback;
            this.endFlag = true;
        }
    }, {
        key: 'drawEllipse',
        value: function drawEllipse(x, y, a, b, theta, s, e) {
            var context = this.context;
            context.save();
            context.translate(-x, -y);

            var path = new Path2D();
            var p0 = pointInEllipse(a, b, theta, s); //线起点
            path.moveTo(p0.x, p0.y);
            for (var tt = s; tt < s + e; tt += .01) {
                //s+e（start\end）决定画多少弧度
                var _p = pointInEllipse(a, b, theta, tt);
                path.lineTo(_p.x, _p.y); //线终点
            }

            context.strokeStyle = '#fff';
            context.stroke(path);

            context.restore();
        }
    }, {
        key: 'draw',
        value: function draw() {
            var _this2 = this;

            var nowTime = performance.now();
            var context = this.context;
            //Black BG
            context.fillStyle = '#000';
            context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            var time = .001 * (nowTime - this.startTime) % this.loopDuration;
            var t = time / this.loopDuration;
            context.save();
            //Text
            context.strokeStyle = '#FFF';
            context.globalAlpha = parabola(t, 1);
            context.font = this.fontSize + 'px caption';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            var arrLength = loadingTextArr.length;
            if (this.endFlag && arrLength > 2) {
                if (.001 * (nowTime - this.textStartTime) > this.textFadeTime) {
                    this.textStartTime = nowTime;
                    loadingTextArr.splice(Math.floor(arrLength / 2), 1);
                }
            } else if (arrLength === 2) {
                context.globalAlpha = 1;
                //Effect1
                if (this.RADIUS < 2 * this.canvas.width || this.RADIUS < 2 * this.canvas.height) {
                    this.RADIUS += 60;
                } else {
                    context.globalAlpha = 0;
                    typeof this.callback === 'function' && this.callback();
                    this.callback = null;
                }
                //Effect2
            }
            var LoadingText = loadingTextArr.join('');
            //context.strokeText(LoadingText, this.canvasWidth / 2, this.canvasHeight / 2);

            context.translate(.5 * this.canvasWidth, .5 * this.canvasHeight);
            context.strokeStyle = '#fff';
            context.globalAlpha = .5;
            context.globalCompositeOperation = 'lighten'; //叠加

            context.setLineDash([8, 4]); //虚线
            context.lineDashOffset = 4; //起始偏移
            context.lineWidth = 10;

            this.circles.forEach(function (c) {
                var tt = (t + c.offset) % 1;
                context.lineWidth = c.thickness * (1 + parabola(tt, 4)); //粗细由抛物线决定
                _this2.drawEllipse(0, 0, c.a * _this2.RADIUS, c.a * _this2.RADIUS, c.theta - tt * TAU, 0, .5 + .5 * Math.sin(tt * TAU));
            });

            context.restore();
        }
    }]);

    return LGPreLoading;
}();
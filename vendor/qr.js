(function (global) {
  'use strict';

  var TOTAL_CW = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

  var EC_CW_PER_BLOCK = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
    Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
    H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28]
  };

  var BLOCKS = {
    L: [null, [1,19,0,0], [1,34,0,0], [1,55,0,0], [1,80,0,0], [1,108,0,0], [2,68,0,0], [2,78,0,0], [2,97,0,0], [2,116,0,0], [2,68,2,69]],
    M: [null, [1,16,0,0], [1,28,0,0], [1,44,0,0], [2,32,0,0], [2,43,0,0], [4,27,0,0], [4,31,0,0], [2,38,2,39], [3,36,2,37], [4,43,1,44]],
    Q: [null, [1,13,0,0], [1,22,0,0], [2,17,0,0], [2,24,0,0], [2,15,2,16], [4,19,0,0], [2,14,4,15], [4,18,2,19], [4,16,4,17], [6,19,2,20]],
    H: [null, [1,9,0,0], [1,16,0,0], [2,13,0,0], [4,9,0,0], [2,11,2,12], [4,15,0,0], [4,13,1,14], [4,14,2,15], [4,12,4,13], [6,15,2,16]]
  };

  var ALIGN_POS = [
    null, [], [6,18], [6,22], [6,26], [6,30], [6,34],
    [6,22,38], [6,24,42], [6,26,46], [6,28,50]
  ];

  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function rsGenPoly(degree) {
    var poly = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(poly.length + 1);
      for (var k = 0; k < next.length; k++) next[k] = 0;
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var res = data.slice();
    for (var i = 0; i < ecLen; i++) res.push(0);
    for (var i2 = 0; i2 < data.length; i2++) {
      var coef = res[i2];
      if (coef !== 0) {
        for (var j = 0; j < gen.length; j++) {
          res[i2 + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return res.slice(data.length);
  }

  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) {
        out.push(c);
      } else if (c < 0x800) {
        out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      } else if (c < 0xD800 || c >= 0xE000) {
        out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      } else {
        i++;
        var cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      }
    }
    return out;
  }

  function BitBuf() {
    this.bits = [];
  }
  BitBuf.prototype.put = function (val, len) {
    for (var i = len - 1; i >= 0; i--) this.bits.push((val >> i) & 1);
  };
  BitBuf.prototype.length = function () { return this.bits.length; };

  function pickVersion(byteLen, ecl) {
    for (var v = 1; v <= 10; v++) {
      var ccBits = v < 10 ? 8 : 16;
      var needed = 4 + ccBits + byteLen * 8;
      var bs = BLOCKS[ecl][v];
      var numBlocks = bs[0] + bs[2];
      var ecPerBlock = EC_CW_PER_BLOCK[ecl][v];
      var totalEc = numBlocks * ecPerBlock;
      var dataCw = TOTAL_CW[v] - totalEc;
      if (needed <= dataCw * 8) return v;
    }
    throw new Error('Data too large for QR version 10');
  }

  function buildCodewords(text, ecl) {
    var bytes = utf8Bytes(text);
    var ver = pickVersion(bytes.length, ecl);
    var bs = BLOCKS[ecl][ver];
    var numBlocks = bs[0] + bs[2];
    var ecPerBlock = EC_CW_PER_BLOCK[ecl][ver];
    var totalEc = numBlocks * ecPerBlock;
    var dataCw = TOTAL_CW[ver] - totalEc;
    var dataBits = dataCw * 8;

    var bb = new BitBuf();
    bb.put(4, 4);
    bb.put(bytes.length, ver < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) bb.put(bytes[i], 8);

    var rem = dataBits - bb.length();
    bb.put(0, Math.min(4, rem));
    while (bb.length() % 8 !== 0) bb.bits.push(0);
    var pad = [0xEC, 0x11], pi = 0;
    while (bb.length() < dataBits) {
      bb.put(pad[pi], 8);
      pi = 1 - pi;
    }

    var cws = [];
    for (var b = 0; b < dataCw; b++) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | bb.bits[b * 8 + k];
      cws.push(byte);
    }

    var blocks = [];
    var ecBlocks = [];
    var idx = 0;
    for (var g = 0; g < 2; g++) {
      var count = bs[g * 2];
      var len = bs[g * 2 + 1];
      for (var nb = 0; nb < count; nb++) {
        var data = cws.slice(idx, idx + len);
        idx += len;
        blocks.push(data);
        ecBlocks.push(rsEncode(data, ecPerBlock));
      }
    }

    var maxDataLen = 0;
    for (var bi = 0; bi < blocks.length; bi++) if (blocks[bi].length > maxDataLen) maxDataLen = blocks[bi].length;

    var interleaved = [];
    for (var col = 0; col < maxDataLen; col++) {
      for (var bi2 = 0; bi2 < blocks.length; bi2++) {
        if (col < blocks[bi2].length) interleaved.push(blocks[bi2][col]);
      }
    }
    for (var col2 = 0; col2 < ecPerBlock; col2++) {
      for (var bi3 = 0; bi3 < ecBlocks.length; bi3++) {
        interleaved.push(ecBlocks[bi3][col2]);
      }
    }

    return { version: ver, ecl: ecl, codewords: interleaved };
  }

  function makeMatrix(size) {
    var m = new Array(size);
    for (var r = 0; r < size; r++) {
      m[r] = new Array(size);
      for (var c = 0; c < size; c++) m[r][c] = null;
    }
    return m;
  }

  function placeFinder(m, r, c) {
    var size = m.length;
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        var onEdge = (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        var inCenter = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        var inFinder = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6);
        if (inFinder && (onEdge || inCenter)) m[rr][cc] = true;
        else m[rr][cc] = false;
      }
    }
  }

  function placeAlignment(m, r, c) {
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        var isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
        var isCenter = dr === 0 && dc === 0;
        m[r + dr][c + dc] = isEdge || isCenter;
      }
    }
  }

  function isReserved(m, r, c) {
    return m[r][c] !== null;
  }

  function placeFunctionPatterns(m, version) {
    var size = m.length;
    placeFinder(m, 0, 0);
    placeFinder(m, 0, size - 7);
    placeFinder(m, size - 7, 0);

    for (var i = 8; i < size - 8; i++) {
      m[6][i] = (i % 2 === 0);
      m[i][6] = (i % 2 === 0);
    }

    var ap = ALIGN_POS[version];
    for (var a = 0; a < ap.length; a++) {
      for (var b = 0; b < ap.length; b++) {
        var ar = ap[a], ac = ap[b];
        if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
        placeAlignment(m, ar, ac);
      }
    }

    m[4 * version + 9][8] = true;

    for (var k = 0; k <= 8; k++) {
      if (m[8][k] === null) m[8][k] = false;
      if (m[k][8] === null) m[k][8] = false;
    }
    for (var k2 = 0; k2 < 8; k2++) {
      if (m[8][size - 1 - k2] === null) m[8][size - 1 - k2] = false;
      if (m[size - 1 - k2][8] === null) m[size - 1 - k2][8] = false;
    }

    if (version >= 7) {
      for (var r2 = 0; r2 < 6; r2++) {
        for (var c2 = 0; c2 < 3; c2++) {
          m[r2][size - 11 + c2] = false;
          m[size - 11 + c2][r2] = false;
        }
      }
    }
  }

  function cloneMatrix(m) {
    var size = m.length;
    var out = new Array(size);
    for (var r = 0; r < size; r++) out[r] = m[r].slice();
    return out;
  }

  function placeData(m, reserved, codewords) {
    var size = m.length;
    var bitIdx = 0;
    var totalBits = codewords.length * 8;
    var dir = -1;
    var row = size - 1;
    var col = size - 1;
    while (col > 0) {
      if (col === 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          var cc = col - c;
          if (!reserved[row][cc]) {
            var bit = 0;
            if (bitIdx < totalBits) {
              var cw = codewords[bitIdx >> 3];
              bit = (cw >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            m[row][cc] = bit === 1;
          }
        }
        row += dir;
        if (row < 0 || row >= size) {
          dir = -dir;
          row += dir;
          col -= 2;
          break;
        }
      }
    }
  }

  function applyMask(m, reserved, pattern) {
    var size = m.length;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (reserved[r][c]) continue;
        var mask;
        switch (pattern) {
          case 0: mask = (r + c) % 2 === 0; break;
          case 1: mask = r % 2 === 0; break;
          case 2: mask = c % 3 === 0; break;
          case 3: mask = (r + c) % 3 === 0; break;
          case 4: mask = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
          case 5: mask = ((r * c) % 2) + ((r * c) % 3) === 0; break;
          case 6: mask = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
          case 7: mask = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        }
        if (mask) m[r][c] = !m[r][c];
      }
    }
  }

  function penalty(m) {
    var size = m.length;
    var score = 0;
    for (var r = 0; r < size; r++) {
      var runC = 1, runR = 1;
      for (var c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) {
          runC++;
        } else {
          if (runC >= 5) score += 3 + (runC - 5);
          runC = 1;
        }
        if (m[c][r] === m[c - 1][r]) {
          runR++;
        } else {
          if (runR >= 5) score += 3 + (runR - 5);
          runR = 1;
        }
      }
      if (runC >= 5) score += 3 + (runC - 5);
      if (runR >= 5) score += 3 + (runR - 5);
    }
    for (var r2 = 0; r2 < size - 1; r2++) {
      for (var c2 = 0; c2 < size - 1; c2++) {
        var v = m[r2][c2];
        if (v === m[r2][c2 + 1] && v === m[r2 + 1][c2] && v === m[r2 + 1][c2 + 1]) score += 3;
      }
    }
    var pat1 = [true, false, true, true, true, false, true, false, false, false, false];
    var pat2 = [false, false, false, false, true, false, true, true, true, false, true];
    for (var r3 = 0; r3 < size; r3++) {
      for (var c3 = 0; c3 <= size - 11; c3++) {
        var ok1 = true, ok2 = true, ok3 = true, ok4 = true;
        for (var k = 0; k < 11; k++) {
          if (m[r3][c3 + k] !== pat1[k]) ok1 = false;
          if (m[r3][c3 + k] !== pat2[k]) ok2 = false;
          if (m[c3 + k][r3] !== pat1[k]) ok3 = false;
          if (m[c3 + k][r3] !== pat2[k]) ok4 = false;
        }
        if (ok1) score += 40;
        if (ok2) score += 40;
        if (ok3) score += 40;
        if (ok4) score += 40;
      }
    }
    var dark = 0, total = size * size;
    for (var r4 = 0; r4 < size; r4++) for (var c4 = 0; c4 < size; c4++) if (m[r4][c4]) dark++;
    var pct = (dark * 100) / total;
    var k1 = Math.abs(pct - 50);
    score += Math.floor(k1 / 5) * 10;
    return score;
  }

  function bchFormat(data) {
    var d = data << 10;
    var g = 0x537;
    for (var i = 14; i >= 10; i--) {
      if ((d >> i) & 1) d ^= g << (i - 10);
    }
    return ((data << 10) | d) ^ 0x5412;
  }

  function bchVersion(data) {
    var d = data << 12;
    var g = 0x1F25;
    for (var i = 17; i >= 12; i--) {
      if ((d >> i) & 1) d ^= g << (i - 12);
    }
    return (data << 12) | d;
  }

  function placeFormat(m, ecl, mask) {
    var size = m.length;
    var eclBits = { L: 1, M: 0, Q: 3, H: 2 }[ecl];
    var fmt = bchFormat((eclBits << 3) | mask);
    for (var i = 0; i < 15; i++) {
      var bit = ((fmt >> i) & 1) === 1;
      if (i < 6) m[i][8] = bit;
      else if (i < 8) m[i + 1][8] = bit;
      else if (i < 9) m[8][7] = bit;
      else m[8][14 - i] = bit;
    }
    for (var j = 0; j < 15; j++) {
      var bit2 = ((fmt >> j) & 1) === 1;
      if (j < 8) m[8][size - 1 - j] = bit2;
      else m[size - 15 + j][8] = bit2;
    }
    m[size - 8][8] = true;
  }

  function placeVersion(m, version) {
    if (version < 7) return;
    var size = m.length;
    var v = bchVersion(version);
    for (var i = 0; i < 18; i++) {
      var bit = ((v >> i) & 1) === 1;
      var r = Math.floor(i / 3);
      var c = i % 3 + size - 11;
      m[r][c] = bit;
      m[c][r] = bit;
    }
  }

  function encode(text, ecl) {
    ecl = ecl || 'M';
    if (ecl !== 'L' && ecl !== 'M' && ecl !== 'Q' && ecl !== 'H') ecl = 'M';
    var built = buildCodewords(text, ecl);
    var version = built.version;
    var size = 17 + version * 4;
    var base = makeMatrix(size);
    placeFunctionPatterns(base, version);

    var reserved = new Array(size);
    for (var r = 0; r < size; r++) {
      reserved[r] = new Array(size);
      for (var c = 0; c < size; c++) reserved[r][c] = base[r][c] !== null;
    }

    var best = null, bestScore = Infinity, bestMask = 0;
    for (var mask = 0; mask < 8; mask++) {
      var m = cloneMatrix(base);
      placeData(m, reserved, built.codewords);
      applyMask(m, reserved, mask);
      placeFormat(m, ecl, mask);
      placeVersion(m, version);
      var s = penalty(m);
      if (s < bestScore) {
        bestScore = s;
        best = m;
        bestMask = mask;
      }
    }

    for (var r2 = 0; r2 < size; r2++) {
      for (var c2 = 0; c2 < size; c2++) {
        if (best[r2][c2] === null) best[r2][c2] = false;
      }
    }
    return { size: size, modules: best };
  }

  function toSvg(modules, opts) {
    opts = opts || {};
    var scale = opts.scale || 8;
    var margin = opts.margin == null ? 4 : opts.margin;
    var dark = opts.dark || '#020826';
    var light = opts.light || '#fffffe';
    var size = modules.length;
    var dim = (size + margin * 2) * scale;
    var path = '';
    for (var r = 0; r < size; r++) {
      var c = 0;
      while (c < size) {
        if (modules[r][c]) {
          var start = c;
          while (c < size && modules[r][c]) c++;
          var x = (margin + start) * scale;
          var y = (margin + r) * scale;
          var w = (c - start) * scale;
          path += 'M' + x + ' ' + y + 'h' + w + 'v' + scale + 'h-' + w + 'z';
        } else {
          c++;
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" width="' + dim + '" height="' + dim + '" shape-rendering="crispEdges"><rect width="' + dim + '" height="' + dim + '" fill="' + light + '"/><path fill="' + dark + '" d="' + path + '"/></svg>';
  }

  global.RcQr = { encode: encode, toSvg: toSvg };
})(typeof window !== 'undefined' ? window : this);

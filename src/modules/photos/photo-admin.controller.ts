import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@Controller('admin/crop')
export class PhotoAdminController {
  @Get()
  @Public()
  page(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(CROP_PAGE_HTML);
  }
}

// Admin-only local dev page. All gallery data comes from our own API (same origin).
// No user-generated HTML is injected into innerHTML — only trusted API JSON values
// are used via textContent and element attribute assignment.
const CROP_PAGE_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Photo Crop &amp; Upload — Veygo Admin</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0e0e14;color:#e0e0f0;min-height:100vh}
.header{background:#17172a;border-bottom:1px solid #2a2a45;padding:16px 24px;display:flex;align-items:center;gap:12px}
.header h1{font-size:18px;font-weight:600;color:#fff}
.badge{background:#6644cc;color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600}
.wrap{max-width:960px;margin:0 auto;padding:32px 24px}
.card{background:#17172a;border:1px solid #2a2a45;border-radius:12px;padding:24px;margin-bottom:24px}
h2{font-size:15px;font-weight:600;color:#fff;margin-bottom:16px}
label{display:block;font-size:12px;font-weight:600;color:#8888aa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
select,input[type=text]{width:100%;background:#0e0e14;border:1px solid #2a2a45;border-radius:8px;color:#e0e0f0;padding:10px 14px;font-size:14px;outline:none}
select:focus,input[type=text]:focus{border-color:#6644cc}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.drop{border:2px dashed #2a2a45;border-radius:12px;padding:48px 24px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s}
.drop:hover,.drop.over{border-color:#6644cc;background:#1a1830}
.drop .ico{font-size:40px;margin-bottom:12px;opacity:.5}
.drop p{color:#8888aa;font-size:14px}
.drop p strong{color:#b0b0cc}
#file-input{display:none}
.crop-wrap{display:none}
.crop-wrap.on{display:block}
.crop-box{max-height:500px;overflow:hidden;border-radius:8px;background:#000}
.crop-box img{max-width:100%;display:block}
.hint{font-size:12px;color:#8888aa;margin-top:8px}
.hint span{color:#aa88ff;font-weight:600}
.acts{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
.btn{padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-p{background:#6644cc;color:#fff}
.btn-s{background:#2a2a45;color:#e0e0f0}
.prog{display:none;align-items:center;gap:12px;padding:12px 16px;background:#1a1830;border-radius:8px;margin-top:12px}
.prog.on{display:flex}
.pbar{flex:1;height:6px;background:#2a2a45;border-radius:3px;overflow:hidden}
.pfill{height:100%;background:#6644cc;width:0%;transition:width .3s}
.gal{display:none}
.gal.on{display:block}
.gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:16px}
.gal-item{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:3/2;background:#0e0e14}
.gal-item img{width:100%;height:100%;object-fit:cover}
.primary-badge{position:absolute;top:6px;left:6px;background:#6644cc;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700}
.toast{position:fixed;bottom:24px;right:24px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;opacity:0;transition:opacity .3s;pointer-events:none}
.toast.err{background:#ef4444}
.toast.on{opacity:1}
</style>
</head>
<body>
<div class="header">
  <h1>Photo Crop &amp; Upload</h1>
  <span class="badge">Veygo Admin</span>
  <span id="user-info" style="margin-left:auto;font-size:13px;color:#8888aa"></span>
</div>
<div class="wrap">
  <div class="card" id="login-card">
    <h2>Sign in</h2>
    <div class="g2">
      <div><label>Email</label><input type="email" id="l-email" value="admin@veygo.dev"></div>
      <div><label>Password</label><input type="password" id="l-pass" value=""></div>
    </div>
    <div class="acts" style="margin-top:16px">
      <button class="btn btn-p" id="btn-login">Sign in</button>
      <span id="login-err" style="color:#ef4444;font-size:13px;align-self:center"></span>
    </div>
  </div>
  <div id="main-content" style="display:none">
  <div class="card">
    <h2>1 — Select entity</h2>
    <div class="g2">
      <div>
        <label>Entity type</label>
        <select id="etype">
          <option value="Destination"      data-rw="3"  data-rh="2">Destination cover — 3:2 (1200×800)</option>
          <option value="Destination-hero" data-rw="16" data-rh="5">Destination hero photos — 16:5 (1920×600)</option>
          <option value="Attraction"       data-rw="3"  data-rh="2">Attraction — 3:2 (960×640)</option>
          <option value="Restaurant"       data-rw="3"  data-rh="2">Restaurant — 3:2 (960×640)</option>
          <option value="Hotel"            data-rw="3"  data-rh="2">Hotel — 3:2 (960×640)</option>
          <option value="Gallery"          data-rw="16" data-rh="9">Gallery photo — 16:9</option>
        </select>
      </div>
      <div>
        <label>Entity ID</label>
        <input type="text" id="eid" placeholder="e.g. barcelona">
      </div>
    </div>
  </div>

  <div class="card">
    <h2>2 — Upload &amp; crop</h2>
    <div class="drop" id="drop">
      <div class="ico">🖼</div>
      <p><strong>Click to select</strong> or drag an image here</p>
      <p style="margin-top:6px;font-size:12px">JPEG, PNG, WebP — max 30 MB</p>
      <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp">
    </div>
    <div class="crop-wrap" id="cwrap">
      <p style="font-size:12px;font-weight:700;color:#aa88ff;text-transform:uppercase;letter-spacing:.5px;margin:20px 0 10px">Adjust crop area — drag to reposition</p>
      <div class="crop-box"><img id="cimg" src="" alt=""></div>
      <p class="hint">Ratio locked to <span id="rlabel"></span> &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Drag image to pan</p>
      <div class="acts" style="flex-wrap:wrap;gap:8px;margin-top:14px">
        <button class="btn btn-s" id="btn-zi" title="Zoom in">＋ Zoom in</button>
        <button class="btn btn-s" id="btn-zo" title="Zoom out">－ Zoom out</button>
        <button class="btn btn-s" id="btn-fit" title="Fit to screen">⊡ Fit</button>
      </div>
      <div class="acts">
        <button class="btn btn-p" id="btn-up">✓ Crop &amp; Upload</button>
        <button class="btn btn-s" id="btn-reset">↩ Choose different image</button>
      </div>
      <div class="prog" id="prog"><span style="font-size:13px;color:#8888aa;white-space:nowrap">Uploading…</span><div class="pbar"><div class="pfill" id="pfill"></div></div></div>
    </div>
  </div>

  <div class="card gal" id="gcard">
    <h2>3 — Uploaded photos</h2>
    <div class="gal-grid" id="ggrid"></div>
    <div style="margin-top:16px"><button class="btn btn-s" id="btn-ref">↻ Refresh</button></div>
  </div>
  </div><!-- /main-content -->
</div>
<div class="toast" id="toast"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>
<script>
(function() {
  'use strict';
  var token = null;

  // ── Login ──────────────────────────────────────────────────────────────────
  var loginCard = document.getElementById('login-card');
  var mainContent = document.getElementById('main-content');
  var userInfo = document.getElementById('user-info');
  var loginErr = document.getElementById('login-err');

  document.getElementById('btn-login').addEventListener('click', function() {
    var email = document.getElementById('l-email').value.trim();
    var pass = document.getElementById('l-pass').value;
    loginErr.textContent = '';
    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.accessToken) throw new Error(d.message || 'Login failed');
      token = d.accessToken;
      loginCard.style.display = 'none';
      mainContent.style.display = '';
      userInfo.textContent = email;
    })
    .catch(function(e) { loginErr.textContent = e.message || 'Login failed'; });
  });

  document.getElementById('l-pass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });

  function authHeaders() {
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  // ── Crop / Upload ──────────────────────────────────────────────────────────
  var cropper = null;
  var drop = document.getElementById('drop');
  var fileInput = document.getElementById('file-input');
  var cwrap = document.getElementById('cwrap');
  var cimg = document.getElementById('cimg');
  var rlabel = document.getElementById('rlabel');
  var btnUp = document.getElementById('btn-up');
  var btnReset = document.getElementById('btn-reset');
  var btnRef = document.getElementById('btn-ref');
  var prog = document.getElementById('prog');
  var pfill = document.getElementById('pfill');
  var gcard = document.getElementById('gcard');
  var ggrid = document.getElementById('ggrid');
  var etype = document.getElementById('etype');
  var eid = document.getElementById('eid');
  var toast = document.getElementById('toast');

  function showToast(msg, isErr) {
    toast.textContent = msg;
    toast.className = 'toast' + (isErr ? ' err' : '') + ' on';
    setTimeout(function() { toast.className = 'toast' + (isErr ? ' err' : ''); }, 3000);
  }

  function getRatio() {
    var opt = etype.selectedOptions[0];
    return { w: parseInt(opt.dataset.rw, 10), h: parseInt(opt.dataset.rh, 10) };
  }

  function getApiType() {
    return etype.value === 'Destination-hero' ? 'Destination' : etype.value;
  }

  function initCropper(src) {
    if (cropper) { cropper.destroy(); cropper = null; }
    cimg.src = src;
    var r = getRatio();
    rlabel.textContent = r.w + ':' + r.h;
    cwrap.className = 'crop-wrap on';
    drop.style.display = 'none';
    cropper = new Cropper(cimg, {
      aspectRatio: r.w / r.h,
      viewMode: 1,          // image fills the canvas but can be moved/zoomed
      autoCropArea: 0.85,
      guides: true,
      center: true,
      movable: true,
      zoomable: true,       // scroll wheel zooms in/out so admin can see detail
      zoomOnWheel: true,
      wheelZoomRatio: 0.08, // gentle zoom steps
      rotatable: false,
      scalable: false,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      minContainerHeight: 420,
      responsive: true      // redraws correctly on window resize
    });
  }

  drop.addEventListener('click', function() { fileInput.click(); });
  drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', function() { drop.classList.remove('over'); });
  drop.addEventListener('drop', function(e) {
    e.preventDefault(); drop.classList.remove('over');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function(e) { if (e.target.files[0]) loadFile(e.target.files[0]); });

  function loadFile(file) {
    if (file.size > 30 * 1024 * 1024) { showToast('File too large (max 30 MB)', true); return; }
    var reader = new FileReader();
    reader.onload = function(e) { initCropper(e.target.result); };
    reader.readAsDataURL(file);
  }

  btnReset.addEventListener('click', function() {
    if (cropper) { cropper.destroy(); cropper = null; }
    cwrap.className = 'crop-wrap';
    drop.style.display = '';
    fileInput.value = '';
    cimg.src = '';
    prog.className = 'prog';
  });

  btnUp.addEventListener('click', function() {
    var entityId = eid.value.trim();
    if (!entityId) { showToast('Enter entity ID first', true); eid.focus(); return; }
    if (!cropper) return;
    var canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' });
    btnUp.disabled = true;
    prog.className = 'prog on';
    pfill.style.width = '30%';
    canvas.toBlob(function(blob) {
      pfill.style.width = '60%';
      var form = new FormData();
      form.append('file', blob, 'photo.jpg');
      fetch('/photos/' + getApiType() + '/' + entityId, { method: 'POST', headers: authHeaders(), body: form })
        .then(function(res) {
          pfill.style.width = '100%';
          if (!res.ok) return res.json().then(function(e) { throw new Error(e.message || res.statusText); });
          return res.json();
        })
        .then(function() {
          showToast('Uploaded & cropped!');
          loadGallery();
          btnReset.click();
        })
        .catch(function(e) { showToast(e.message || 'Upload failed', true); })
        .finally(function() {
          btnUp.disabled = false;
          setTimeout(function() { prog.className = 'prog'; }, 800);
        });
    }, 'image/jpeg', 0.95);
  });

  function loadGallery() {
    var entityId = eid.value.trim();
    if (!entityId) return;
    fetch('/photos/' + getApiType() + '/' + entityId, { headers: authHeaders() })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(photos) {
        if (!photos.length) { gcard.className = 'card gal'; return; }
        gcard.className = 'card gal on';
        while (ggrid.firstChild) ggrid.removeChild(ggrid.firstChild);
        photos.forEach(function(p) {
          var item = document.createElement('div');
          item.className = 'gal-item';
          var img = document.createElement('img');
          img.src = p.url;
          img.alt = p.alt || '';
          item.appendChild(img);
          if (p.isPrimary) {
            var badge = document.createElement('span');
            badge.className = 'primary-badge';
            badge.textContent = 'Primary';
            item.appendChild(badge);
          }
          ggrid.appendChild(item);
        });
      })
      .catch(function() {});
  }

  document.getElementById('btn-zi').addEventListener('click', function() { if (cropper) cropper.zoom(0.15); });
  document.getElementById('btn-zo').addEventListener('click', function() { if (cropper) cropper.zoom(-0.15); });
  document.getElementById('btn-fit').addEventListener('click', function() { if (cropper) cropper.reset(); });
  btnRef.addEventListener('click', loadGallery);
  eid.addEventListener('change', loadGallery);
  etype.addEventListener('change', function() {
    if (cropper) {
      var r = getRatio();
      cropper.setAspectRatio(r.w / r.h);
      rlabel.textContent = r.w + ':' + r.h;
    }
  });
})();
</script>
</body>
</html>`;

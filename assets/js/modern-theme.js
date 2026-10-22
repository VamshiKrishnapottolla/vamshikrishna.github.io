(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initCursorGlow();
    initTiltCards();
    initHeroParallax();
    initHero3D();
  });

  /* ---------------- Cursor glow ---------------- */
  function initCursorGlow() {
    if (!isFinePointer || prefersReducedMotion) return;

    var glow = document.getElementById('mt-cursor-glow');
    if (!glow) return;

    var rafId = null;
    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.classList.add('is-active');
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });

    document.addEventListener('mouseleave', function () {
      glow.classList.remove('is-active');
    });

    function update() {
      glow.style.transform = 'translate(' + targetX + 'px,' + targetY + 'px)';
      rafId = null;
    }
  }

  /* ---------------- 3D tilt on project / certificate / resume cards ---------------- */
  function initTiltCards() {
    if (!isFinePointer || prefersReducedMotion) return;

    var selectors = '.rn-service .inner, .rn-portfolio .inner, .resume-single-list .inner';
    var cards = document.querySelectorAll(selectors);

    cards.forEach(function (card) {
      var maxTilt = 4;
      var bounds;

      card.style.transform = 'perspective(1200px)';

      card.addEventListener('pointerenter', function () {
        bounds = card.getBoundingClientRect();
      });

      card.addEventListener('pointermove', function (e) {
        if (!bounds) bounds = card.getBoundingClientRect();
        var px = Math.min(Math.max((e.clientX - bounds.left) / bounds.width, 0), 1);
        var py = Math.min(Math.max((e.clientY - bounds.top) / bounds.height, 0), 1);
        var rotateY = (px - 0.5) * (maxTilt * 2);
        var rotateX = (0.5 - py) * (maxTilt * 2);
        card.style.transform =
          'perspective(1200px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
      });

      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
        setTimeout(function () {
          card.style.transition = '';
        }, 500);
      });
    });
  }

  /* ---------------- Hero portrait parallax ---------------- */
  function initHeroParallax() {
    if (!isFinePointer || prefersReducedMotion) return;

    var portrait = document.querySelector('.rn-slider-area .thumbnail .inner');
    var hero = document.querySelector('.rn-slider-area');
    if (!portrait || !hero) return;

    hero.addEventListener('pointermove', function (e) {
      var bounds = hero.getBoundingClientRect();
      var px = Math.min(Math.max((e.clientX - bounds.left) / bounds.width, 0), 1) - 0.5;
      var py = Math.min(Math.max((e.clientY - bounds.top) / bounds.height, 0), 1) - 0.5;
      // Translate only — no 3D rotation. A flat rectangular photo with
      // hard edges can visually tear under perspective rotation on
      // some GPUs, so depth here comes from parallax motion only.
      portrait.style.transform =
        'translate3d(' + (px * -14).toFixed(2) + 'px,' + (py * -14).toFixed(2) + 'px,0)';
    });

    hero.addEventListener('pointerleave', function () {
      portrait.style.transform = 'translate3d(0,0,0)';
    });
  }

  /* ---------------- WebGL hero background ---------------- */
  function initHero3D() {
    var container = document.getElementById('mt-hero-canvas');
    if (!container) return;
    if (prefersReducedMotion) return;
    if (typeof THREE === 'undefined') return;
    if (!supportsWebGL()) return;

    var isSmallScreen = window.innerWidth < 768;
    var particleCount = isSmallScreen ? 220 : 520;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 18;

    var renderer = new THREE.WebGLRenderer({ canvas: container, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);

    var group = new THREE.Group();
    scene.add(group);

    // Floating particle field
    var positions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    var particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particlesMat = new THREE.PointsMaterial({
      color: 0xff014f,
      size: 0.14,
      transparent: true,
      opacity: 0.7
    });
    var particles = new THREE.Points(particlesGeo, particlesMat);
    group.add(particles);

    // Low-poly wireframe icosahedra as focal shapes, tucked into the
    // negative space around the portrait rather than behind it
    var shapeGeo = new THREE.IcosahedronGeometry(3.6, 0);
    var shapeMat = new THREE.MeshBasicMaterial({ color: 0x7b2ff7, wireframe: true, transparent: true, opacity: 0.65 });
    var shape = new THREE.Mesh(shapeGeo, shapeMat);
    shape.position.set(13.5, 6, -2);
    group.add(shape);

    var shape2Geo = new THREE.IcosahedronGeometry(2.2, 1);
    var shape2Mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.6 });
    var shape2 = new THREE.Mesh(shape2Geo, shape2Mat);
    shape2.position.set(-12.5, -6.5, -2);
    group.add(shape2);

    var mouseX = 0, mouseY = 0;
    if (isFinePointer) {
      window.addEventListener('pointermove', function (e) {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      });
    }

    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      particles.rotation.y = t * 0.03;
      shape.rotation.x = t * 0.15;
      shape.rotation.y = t * 0.2;
      shape2.rotation.x = -t * 0.12;
      shape2.rotation.y = t * 0.18;

      group.rotation.y += (mouseX * 0.3 - group.rotation.y) * 0.03;
      group.rotation.x += (-mouseY * 0.15 - group.rotation.x) * 0.03;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', function () {
      var w = container.clientWidth;
      var h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
  }

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
})();

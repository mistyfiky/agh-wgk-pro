import * as THREE from "three";

import {FlyControls} from "three/examples/jsm/controls/FlyControls.js";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {FilmPass} from "three/examples/jsm/postprocessing/FilmPass.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";

var radius = 6371;

var MARGIN = 0;
var SCREEN_HEIGHT = window.innerHeight - MARGIN * 2;
var SCREEN_WIDTH = window.innerWidth;

var camera, controls, scene, renderer;
var geometry;
var sunLight;

var composer;

var clock = new THREE.Clock();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7);
    camera.position.z = radius * 5;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00000025);

    // sun

    geometry = new THREE.SphereBufferGeometry(radius, 100, 50);
    sunLight = new THREE.PointLight(0xffee88, 1, 0, 2);

    var materialSun = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    });

    sunLight.add(new THREE.Mesh(geometry, materialSun));
    sunLight.position.set(camera.position.x + radius, camera.position.y, camera.position.z - 5 * radius);
    scene.add(sunLight);

    // plane

    var loader = new FBXLoader();
    loader.load("models/plane/source/Aelous(TM) Resonance V.fbx", function (group) {

        var textureLoader = new THREE.TextureLoader();
        var texture = textureLoader.load("models/plane/textures/internal_ground_ao_texture.jpeg");

        group.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.map = texture;
                child.material.needsUpdate = true;
            }
        });

        group.position.set(camera.position.x - 50, camera.position.y, camera.position.z - 200);
        group.scale.set(0.1, 0.1, 0.1);
        group.rotateZ(-Math.PI / 4);

        scene.add(group);

    }, undefined, function (event) {
        console.log(event);
    });

    // stars

    var i, r = radius, starsGeometry = [new THREE.BufferGeometry(), new THREE.BufferGeometry()];

    var vertices1 = [];
    var vertices2 = [];

    var vertex = new THREE.Vector3();

    for (i = 0; i < 250; i++) {

        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        vertex.multiplyScalar(r);

        vertices1.push(vertex.x, vertex.y, vertex.z);

    }

    for (i = 0; i < 1500; i++) {

        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        vertex.multiplyScalar(r);

        vertices2.push(vertex.x, vertex.y, vertex.z);

    }

    starsGeometry[0].setAttribute("position", new THREE.Float32BufferAttribute(vertices1, 3));
    starsGeometry[1].setAttribute("position", new THREE.Float32BufferAttribute(vertices2, 3));

    var stars;
    var starsMaterials = [
        new THREE.PointsMaterial({color: 0x555555, size: 2, sizeAttenuation: false}),
        new THREE.PointsMaterial({color: 0x555555, size: 1, sizeAttenuation: false}),
        new THREE.PointsMaterial({color: 0x333333, size: 2, sizeAttenuation: false}),
        new THREE.PointsMaterial({color: 0x3a3a3a, size: 1, sizeAttenuation: false}),
        new THREE.PointsMaterial({color: 0x1a1a1a, size: 2, sizeAttenuation: false}),
        new THREE.PointsMaterial({color: 0x1a1a1a, size: 1, sizeAttenuation: false})
    ];

    for (i = 10; i < 30; i++) {

        stars = new THREE.Points(starsGeometry[i % 2], starsMaterials[i % 6]);

        stars.rotation.x = Math.random() * 6;
        stars.rotation.y = Math.random() * 6;
        stars.rotation.z = Math.random() * 6;
        stars.scale.setScalar(i * 10);

        stars.matrixAutoUpdate = false;
        stars.updateMatrix();

        scene.add(stars);

    }

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.body.appendChild(renderer.domElement);

    //

    controls = new FlyControls(camera, renderer.domElement);

    controls.movementSpeed = 100;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = true;

    window.addEventListener("resize", onWindowResize, false);

    // postprocessing

    var renderModel = new RenderPass(scene, camera);
    var effectFilm = new FilmPass(0.35, 0.75, 2048, false);

    composer = new EffectComposer(renderer);

    composer.addPass(renderModel);
    composer.addPass(effectFilm);

}

function onWindowResize() {

    SCREEN_HEIGHT = window.innerHeight;
    SCREEN_WIDTH = window.innerWidth;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

}

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    var delta = clock.getDelta();

    controls.update(delta);

    composer.render(delta);

}

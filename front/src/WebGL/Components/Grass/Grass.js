import * as THREE from 'three';
import vertexShader from './shaders/vertexShader.vert';
import fragmentShader from './shaders/fragmentShader.frag';

const BLADE_WIDTH = 0.1
const BLADE_HEIGHT = 0.01
const BLADE_HEIGHT_VARIATION = 0.5
const BLADE_VERTEX_COUNT = 5
const BLADE_TIP_OFFSET = 0.1

function interpolate(val, oldMin, oldMax, newMin, newMax) {
  return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin
}

export class GrassGeometry extends THREE.BufferGeometry {
  constructor(size, count) {
    super()

    const positions = []
    const uvs = []
    const indices = []

    for (let i = 0; i < count; i++) {
      const surfaceMin = (size / 2) * -1
      const surfaceMax = size / 2
      const radius = (size / 2) * Math.random()
      const theta = Math.random() * 2 * Math.PI

      const x = radius * Math.cos(theta)
      const y = radius * Math.sin(theta)

      uvs.push(
        ...Array.from({ length: BLADE_VERTEX_COUNT }).flatMap(() => [
          interpolate(x, surfaceMin, surfaceMax, 0, 1),
          interpolate(y, surfaceMin, surfaceMax, 0, 1)
        ])
      )

      const blade = this.computeBlade([x, 0, y], i)
      positions.push(...blade.positions)
      indices.push(...blade.indices)
    }

    this.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(new Float32Array(positions)), 3)
    )
    this.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
    this.setIndex(indices)
    this.computeVertexNormals()

  }

  // Grass blade generation, covered in https://smythdesign.com/blog/stylized-grass-webgl
  // TODO: reduce vertex count, optimize & possibly move to GPU
  computeBlade(center, index = 0) {
    const height = BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION
    const vIndex = index * BLADE_VERTEX_COUNT

    // Randomize blade orientation and tip angle
    const yaw = Math.random() * Math.PI * 2
    const yawVec = [Math.sin(yaw), 0, -Math.cos(yaw)]
    const bend = Math.random() * Math.PI * 2
    const bendVec = [Math.sin(bend), 0, -Math.cos(bend)]

    // Calc bottom, middle, and tip vertices
    const bl = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * 1 + center[i])
    const br = yawVec.map((n, i) => n * (BLADE_WIDTH / 2) * -1 + center[i])
    const tl = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * 1 + center[i])
    const tr = yawVec.map((n, i) => n * (BLADE_WIDTH / 4) * -1 + center[i])
    const tc = bendVec.map((n, i) => n * BLADE_TIP_OFFSET + center[i])

    // Attenuate height
    tl[1] += height / 2
    tr[1] += height / 2
    tc[1] += height

    return {
      positions: [...bl, ...br, ...tr, ...tl, ...tc],
      indices: [
        vIndex,
        vIndex + 1,
        vIndex + 2,
        vIndex + 2,
        vIndex + 4,
        vIndex + 3,
        vIndex + 3,
        vIndex,
        vIndex + 2
      ]
    }
  }
}

const cloudTexture = new THREE.TextureLoader().load('/img/cloud.jpg')
cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping

class Grass extends THREE.Mesh {
  constructor(size, count, x, y, z) {
    const geometry = new GrassGeometry(size, count);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorScale: { value: Math.floor(Math.random()*10)/10 },
        uColor1: { value: new THREE.Color(0x96d96f) },
        uColor2: { value: new THREE.Color(0x73b247) },
        uColor3: { value: new THREE.Color(0x3c9464) },
        uColor4: { value: new THREE.Color(0x075047) },
        uColor5: { value: new THREE.Color(0x0a353b) },
      },
      side: THREE.DoubleSide,
      encoding: THREE.sRGBEncoding,
      vertexShader,
      fragmentShader
    });
    super(geometry, material);

    this.position.set(x * 6, y * 5, z * 5.2);
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
  }

  updateGrass(size, count) {
    this.material.uniforms.uTime.value = 0;
    this.geometry.dispose();
    this.geometry = new GrassGeometry(size, count);
  }
}

export default Grass
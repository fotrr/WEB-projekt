import React from '../node_modules/react/index.js';
import { createRoot } from '../node_modules/react-dom/client.js';
import * as THREE from '../node_modules/three/build/three.module.js';

let leverRoot = null, leverMount = null;
window.addEventListener('casino:render', event => {
  const mount = document.getElementById('slotLeverMount');
  if (!mount) { leverRoot?.unmount(); leverRoot = leverMount = null; return; }
  if (mount !== leverMount) { leverRoot?.unmount(); leverRoot = createRoot(mount); leverMount = mount; }
  leverRoot.render(React.createElement('button', {
    className: `slot-lever ${event.detail.spinning ? 'is-pulled' : ''}`,
    type: 'button', disabled: event.detail.spinning,
    onClick: () => document.getElementById('btnSpinSlots')?.click(),
    'aria-label': 'Zatáhnout za páku a roztočit válce'
  }, React.createElement('span', { className: 'lever-arm' }, React.createElement('span', { className: 'lever-knob' })), React.createElement('span', { className: 'lever-label' }, 'TAHAT')));
});

// A single, efficient Three.js background scene with a smooth dragon and glowing paper lanterns.
let worldRenderer, worldScene, worldCamera, worldFrame, worldTick, worldDragon, worldLanterns=[];
function initWorld(){
  if(worldRenderer||!document.body)return;
  const canvas=document.createElement('canvas');canvas.className='casino-3d-world';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  worldScene=new THREE.Scene();worldCamera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);worldCamera.position.set(0,0,25);
  try{worldRenderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});}catch(error){canvas.remove();document.body.classList.add('casino-3d-fallback');return;}
  worldRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));worldScene.add(new THREE.AmbientLight(0xffd8a1,1.15));
  const scaleCanvas=document.createElement('canvas');scaleCanvas.width=256;scaleCanvas.height=128;const scaleCtx=scaleCanvas.getContext('2d');scaleCtx.fillStyle='#a75c25';scaleCtx.fillRect(0,0,256,128);for(let row=0;row<8;row++)for(let col=0;col<16;col++){const x=col*16+(row%2)*8,y=row*16;scaleCtx.beginPath();scaleCtx.moveTo(x-7,y+6);scaleCtx.quadraticCurveTo(x,y-5,x+7,y+6);scaleCtx.strokeStyle=row%2?'rgba(255,218,132,.42)':'rgba(85,29,12,.32)';scaleCtx.lineWidth=1.3;scaleCtx.stroke();}const scaleTexture=new THREE.CanvasTexture(scaleCanvas);scaleTexture.wrapS=scaleTexture.wrapT=THREE.RepeatWrapping;scaleTexture.repeat.set(5,1);scaleTexture.colorSpace=THREE.SRGBColorSpace;
  const gold=new THREE.MeshStandardMaterial({color:0xd59a47,map:scaleTexture,metalness:.38,roughness:.43,emissive:0x2d1204});
  const crimson=new THREE.MeshStandardMaterial({color:0x9b3020,metalness:.38,roughness:.46,emissive:0x350906});
  // Continuous tubular body: no separate scale beads or dotted silhouette.
  worldDragon=new THREE.Group();
  const spineCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-6,-.05,0),new THREE.Vector3(-5,.36,0),new THREE.Vector3(-3.9,-.22,0),new THREE.Vector3(-2.7,.25,0),new THREE.Vector3(-1.5,-.16,0),new THREE.Vector3(-.35,.18,0),new THREE.Vector3(.65,-.02,0),new THREE.Vector3(1.45,.18,0)]);
  const body=new THREE.Mesh(new THREE.TubeGeometry(spineCurve,72,.19,12,false),gold);worldDragon.add(body);
  const bellyCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-4.8,-.18,.08),new THREE.Vector3(-3.8,-.31,.08),new THREE.Vector3(-2.7,.06,.08),new THREE.Vector3(-1.5,-.29,.08),new THREE.Vector3(-.35,.04,.08),new THREE.Vector3(.65,-.17,.08),new THREE.Vector3(1.25,.03,.08)]);
  worldDragon.add(new THREE.Mesh(new THREE.TubeGeometry(bellyCurve,60,.082,8,false),new THREE.MeshStandardMaterial({color:0xf1cb77,metalness:.4,roughness:.48})));
  const dorsalCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-5.2,.25,.02),new THREE.Vector3(-3.8,.05,.02),new THREE.Vector3(-2.3,.12,.02),new THREE.Vector3(-.8,.13,.02),new THREE.Vector3(.55,.15,.02)]);
  worldDragon.add(new THREE.Mesh(new THREE.TubeGeometry(dorsalCurve,44,.045,7,false),crimson));
  const spineMat=new THREE.MeshStandardMaterial({color:0x9d3822,metalness:.34,roughness:.42});
  for(let i=0;i<9;i++){const x=-4.7+i*.67,y=.27+Math.sin(i*.9)*.13,spine=new THREE.Mesh(new THREE.ConeGeometry(.115,.32,8),spineMat);spine.position.set(x,y,.015);spine.rotation.z=-.18;worldDragon.add(spine);}
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.22,1.05,12),crimson);tail.rotation.z=Math.PI/2;tail.position.set(-6.25,-.04,0);worldDragon.add(tail);
  const head=new THREE.Group();
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.47,20,14),gold);skull.scale.set(1.35,.82,.88);head.add(skull);
  const cheek=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10),crimson);cheek.position.set(-.13,-.2,0);cheek.scale.set(1,.62,1);head.add(cheek);
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),gold);muzzle.position.set(.48,-.12,0);muzzle.scale.set(1.3,.58,.78);head.add(muzzle);
  const jaw=new THREE.Mesh(new THREE.SphereGeometry(.23,14,10),crimson);jaw.position.set(.43,-.34,0);jaw.scale.set(1.12,.43,.72);head.add(jaw);
  const hornMat=new THREE.MeshStandardMaterial({color:0xffe0a0,metalness:.58,roughness:.28});
  const eyeSocket=new THREE.MeshStandardMaterial({color:0x29130b,roughness:.55});
  const curveTube=(points,radius,material,segments=20)=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,7,false),material);
  for(const side of [-1,1]){
    const horn=curveTube([[-.24,.26,side*.24],[-.48,.48,side*.32],[-.54,.78,side*.35]],.075,hornMat);head.add(horn);
    const socket=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),eyeSocket);socket.position.set(.16,.09,side*.34);socket.scale.set(1.25,.8,.55);head.add(socket);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.058,12,8),new THREE.MeshBasicMaterial({color:0xffd76a}));eye.position.set(.19,.10,side*.365);head.add(eye);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.021,8,6),new THREE.MeshBasicMaterial({color:0x190d08}));pupil.position.set(.205,.10,side*.389);head.add(pupil);
    head.add(curveTube([[.12,.19,side*.33],[.24,.25,side*.36],[.40,.19,side*.32]],.045,hornMat,12));
    const nostril=new THREE.Mesh(new THREE.SphereGeometry(.038,8,6),eyeSocket);nostril.position.set(.70,-.055,side*.16);nostril.scale.set(1,.65,.5);head.add(nostril);
    head.add(curveTube([[.38,-.13,side*.2],[.72,.05,side*.36],[1.0,.13,side*.44]],.018,hornMat,16));
    const fang=new THREE.Mesh(new THREE.ConeGeometry(.045,.15,8),new THREE.MeshStandardMaterial({color:0xffe8bd}));fang.position.set(.52,-.30,side*.16);fang.rotation.z=Math.PI;head.add(fang);
  }
  head.position.set(1.55,.18,.02);worldDragon.add(head);
  // Four articulated legs and small claws give the body a recognizable dragon silhouette.
  worldDragon.userData.legs=[];
  for(const x of [.62,-1.8])for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(x,-.12,side*.16);leg.add(curveTube([[0,0,0],[-.08,-.28,side*.17],[.08,-.52,side*.22]],.095,gold,14));
    const paw=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),crimson);paw.position.set(.08,-.52,side*.22);paw.scale.set(1.35,.55,1);leg.add(paw);
    for(let claw=0;claw<3;claw++){const talon=new THREE.Mesh(new THREE.ConeGeometry(.035,.17,7),hornMat);talon.position.set(.19,-.57,side*.22+(claw-1)*.075);talon.rotation.z=-Math.PI/2;leg.add(talon);}
    worldDragon.add(leg);worldDragon.userData.legs.push({leg,x,side});
  }
  head.position.set(1.55,.18,.02);worldDragon.add(head);
  const wingShape=new THREE.Shape();wingShape.moveTo(0,0);wingShape.lineTo(-.55,1.05);wingShape.lineTo(-.13,.79);wingShape.lineTo(.19,1.35);wingShape.lineTo(.31,.69);wingShape.lineTo(.88,.95);wingShape.lineTo(.55,.04);wingShape.closePath();
  const wingMaterial=new THREE.MeshStandardMaterial({color:0x9d3524,side:THREE.DoubleSide,metalness:.22,roughness:.52,emissive:0x260804});
  const wingRibMaterial=new THREE.MeshStandardMaterial({color:0xe6b95d,metalness:.65,roughness:.32});
  worldDragon.userData.wings=[];
  for(const side of [-1,1]){const hinge=new THREE.Group(),membrane=new THREE.Mesh(new THREE.ShapeGeometry(wingShape),wingMaterial);membrane.scale.x=side;hinge.add(membrane);for(const tip of [[-.55,1.05],[.19,1.35],[.88,.95]])hinge.add(curveTube([[0,0,side*.015],[tip[0]*.48,tip[1]*.5,side*.018],[tip[0],tip[1],side*.02]],.018,wingRibMaterial,12));hinge.position.set(.15,.18,side*.25);worldDragon.add(hinge);worldDragon.userData.wings.push({hinge,side});}
  worldScene.add(worldDragon);
  // Pleated silk lanterns with gold frames, a warm core, and restrained irregular flicker.
  const lanternPaper=new THREE.MeshStandardMaterial({color:0xe98435,emissive:0xb74712,emissiveIntensity:.75,roughness:.58,transparent:true,opacity:.88,side:THREE.DoubleSide});
  const frameMaterial=new THREE.MeshStandardMaterial({color:0xd7a84d,metalness:.72,roughness:.27});
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=96;const glowContext=glowCanvas.getContext('2d');const gradient=glowContext.createRadialGradient(48,48,2,48,48,48);gradient.addColorStop(0,'rgba(255,221,145,.78)');gradient.addColorStop(.28,'rgba(255,142,43,.38)');gradient.addColorStop(1,'rgba(255,90,20,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,96,96);const glowTexture=new THREE.CanvasTexture(glowCanvas);const glowMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffbd70,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false});
  const lanes=[{x:-.72,direction:1},{x:-.62,direction:-1},{x:.62,direction:1},{x:.72,direction:-1}];
  const perLane=5;
  const anchors=lanes.flatMap((lane,laneIndex)=>Array.from({length:perLane},(_,row)=>({x:lane.x,y:-.58+row*(1.16/(perLane-1)),direction:lane.direction,laneIndex,row})));
  const viewHalf=worldCamera.position.z*Math.tan(THREE.MathUtils.degToRad(worldCamera.fov/2));
  for(let i=0;i<anchors.length;i++){
    const lantern=new THREE.Group(),paper=new THREE.Mesh(new THREE.CylinderGeometry(.25,.36,.78,20,1,true),lanternPaper.clone());lantern.add(paper);
    const top=new THREE.Mesh(new THREE.TorusGeometry(.26,.03,7,20),frameMaterial),bottom=new THREE.Mesh(new THREE.TorusGeometry(.36,.035,7,20),frameMaterial);top.position.y=.4;bottom.position.y=-.4;lantern.add(top,bottom);
    for(let rib=0;rib<6;rib++){const a=rib*Math.PI/3,wire=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.75,5),frameMaterial);wire.position.set(Math.cos(a)*.30,0,Math.sin(a)*.30);lantern.add(wire);}
    const hanger=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.24,5),frameMaterial);hanger.position.y=.51;lantern.add(hanger);
    const tassel=new THREE.Mesh(new THREE.ConeGeometry(.055,.22,8),new THREE.MeshStandardMaterial({color:0xc43c23,roughness:.6}));tassel.position.y=-.54;lantern.add(tassel);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.085,10,8),new THREE.MeshBasicMaterial({color:0xffdd8a}));flame.scale.set(.72,1.5,.72);flame.position.y=-.035;lantern.add(flame);
    const halo=new THREE.Sprite(glowMaterial.clone());halo.scale.set(1.2,1.6,1);lantern.add(halo);
    const light=i%4===0?new THREE.PointLight(0xffa448,1.05,3.4,2):null;if(light){light.position.set(0,0,0);lantern.add(light);}
    const anchor=anchors[i];
    lantern.scale.setScalar(1.45+Math.random()*.16);lantern.position.set(anchor.x*viewHalf*worldCamera.aspect,anchor.y*viewHalf,2);const rowSpeed=anchor.direction>0?.54+anchor.row*.025:.54+(perLane-1-anchor.row)*.025;lantern.userData={paper:paper.material,flame,light,halo,nextFlicker:4+Math.random()*12,flickerUntil:0,flickerAt:0,phase:Math.random()*6.28,anchorX:anchor.x,anchorY:anchor.y,x:lantern.position.x,y:lantern.position.y,direction:anchor.direction,speed:rowSpeed+Math.random()*.018,sway:.12+Math.random()*.22,swayRate:.25+Math.random()*.3,fading:false,fadeAt:0,fadeInAt:0};worldScene.add(lantern);worldLanterns.push(lantern);
  }
  const resize=()=>{worldCamera.aspect=innerWidth/innerHeight;worldCamera.updateProjectionMatrix();worldRenderer?.setSize(innerWidth,innerHeight,false);const h=worldCamera.position.z*Math.tan(THREE.MathUtils.degToRad(worldCamera.fov/2));for(const lantern of worldLanterns){lantern.userData.x=lantern.userData.anchorX*h*worldCamera.aspect;lantern.userData.y=lantern.userData.anchorY*h;}};window.addEventListener('resize',resize,{passive:true});resize();
  worldDragon.scale.setScalar(1.6);
  let last=0;const tick=now=>{if(document.hidden)return;worldFrame=requestAnimationFrame(tick);if(now-last<33)return;const delta=Math.min((now-last)/1000,.08);last=now;const t=now*.001;const half=worldCamera.position.z*Math.tan(THREE.MathUtils.degToRad(worldCamera.fov/2))*worldCamera.aspect;worldDragon.position.set(((t*.72+half+16)%(2*half+32))-half-16,4.3+Math.sin(t*.7)*.38,5.2);worldDragon.rotation.z=Math.sin(t*.7)*.035;worldDragon.userData.wings.forEach(({hinge,side})=>{hinge.rotation.z=side*(.18+Math.sin(t*5.4)*.28);hinge.rotation.x=side*.24;});worldDragon.userData.legs.forEach(({leg,x,side},i)=>{leg.rotation.z=Math.sin(t*5+i)*.11;});
    const verticalLimit=worldCamera.position.z*Math.tan(THREE.MathUtils.degToRad(worldCamera.fov/2))*.72;
    for(const lantern of worldLanterns){const data=lantern.userData;if(!data.fading){data.y+=data.direction*data.speed*delta;if(Math.abs(data.y)>=verticalLimit){data.y=Math.sign(data.y)*verticalLimit;data.fading=true;data.fadeAt=t;}}else if(t-data.fadeAt>.32){data.y=-Math.sign(data.y)*verticalLimit;data.fading=false;data.fadeInAt=t;}const fadeOut=data.fading?Math.max(0,1-(t-data.fadeAt)/.32):1;const fadeIn=t-data.fadeInAt<.32?Math.max(0,(t-data.fadeInAt)/.32):1;const edgeFade=fadeOut*fadeIn;const drift=Math.sin(t*data.swayRate+data.phase)*data.sway;lantern.position.set(data.x+drift,data.y,2);lantern.rotation.z=Math.sin(t*.7+data.phase)*.035;if(t>=data.nextFlicker){data.flickerAt=t;data.flickerUntil=t+.55;data.nextFlicker=t+8+Math.random()*13;}const flickering=t<data.flickerUntil;const flickerWave=.5+.5*Math.sin((t-data.flickerAt)*18);const pulse=flickering?.68+.22*flickerWave:.84+.06*Math.sin(t*1.7+data.phase);data.paper.emissiveIntensity=pulse;data.paper.opacity=.88*edgeFade;if(data.light)data.light.intensity=pulse*1.3*edgeFade;data.halo.material.opacity=(flickering?.6+.16*flickerWave:.48)*edgeFade;data.flame.scale.y=1.25+.1*Math.sin(t*6+data.phase);}
    worldRenderer.render(worldScene,worldCamera);};worldTick=tick;tick(0);
}
window.addEventListener('DOMContentLoaded',()=>{initWorld();if(document.getElementById('slotLeverMount'))window.dispatchEvent(new CustomEvent('casino:render',{detail:{game:'slots',spinning:false}}));},{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(worldFrame);else if(worldTick)worldTick(performance.now());});

"use strict";

var gl;                 // The webgl context.

var a_coords_loc;       // Location of the a_coords attribute variable in the shader program.
var a_coords_buffer;    // Buffer to hold the values for a_coords.
var a_normal_loc;       // Location of a_normal attribute.
var a_normal_buffer;    // Buffer for a_normal.
var index_buffer;       // Buffer to hold vetex indices from model.

var u_diffuseColor;     // Locations of uniform variables in the shader program
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_lightPositionA;
var u_lightPositionB;
var u_modelview;
var u_projection;
var u_normalMatrix;   
var u_color;
var u_spotLightDir;
var u_day;







var projection = mat4.create();          // projection matrix
var modelview;                           // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();        // matrix, derived from model and view matrix, for transforming normal vectors
var rotator;                             // A TrackballRotator to implement rotation by mouse.
var color = 1.0;
var spotLightDir = vec3.fromValues(1, 0, 0);
var lightDeg = 0;
var carDeg = 0;
var sunDeg = 0;
var wheelDeg = 0;
var day = 1.0

var lastTime = 0;
var colors = [  // RGB color arrays for diffuse and specular color values
    [1,1,1],
];

var lightPositions = [  // values for light position
  [0,.2,-15,1],[0,0,0,1], [0,0,0,1], [0, 0, 0, 0],
];

var objects = [         // Objects for display
    ring(0,2), ring(2,3.5), ring(3.5,4.2), cube(3), uvTorus(1,1.5), uvCylinder(.3, 7), uvCylinder(.2, 1), uvCylinder(.5, .2), uvCone(.5, 1), uvSphere()
];

var currentModelNumber;  // contains data for the current object

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function matCopy(matResult, matA)
{
    var i;
    for(i = 0; i < 16; i++)
    {
        matResult[i] = matA[i];
    }
    
}

function findAngle(vectorA, vectorB)
{
    if(vectorA[0] == vectorB[0] && vectorA[1] == vectorB[1] && vectorA[2] == vectorB[2])
    {
        return 0;
    }
    var top, bottom, magA, magB;
    top = vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1] + vectorA[2] * vectorB[2];
    magA = Math.sqrt( Math.pow(vectorA[0], 2) + Math.pow(vectorA[1], 2) + Math.pow(vectorA[2], 2) );
    magB = Math.sqrt( Math.pow(vectorB[0], 2) + Math.pow(vectorB[1], 2) + Math.pow(vectorB[2], 2) );
    bottom = magA * magB;
    return Math.acos(top / bottom);
}


function mat4Mul(matResult, matA, matB)
{
    var matTemp = mat4.create();
    
    matTemp[0] = matA[0] * matB[0] + matA[4] * matB[1] + matA[8] * matB[2] + matA[12] * matB[3];
    matTemp[4] = matA[0] * matB[4] + matA[4] * matB[5] + matA[8] * matB[6] + matA[12] * matB[7];
    matTemp[8] = matA[0] * matB[8] + matA[4] * matB[9] + matA[8] * matB[10] + matA[12] * matB[11];
    matTemp[12] = matA[0] * matB[12] + matA[4] * matB[13] + matA[8] * matB[14] + matA[12] * matB[15];
    
    matTemp[1] = matA[1] * matB[0] + matA[5] * matB[1] + matA[9] * matB[2] + matA[13] * matB[3];
    matTemp[5] = matA[1] * matB[4] + matA[5] * matB[5] + matA[9] * matB[6] + matA[13] * matB[7];
    matTemp[9] = matA[1] * matB[8] + matA[5] * matB[9] + matA[9] * matB[10] + matA[13] * matB[11];
    matTemp[13] = matA[1] * matB[12] + matA[5] * matB[13] + matA[9] * matB[14] + matA[13] * matB[15];
    
    matTemp[2] = matA[2] * matB[0] + matA[6] * matB[1] + matA[10] * matB[2] + matA[14] * matB[3];
    matTemp[6] = matA[2] * matB[4] + matA[6] * matB[5] + matA[10] * matB[6] + matA[14] * matB[7];
    matTemp[10] = matA[2] * matB[8] + matA[6] * matB[9] + matA[10] * matB[10] + matA[14] * matB[11];
    matTemp[14] = matA[2] * matB[12] + matA[6] * matB[13] + matA[10] * matB[14] + matA[14] * matB[15];
    
    matTemp[3] = matA[3] * matB[0] + matA[7] * matB[1] + matA[11] * matB[2] + matA[15] * matB[3];
    matTemp[7] = matA[3] * matB[4] + matA[7] * matB[5] + matA[11] * matB[6] + matA[15] * matB[7];
    matTemp[11] = matA[3] * matB[8] + matA[7] * matB[9] + matA[11] * matB[10] + matA[15] * matB[11];
    matTemp[15] = matA[3] * matB[12] + matA[7] * matB[13] + matA[11] * matB[14] + matA[15] * matB[15];
    
    
    matCopy(matResult, matTemp);
}





function perspective(inputprojection, fovy, aspect, near, far)
{

    
    mat4.perspective(inputprojection, fovy, aspect, near, far);
        
    
}

function translate(inputmodel, translation_vector)
{

     
    mat4.translate(inputmodel, inputmodel, translation_vector);
      
}

function rotate(inputmodel, angle, axis)
{

    
    mat4.rotate(inputmodel, inputmodel, angle, axis);
      

}

function scale(inputModel, scale_vector){

    mat4.scale(inputModel, inputModel, scale_vector);

}

function drawField()
{
    installModel(objects[0]);
    currentModelNumber = 0;        
    update_uniform(modelview,projection, 0, 0);

    installModel(objects[1]);
    currentModelNumber = 1;    
    update_uniform(modelview,projection, 1, 1);
    
    installModel(objects[2]);
    currentModelNumber = 2;    
    update_uniform(modelview,projection, 2, 0);
}



function drawCar()
{
    installModel(objects[3]);
    currentModelNumber = 3;
    scale(modelview,[0.35, 0.2, 0.1]);
    translate(modelview, [.25, 0, 0]);
    update_uniform(modelview, projection, 3, 2);
    translate(modelview, [-.25, 0, 0]);
    scale(modelview,[1/0.35, 1/0.2, 1/0.1]);
    
    installModel(objects[3]);
    currentModelNumber = 3;
    
    translate(modelview, [0, 0.0, -0.3]);
    scale(modelview,[0.5, 0.25, 0.1]);
    update_uniform(modelview, projection, 3, 2);
    
    scale(modelview, [1/.5, 1/.25, 1/.1]);
    translate(modelview, [0, 0.0, 0.3]);
    
    scale(modelview, [.15,.15,.15]);
    rotate(modelview, degToRad(90), [1, 0, 0]);
    translate(modelview, [4.0, -3.0, 3.25]);
    rotate(modelview, degToRad(wheelDeg), [0, 0, 1]);
    drawWheels();
    rotate(modelview, -degToRad(wheelDeg), [0, 0, 1]);
    translate(modelview, [-4.0, 3.0, -3.25]);
    rotate(modelview, degToRad(-90), [1, 0, 0]);
    scale(modelview, [1/.15, 1/.15, 1/.15]);
    
    scale(modelview, [.15,.15,.15]);
    rotate(modelview, degToRad(90), [1, 0, 0]);
    translate(modelview, [-4.0, -3.0, 3.25]);
    rotate(modelview, degToRad(wheelDeg), [0, 0, 1]);
    drawWheels();
    rotate(modelview, -degToRad(wheelDeg), [0, 0, 1]);
    translate(modelview, [4.0, 3.0, -3.25]);
    rotate(modelview, degToRad(-90), [1, 0, 0]);
    scale(modelview, [1/.15, 1/.15, 1/.15]);
    
    translate(modelview, [-.78, -.21, -.3])
    rotate(modelview, degToRad(-90), [0,1,0]);
    
    
    scale(modelview, [.2, .2, .2]);
    
    installModel(objects[7]);
    currentModelNumber = 7;
    
    update_uniform(modelview, projection, 7, 8)
    scale(modelview, [1/.2, 1/.2, 1/.2])
    rotate(modelview, degToRad(90), [0,1,0]);
    translate(modelview, [.78, .21, .3])
    
    translate(modelview, [-.78, .21, -.3])
    rotate(modelview, degToRad(-90), [0,1,0]);
    scale(modelview, [.2, .2, .2])
    
    
    installModel(objects[7]);
    currentModelNumber = 7;
    update_uniform(modelview, projection, 7, 8)
    scale(modelview, [1/.2, 1/.2, 1/.2])
    rotate(modelview, degToRad(90), [0,1,0]);
    translate(modelview, [.78, -.21, .3])
        
}

function drawWheels()
{    
    
    installModel(objects[5]);
    currentModelNumber = 5;    
    translate(modelview, [0, 0, -3.3]);
    update_uniform(modelview, projection, 5, 4);
    translate(modelview, [0, 0, 3.3]);
    
    drawWheel();
    translate(modelview, [0,0, -6.6]);
    drawWheel();
    translate(modelview, [0,0, 6.6]);
        
}

function drawWheel()
{
    installModel(objects[4]);
    currentModelNumber = 4;    
    update_uniform(modelview, projection, 4, 3);
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [0, .5, 0]);
    rotate(modelview, degToRad(90), [1,0,0]);    
    update_uniform(modelview, projection, 6, 4);    
    rotate(modelview, degToRad(-90), [1,0,0]);
    translate(modelview, [0, -.5, 0]);
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [0, -.5, 0]);
    rotate(modelview, degToRad(90), [1,0,0]);    
    update_uniform(modelview, projection, 6, 4);    
    rotate(modelview, degToRad(-90), [1,0,0]);
    translate(modelview, [0, .5, 0]);
    
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [.5, -.2, 0]);
    rotate(modelview, degToRad(90), [0,1,0]);
    rotate(modelview, degToRad(30), [1,0,0]);
    update_uniform(modelview, projection, 6, 4); 
    rotate(modelview, degToRad(-30), [1,0,0]);
    rotate(modelview, degToRad(-90), [0,1,0]);
    translate(modelview, [-.5, .2, 0]);
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [.5, .2, 0]);
    rotate(modelview, degToRad(90), [0,1,0]);
    rotate(modelview, degToRad(-30), [1,0,0]);
    update_uniform(modelview, projection, 6, 4); 
    rotate(modelview, degToRad(30), [1,0,0]);
    rotate(modelview, degToRad(-90), [0,1,0]);
    translate(modelview, [-.5, -.2, 0]);
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [-.5, -.2, 0]);
    rotate(modelview, degToRad(90), [0,1,0]);
    rotate(modelview, degToRad(-30), [1,0,0]);
    update_uniform(modelview, projection, 6, 4); 
    rotate(modelview, degToRad(30), [1,0,0]);
    rotate(modelview, degToRad(-90), [0,1,0]);
    translate(modelview, [.5, .2, 0]);
    
    installModel(objects[6]);
    currentModelNumber = 6;
    translate(modelview, [-.5, .2, 0]);
    rotate(modelview, degToRad(90), [0,1,0]);
    rotate(modelview, degToRad(30), [1,0,0]);
    update_uniform(modelview, projection, 6, 4); 
    rotate(modelview, degToRad(-30), [1,0,0]);
    rotate(modelview, degToRad(-90), [0,1,0]);
    translate(modelview, [.5, -.2, 0]);
    
}

function drawTree()
{
    translate(modelview, [0, 0, 1.3]);
    scale(modelview, [1, 1, 1.2]);
    installModel(objects[8]);
    currentModelNumber = 8;
    update_uniform(modelview, projection, 8, 0); 
    scale(modelview, [1, 1, 1/1.2]);
    translate(modelview, [0, 0, -1.3]);
    
    scale(modelview, [.5, .5, .1]);
    translate(modelview, [0, 0, 3.5]);
    installModel(objects[5]);
    currentModelNumber = 5;
    update_uniform(modelview, projection, 5, 5);    
    translate(modelview, [0, 0, -3.5]);
    scale(modelview, [1/.5, 1/.5, 1/.1]);
}

function changeLight(num, mat)
{
    
    var l = vec4.fromValues(lightPositions[num][0],lightPositions[num][1],lightPositions[num][2],lightPositions[num][3]);
    var t = vec4.create();
    t = vec4.transformMat4(t, l, mat);
    
    lightPositions[num][0] = t[0];
    lightPositions[num][1] = t[1];
    lightPositions[num][2] = t[2];
    lightPositions[num][3] = t[3];
    
    
    
}

function draw() { 
    gl.clearColor(0.0,0.0,0.0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    resetLight();

    perspective(projection,Math.PI/5,1,10,20);   
    modelview = rotator.getViewMatrix();
    
    
    
    vec3.rotateY(spotLightDir, spotLightDir, [0,0,0], degToRad(-carDeg));
    vec3.rotateX(spotLightDir, spotLightDir, [0,0,0], degToRad(35));
    
    translateLight(1, [-1,.1,2.445]);
    var temp = vec3.fromValues(lightPositions[1][0], lightPositions[1][1], lightPositions[1][2]);
    var dank = vec3.create();
    vec3.rotateY(dank, temp, [0,0,0], degToRad(-carDeg));
    vec3.rotateX(dank, dank, [0,0,0], degToRad(35));
    lightPositions[1][0] = dank[0];
    lightPositions[1][1] = dank[1];
    lightPositions[1][2] = dank[2];
    changeLight(1, modelview);
    
    
    translateLight(2, [-1,.1,3.0]);
    temp = vec3.fromValues(lightPositions[2][0], lightPositions[2][1], lightPositions[2][2]);
    dank = vec3.create();
    vec3.rotateY(dank, temp, [0,0,0], degToRad(-carDeg));
    vec3.rotateX(dank, dank, [0,0,0], degToRad(35));
    lightPositions[2][0] = dank[0];
    lightPositions[2][1] = dank[1];
    lightPositions[2][2] = dank[2];
    changeLight(2, modelview);
    
    
    translateLight(3, [0,10,0]);
    temp = vec3.fromValues(lightPositions[3][0], lightPositions[3][1], lightPositions[3][2]);
    dank = vec3.create();
    vec3.rotateZ(dank, temp, [0,0,0], degToRad(sunDeg));
    vec3.rotateX(dank, dank, [0,0,0], degToRad(35));
    lightPositions[3][0] = dank[0];
    lightPositions[3][1] = dank[1];
    lightPositions[3][2] = dank[2];
    changeLight(3, modelview);
    
    
    
    
    rotate(modelview, degToRad(-55), [1, 0, 0]); 
    
    drawField();
    
    
    rotate(modelview, -degToRad(carDeg), [0, 0, 1]);
    translate(modelview, [0,-2.7,.7]);
    
    
    
    
    drawCar();
    translate(modelview, [0,2.7,-.7]);
    rotate(modelview, degToRad(carDeg), [0, 0, 1]);
    
    
    translate(modelview, [-1, 1, 0]);
    scale(modelview, [.6, .6, .6]);
    drawTree();
    scale(modelview, [1/.6, 1/.6, 1/.6]);
    translate(modelview, [1, -1, 0]);
    
    translate(modelview, [-1, -1, 0]);
    scale(modelview, [.8, .8, .8]);
    drawTree();
    scale(modelview, [1/.8, 1/.8, 1/.8]);
    translate(modelview, [1, 1, 0]);
    
    translate(modelview, [1, 0, 0]);    
    drawTree();    
    translate(modelview, [-1, 0, 0]);
    
    
    translate(modelview, [-1, -3.6, 0]); 
    scale(modelview, [.8, .8, .8]);
    drawTree();    
    scale(modelview, [1/.8, 1/.8, 1/.8]);
    translate(modelview, [1, 3.6, 0]);
    
    
    translate(modelview, [-2.9, 2.8, 0]); 
    scale(modelview, [.8, .8, .8]);
    drawTree();    
    scale(modelview, [1/.8, 1/.8, 1/.8]);
    translate(modelview, [2.9, -2.8, 0]);
    
    
    translate(modelview, [2.0, 3.2, 0]); 
    scale(modelview, [.5, .5, .5]);
    drawTree();    
    scale(modelview, [1/.5, 1/.5, 1/.5]);
    translate(modelview, [-2.0, -3.2, 0]);
    
    
    translate(modelview, [1.5, 3.4, 0]); 
    scale(modelview, [.3, .3, .3]);
    drawTree();    
    scale(modelview, [1/.3, 1/.3, 1/.3]);
    translate(modelview, [-1.5, -3.4, 0]);
    
    
    
    translate(modelview, [4, 0, 0]); 
    scale(modelview, [.7, .7, .7]);
    drawTree();    
    scale(modelview, [1/.7, 1/.7, 1/.7]);
    translate(modelview, [-4, 0, 0]);
    
    
    translate(modelview, [3.7, .5, 0]); 
    scale(modelview, [.3, .3, .3]);
    drawTree();    
    scale(modelview, [1/.3, 1/.3, 1/.3]);
    translate(modelview, [-3.7, -.5, 0]);
    
    
    translate(modelview, [3.7, -.5, 0]); 
    scale(modelview, [.3, .3, .3]);
    drawTree();    
    scale(modelview, [1/.3, 1/.3, 1/.3]);
    translate(modelview, [-3.7, .5, 0]);
    
    
    
    
    scale(modelview, [.6, .6, .6]);
    rotate(modelview, -degToRad(sunDeg), [0, 1, 0]);
    translate(modelview, [0, 0, 7.7]);
    
    
    
    installModel(objects[9]);
    currentModelNumber = 9;
    
    update_uniform(modelview, projection, 9, 6); 
    translate(modelview, [0, 0, -7.7]);
    rotate(modelview, degToRad(sunDeg), [0, 1, 0]);
    scale(modelview, [1/.6, 1/.6, 1/.6]);
    
    
    
    
    scale(modelview, [.3, .3, .3]);
    translate(modelview, [0, 0, 4]);
    
    
    
    
    installModel(objects[9]);
    currentModelNumber = 9;
    update_uniform(modelview, projection, 9, 7);
    translate(modelview, [0, 0, -4]);
    scale(modelview, [1/.3, 1/.3, 1/.3]);
    
    scale(modelview, [.2, .2, .15]);
    translate(modelview, [0, 0, 3.5]);
    installModel(objects[5]);
    currentModelNumber = 5;
    update_uniform(modelview, projection, 5, 9);    
    translate(modelview, [0, 0, -3.5]);
    scale(modelview, [1/.2, 1/.2, 1/.15]);
    
    rotate(modelview, degToRad(55), [1, 0, 0]); 
    
    
    
}

/*
  this function assigns the computed values to the uniforms for the model, view and projection 
  transform
*/
function update_uniform(modelview,projection,currentModelNumber, colorIndex){

    /* Get the matrix for transforming normal vectors from the modelview matrix,
       and send matrices to the shader program*/
    mat3.normalFromMat4(normalMatrix, modelview); 
    if( sunDeg > 90 && sunDeg < 270 )
    {        
        day = 0.0;
        gl.uniform4f(u_lightPosition, lightPositions[0][0], lightPositions[0][1], lightPositions[0][2], lightPositions[0][3]);
    }
    else
    {
        day = 1.0;              
        gl.uniform4f(u_lightPosition, lightPositions[3][0], lightPositions[3][1], lightPositions[3][2], lightPositions[3][3]);    
    }
    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection );   
    color = colorIndex;
    gl.uniform1f(u_color, color);
    gl.uniform3f(u_spotLightDir, spotLightDir[0], spotLightDir[1], spotLightDir[2]);
    gl.uniform1f(u_day, day);
    
    gl.uniform4f(u_lightPositionA, lightPositions[1][0], lightPositions[1][1], lightPositions[1][2], lightPositions[1][3]);   
    gl.uniform4f(u_lightPositionB, lightPositions[2][0], lightPositions[2][1], lightPositions[2][2], lightPositions[2][3]);   
    gl.drawElements(gl.TRIANGLES, objects[currentModelNumber].indices.length, gl.UNSIGNED_SHORT, 0);
}



/* 
 * Called and data for the model are copied into the appropriate buffers, and the 
 * scene is drawn.
 */
function installModel(modelData) {
     gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_coords_loc);
     gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_normal_loc);
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);    
}

function rotateLight(degree, n, axis)
{
    var angle = degToRad(degree);   
    var x = lightPositions[n][0];
    var y = lightPositions[n][1];
    var z = lightPositions[n][2];
    if(axis == 0)
    {                 
        lightPositions[n][1] = y * Math.cos(angle) + z * - Math.sin(angle);
        lightPositions[n][2] = y * Math.sin(angle) + z * Math.cos(angle);    
    }
    if(axis == 1)
    {
        lightPositions[n][0] = x * Math.cos(angle) + z * Math.sin(angle);
        lightPositions[n][2] = x * - Math.sin(angle) + z * Math.cos(angle);    
    }
    if(axis == 2)
    {
        lightPositions[n][0] = x * Math.cos(angle) + y * - Math.sin(angle);
        lightPositions[n][1] = x * Math.sin(angle) + y * Math.cos(angle);
    }
}

function translateLight(n, t_vector)
{
    var x = lightPositions[n][0] + t_vector[0];
    var y = lightPositions[n][1] + t_vector[1];
    var z = lightPositions[n][2] + t_vector[2];
    lightPositions[n] = [x, y, z, lightPositions[n][3]];
}

/* Initialize the WebGL context.  Called from init() */
function initGL() {
    var prog = createProgram(gl,"vshader-source","fshader-source");
    gl.useProgram(prog);
    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_normal_loc =  gl.getAttribLocation(prog, "a_normal");
    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
    u_lightPosition=  gl.getUniformLocation(prog, "lightPosition");
    u_lightPositionA=  gl.getUniformLocation(prog, "lightPositionA");
    u_lightPositionB=  gl.getUniformLocation(prog, "lightPositionB");
    u_diffuseColor =  gl.getUniformLocation(prog, "diffuseColor");
    u_specularColor =  gl.getUniformLocation(prog, "specularColor");
    u_specularExponent = gl.getUniformLocation(prog, "specularExponent");
    u_color = gl.getUniformLocation(prog, "color");
    u_spotLightDir = gl.getUniformLocation(prog, "spotLightDir");
    u_day = gl.getUniformLocation(prog, "day");
    a_coords_buffer = gl.createBuffer();
    a_normal_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.uniform3f(u_specularColor, 0.5, 0.5, 0.5);
    gl.uniform4f(u_diffuseColor, 1, 1, 1, 1);
    gl.uniform1f(u_specularExponent, 10);    
    gl.uniform4f(u_lightPosition, lightPositions[0][0], lightPositions[0][1], lightPositions[0][2], lightPositions[0][3]);    
    gl.uniform4f(u_lightPositionA, lightPositions[1][0], lightPositions[1][1], lightPositions[1][2], lightPositions[1][3]);
    gl.uniform4f(u_lightPositionB, lightPositions[2][0], lightPositions[2][1], lightPositions[2][2], lightPositions[2][3]);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
            // This nested function retrieves the text content of an
            // element on the web page.  It is used here to get the shader
            // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
     }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    try {
        var canvas = document.getElementById("myGLCanvas");
        gl = canvas.getContext("webgl") || 
                         canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }

    document.getElementById("my_gl").checked = false;
    document.getElementById("my_gl").onchange = tick;
    
    rotator = new TrackballRotator(canvas, draw , 15);
    
    lightDeg = 0;  
    carDeg = 0;
    sunDeg =0;
    wheelDeg = 0;
    
    
    
    draw();
}



function resetLight(){
    lightPositions[0] = [0,.2,-15,1];
    lightPositions[1] = [0,0,0,1];
    lightPositions[2] = [0,0,0,1];
    lightPositions[3] = [0,0,0,1];
    spotLightDir = vec3.fromValues(1,0,0);
}

function tick() {        
    if(document.getElementById("my_gl").checked == true)
    {
        requestAnimFrame(tick);
        carDeg = ( carDeg + 3 ) % 360; 
        wheelDeg = ( wheelDeg + 15 ) % 360;        
        sunDeg = (sunDeg + 1) % 360;
        lightDeg = (lightDeg + 1) % 360;
        
    }
    draw();
    
}







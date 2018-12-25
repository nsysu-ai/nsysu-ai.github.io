//
// app.js
//

var localVideo = document.getElementById("localVideo");
var localCanvas = document.getElementById("localCanvas");

var FaceCompX = 0;
var FaceCompY = 0;
var FaceCompWidth = 0;
var FaceCompHeight = 0;

poll = function() {
    var w = localVideo.videoWidth;
    var h = localVideo.videoHeight;
    var canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(localVideo, 0, 0, w, h);
    var comp = ccv.detect_objects({ "canvas" : ccv.grayscale(canvas),
                                    "cascade" : cascade,
                                    "interval" : 5,
                                    "min_neighbors" : 1 });
    /* draw detected area */
    localCanvas.width = localVideo.clientWidth;
    localCanvas.height = localVideo.clientHeight;
    var ctx2 = localCanvas.getContext('2d');
    ctx2.lineWidth = 2;
    ctx2.lineJoin = "round";
    ctx2.clearRect (0, 0, localCanvas.width,localCanvas.height);
    var x_offset = 0, y_offset = 0, x_scale = 1, y_scale = 1;
    if (localVideo.clientWidth * localVideo.videoHeight > localVideo.videoWidth * localVideo.clientHeight) {
        x_offset = (localVideo.clientWidth - localVideo.clientHeight *
                    localVideo.videoWidth / localVideo.videoHeight) / 2;
    } else {
        y_offset = (localVideo.clientHeight - localVideo.clientWidth *
                    localVideo.videoHeight / localVideo.videoWidth) / 2;
    }
    x_scale = (localVideo.clientWidth - x_offset * 2) / localVideo.videoWidth;
    y_scale = (localVideo.clientHeight - y_offset * 2) / localVideo.videoHeight;

    if (comp.length > 0) {
        for (var i = 0; i < comp.length; i++) {
            FaceCompX = comp[i].x;
            FaceCompY = comp[i].y;
            FaceCompWidth = comp[i].width;
            FaceCompHeight = comp[i].height;

            comp[i].x = comp[i].x * x_scale + x_offset;
            comp[i].y = comp[i].y * y_scale + y_offset;
            comp[i].width = comp[i].width * x_scale;
            comp[i].height = comp[i].height * y_scale;
            var opacity = 0.1;
            if (comp[i].confidence > 0) {
                opacity += comp[i].confidence / 10;
                if (opacity > 1.0) opacity = 1.0;
            }
            //ctx2.strokeStyle = "rgba(255,0,0," + opacity * 255 + ")";
            ctx2.lineWidth = opacity * 10;
            ctx2.strokeStyle = "rgb(255,0,0)";
            ctx2.strokeRect(comp[i].x, comp[i].y, comp[i].width, comp[i].height);
        }
    } else {
        FaceCompX = 0;
        FaceCompY = 0;
        FaceCompWidth = 0;
        FaceCompHeight = 0;
    }
    //setTimeout(poll, 1000);
}

var videoSelect = document.querySelector('select#videoSource');
var selectors = [videoSelect];

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function(select) {
        return select.value;
    });
    selectors.forEach(function(select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        
        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
        }
    }
    
    selectors.forEach(function(select, selectorIndex) {
        if (Array.prototype.slice.call(select.childNodes).some(function(n) {
            return n.value === values[selectorIndex];
        })) {
            select.value = values[selectorIndex];
        }
    });
}

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

var pollTimerId = null;

function gotStream(stream) {
    //var videoElement = document.getElementById('localVideo');
    window.stream = stream; // make stream available to console
    //videoElement.srcObject = stream;

    localVideo.style.opacity = 1;
    localVideo.srcObject = stream;
    localStream = stream;
    

    if (/Mobi/.test(navigator.userAgent)) {
        // mobile
        //console.log("mobile");
    } else {
        // desktop
        //console.log("desktop");

        if (pollTimerId) {
            clearInterval(pollTimerId);
        }
        pollTimerId = setInterval(poll, 1000);
    }



    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function start() {
    if (window.stream) {
        window.stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    var videoSource = videoSelect.value;
    var constraints = {
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);

    //navigator.getUserMedia(constraints, onGotStream, onFailedStream);
}

videoSelect.onchange = start;

// start
var mainDiv = document.getElementById("mainDiv");
mainDiv.style.left = (1200/2 - 500/2) + "px";
var userUUID = null;

start();


//---------------------------------------------

function generateUUID() {
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

//---------------------------------------------

var isFaceCompare = false;
var photoList = ["", "", "", "", ""];


function getCurrentPhotoListIndex() {
    for (let i = 0; i < 5; i++) {
        if (photoList[i] === "") {
            return i;
        }
    }
    return -1;
}

function takeSnapshotButton_click() {
    if (isFaceCompare == true) {
        takeComparedPhoto();
    } else {
        let photoIndex = getCurrentPhotoListIndex();

        if (photoIndex >= 0 && photoIndex < 5) {
            handleTakePhoto();
        } else {
            uploadPhotos();  //上傳
        }
    }
}

function takeComparedPhoto() {
    let imageData1 = photoList[0];
    document.getElementById('selfFaceImage').src = imageData1;

    const myPromise = new Promise((resolve, reject) => {
        let myvideo = document.getElementById('localVideo');
        let tempCanvas = document.createElement('canvas');
        let context = tempCanvas.getContext('2d');

        let x = 0;
        let y = 0;
        let width = myvideo.videoWidth;
        let height = myvideo.videoHeight;
    
        tempCanvas.width = width;
        tempCanvas.height = height;

        context.drawImage(myvideo, x, y, width, height, 0, 0, width, height);
        let imageData2 = context.canvas.toDataURL("image/png");
        document.getElementById('comparedFaceImage').src = imageData2;
        
        document.getElementById('faceCompareDiv').style.display = 'block';
        document.getElementById('mainDiv').style.display = 'none';

        resolve(context);
    });

    myPromise.then(clipImageDone, null);
}

//上傳照片
function uploadPhotos() {
    document.getElementById('progressDiv').style.display = 'block';
    document.getElementById('progressMsg').innerHTML = "上傳中...";
    document.getElementById('mainDiv').style.display = 'none';
    document.getElementById('photoList').style.display = 'none';

    setTimeout(function(){
        document.getElementById('progressDiv').style.display = 'none';
        document.getElementById('mainDiv').style.display = 'block';

        document.getElementById('showMsg1').style.display = 'block';
        document.getElementById('showMsg1').innerHTML = "上傳成功！！";

        document.getElementById("takeSnapshotButton").style.background='#0072e3';
        document.getElementById("takeSnapshotButton").innerHTML = "拍照 & 比對";

        isFaceCompare = true;

        setTimeout(function(){
            $( "#showMsg1" ).fadeOut(1500);
        }, 1000);
    }, 2000);
}

function handleTakePhoto() {
    let photoNum = photoList.length;

    const myFirstPromise = new Promise((resolve, reject) => {
        // 執行一些非同步作業，最終呼叫:
        //
        //   resolve(someValue); // 實現
        // 或
        //   reject("failure reason"); // 拒絕
        //

        let myvideo = document.getElementById('localVideo');
        let tempCanvas = document.createElement('canvas');
        let context = tempCanvas.getContext('2d');
    
        // let x = FaceCompX - (FaceCompWidth/4);
        // let y = FaceCompY - (FaceCompHeight/4)
        // let width = FaceCompWidth + (FaceCompWidth/4)*2;
        // let height = FaceCompHeight + (FaceCompHeight/5)*3;

        let x = 0;
        let y = 0;
        let width = myvideo.videoWidth;
        let height = myvideo.videoHeight;
    
        tempCanvas.width = width;
        tempCanvas.height = height;

        let photoIndex = getCurrentPhotoListIndex();

        if (photoIndex >= 0 && photoIndex < 5) {
            context.drawImage(myvideo, x, y, width, height, 0, 0, width, height);
            let imageData = context.canvas.toDataURL("image/png");
            let suffixNum = photoIndex + 1;
            let imgDivName = "faceImage" + suffixNum.toString();
            let photoDivName = "photo" + suffixNum.toString();
            document.getElementById(imgDivName).src = imageData;
            document.getElementById(photoDivName).style.display = 'block';  

            photoList[photoIndex] = imageData;
            
            checkPhotoFulled();

            resolve(context);
        } else {
            //reject("failure!");
        }
    });

    myFirstPromise.then(clipImageDone, null);
}

function checkPhotoFulled() {
    $("#showMsg1").hide();
    let photoIndex = getCurrentPhotoListIndex();

    if (photoIndex >= 0 && photoIndex < 5) {
        document.getElementById("takeSnapshotButton").style.background='#d84a38';
        document.getElementById("takeSnapshotButton").innerHTML = "拍照";
    }

    if (photoIndex == 0){
        document.getElementById('showMsg1').innerHTML = "請將臉「正面」朝向鏡頭，並拍照";
        $("#showMsg1").fadeIn(800);
    }
    else if (photoIndex == 1) {
        document.getElementById('showMsg1').innerHTML = "請將臉稍微朝向「右邊」，並拍照";
        $("#showMsg1").fadeIn(800);
    }
    else if (photoIndex == 2) {
        document.getElementById('showMsg1').innerHTML = "請將臉稍微朝向「左邊」，並拍照";
        $("#showMsg1").fadeIn(800);
    }
    else if (photoIndex == 3) {
        document.getElementById('showMsg1').innerHTML = "請將臉稍微朝向「上方」，並拍照";
        $("#showMsg1").fadeIn(800);
    }
    else if (photoIndex == 4) {
        document.getElementById('showMsg1').innerHTML = "請將臉稍微朝向「下方」，並拍照";
        $("#showMsg1").fadeIn(800);
    }
    else {
        document.getElementById("takeSnapshotButton").style.background='#01b468';
        document.getElementById("takeSnapshotButton").innerHTML = "上傳";
        userUUID = "tmpuser@" + generateUUID();
        console.log(userUUID);
    }
}

function clipImageDone(context) {

}

function removePhotoButton_click(btnId) {
    console.log(btnId);

    if (btnId === "btn1") {
        //photoList.splice(0, 1);
        photoList[0] = "";
        document.getElementById('photo1').style.display = 'none';
    }
    else if (btnId === "btn2") {
        //photoList.splice(1, 1);
        photoList[1] = "";
        document.getElementById('photo2').style.display = 'none';
    }
    else if (btnId === "btn3") {
        //photoList.splice(2, 1);
        photoList[2] = "";
        document.getElementById('photo3').style.display = 'none';
    } 
    else if (btnId === "btn4") {
        //photoList.splice(3, 1);
        photoList[3] = "";
        document.getElementById('photo4').style.display = 'none';
    } 
    else if (btnId === "btn5") {
        //photoList.splice(4, 1);
        photoList[4] = "";
        document.getElementById('photo5').style.display = 'none';
    }

    checkPhotoFulled();
}

/*
function updatePhotosAppear() {
    console.log(photoList.length);

    for (let i = 0; i < photoList.length; i++) {
        let imageData = photoList[i];
        let suffixNum = i + 1;
        let imgDivName = "faceImage" + suffixNum.toString();
        document.getElementById(imgDivName).src = imageData;
    }

    for (let i = photoList.length; i < 5; i++) {
        let suffixNum = i + 1;
        let photoDivName = "photo" + suffixNum.toString();
        document.getElementById(photoDivName).style.display = 'none'; 
    }

    if ( photoList.length < 5) {
        document.getElementById("takeSnapshotButton").style.background='#d84a38';
        document.getElementById("takeSnapshotButton").innerHTML = "拍照";
    }
}*/

//-----
function restartButton_click() {
    isFaceCompare = false;
    photoList = ["", "", "", "", ""];

    checkPhotoFulled();

    for (let i = 0; i < 5; i++) {
        let suffixNum = i + 1;
        let photoDivName = "photo" + suffixNum.toString();
        document.getElementById(photoDivName).style.display = 'none'; 
    }

    document.getElementById('faceCompareDiv').style.display = 'none'; 
    document.getElementById('mainDiv').style.display = 'block';
    document.getElementById('photoList').style.display = 'block';
}
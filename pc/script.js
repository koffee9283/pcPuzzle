document.addEventListener('DOMContentLoaded', function() {
    function loading() {
        if (motherOK && imagesOK) {
            const imgWidth = 100;
            const imgHeight = 100;
            const margin = 10;
            const padding = 72; // canvas左右のゆとり幅
            let positionX;
            let positionY;

            bgX = (screen.width - motherImg.width) / 2;
            bgY = (screen.height - motherImg.height) / 3;

            coordinateTimeX = motherImg.width / 182;
            coordinateTimeY = motherImg.height / 148;

            img.forEach(function(img, index) {
                // 左右に画像を振り分け初期位置を定める
                if (index % 2 == 0) {
                    positionX = margin;
                    positionY = index / 2 * (imgHeight + margin) + padding;
                } else {
                    positionX = screen.width - (imgWidth + margin);
                    positionY = Math.floor(index / 2) * (imgHeight + margin) + padding;
                }

                //画像や座標のオブジェクト生成
                images.push({
                    id: index,
                    image: img,
                    name: imageName[index],
                    x: positionX, y: positionY,
                    glX: bgX + goalX[index], glY: bgY + goalY[index],
                    lineX: coordinateTimeX * startLineX[index],
                    lineY: coordinateTimeY * startLineY[index],
                    width: img.width, height: img.height,
                    description: imageDescriptions[index],
                    isStuckPiece: false,
                    isPlacedCorrectly: false
                });
            });

            clearInterval(ready); //ループ解除
            resizeCanvas(); // canvasSizeをwindowSizeに合わせる
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('resize', resizeCanvas);
        }
    }

    function drawImages() {
        if (!(motherOK && imagesOK)) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 上部の説明文
        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText('パーツをドラッグしてPCを完成させよう', canvas.width / 2, fontSize + 12);
        ctx.fillText('カーソルをかざすと下に名前と説明が出るよ！', canvas.width / 2, (fontSize + 12) * 2);

        // 背景画像
        ctx.drawImage(motherImg, bgX, bgY);

        // 引き出し線と目標範囲
        for (let i = 0; i < images.length; i++) {
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.moveTo(screen.width / 2 + images[i].lineX, screen.height / 3 + images[i].lineY);
            ctx.lineTo(images[i].glX + images[i].width / 2, images[i].glY + images[i].height / 2);
            ctx.stroke();

            const rectMargin = 12;
            const rectColor = (images[i].isPlacedCorrectly) ? '#9FFAFE' : '#CFF16B';
            ctx.fillStyle = rectColor;
            ctx.fillRect(images[i].glX - rectMargin, images[i].glY - rectMargin, images[i].width + rectMargin, images[i].height + rectMargin)

            const nameSize = 12;
            ctx.font = nameSize + 'px Arial';
            ctx.fillStyle = '#7A0A2A';
            ctx.textAlign = 'start';
            ctx.fillText(images[i].name, images[i].glX - rectMargin, images[i].glY - rectMargin);    
        }

        // 情報欄
        if (!allPlacedCorrectly) { // 完成前後で色を変える
            ctx.fillStyle = '#9FFAFE';
        } else {
            ctx.fillStyle = '#FFEA8E';
        }
        ctx.fillRect(0, canvas.height - fontSize * 2, canvas.width, canvas.height);

        // 名前と説明
        if (displayedDescription && !allPlacedCorrectly) {
            ctx.font = fontSize+'px Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'start';
            ctx.fillText(displayedName+'：'+displayedDescription, 10, canvas.height - 24);
        }

        // 完成メッセージ
        if (allPlacedCorrectly) {
            ctx.font = fontSize+'px Arial';
            ctx.fillStyle = '#FF3F35';
            ctx.textAlign = 'center';
            ctx.fillText('完成！おめでとう！', canvas.width / 2, canvas.height - 24);
        }

        // 各パーツ
        images.forEach(function(imgObj) {
        ctx.drawImage(imgObj.image, imgObj.x, imgObj.y);
        });
    }

    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const startX = parseInt(e.clientX - rect.left);
        const startY = parseInt(e.clientY - rect.top);

        for (let i = images.length - 1; i >= 0; i--) {
            if (startX >= images[i].x && startX <= images[i].x + images[i].width &&
                startY >= images[i].y && startY <= images[i].y + images[i].height) {

                if (images[i].isStuckPiece) { // この画像は正しく配置されており、移動させない
                    return; // ドラッグ操作を開始しない
                }
                isDragging = true;
                selectedImage = images[i];
                canvasOffset = { x: startX - images[i].x, y: startY - images[i].y };
                images.splice(i, 1); // 現在の位置から画像を削除
                images.push(selectedImage); // 画像を配列の最後に追加
                return;
            }
        }
    }

    function handleMouseUp(e) {
        if (isDragging && selectedImage) {
            // ダブりか否かで分岐
            if (duplicateIndices.includes(selectedImage.id)) {
                deleteDuplicates.forEach(function (duplicate){
                    const index = images.findIndex(img => img.id === duplicate);
                    const isCloseEnough = Math.abs(selectedImage.x - images[index].glX) < 50 &&
                                        Math.abs(selectedImage.y - images[index].glY) < 50;
                    if (isCloseEnough) {
                        // スナップ処理
                        selectedImage.x = images[index].glX;
                        selectedImage.y = images[index].glY;
                        selectedImage.isStuckPiece = true;
                        images[index].isPlacedCorrectly = true;
                        deleteDuplicates = duplicateIndices.filter(duplicate => duplicate !== images[index].id);
                        images.splice(images.length - 1, 1); // 現在の位置から画像を削除
                        images.unshift(selectedImage); // 画像を配列の最後に追加    
                    }
                });
            } else { // 従来の処理
                const isCloseEnough = Math.abs(selectedImage.x - selectedImage.glX) < 50 &&
                                      Math.abs(selectedImage.y - selectedImage.glY) < 50;
                if (isCloseEnough) {
                    // スナップ処理
                    selectedImage.x = selectedImage.glX;
                    selectedImage.y = selectedImage.glY;
                    selectedImage.isStuckPiece = true;
                    selectedImage.isPlacedCorrectly = true;
                    images.splice(images.length - 1, 1); // 現在の位置から画像を削除
                    images.unshift(selectedImage); // 画像を配列の最後に追加
                }
            }

            // 全て配置できたか判定
            allPlacedCorrectly = images.every(img => img.isStuckPiece);
        }

        isDragging = false;
        selectedImage = null;

        drawImages();
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = parseInt(e.clientX - rect.left);
        const mouseY = parseInt(e.clientY - rect.top);

        displayedName = null;
        displayedDescription = null;

        // カーソル下の画像の説明を代入する
        if (!isDragging) {
            images.forEach(function(imgObj) {
                if (mouseX >= imgObj.x && mouseX <= imgObj.x + imgObj.width &&
                    mouseY >= imgObj.y && mouseY <= imgObj.y + imgObj.height) {
                    displayedName = imgObj.name;
                    displayedDescription = imgObj.description;
                }
            });

            // マザーボードの説明表示
            if (mouseX >= bgX && mouseX <= bgX + motherImg.width &&
                mouseY >= bgY && mouseY <= bgY + motherImg.height) {
                displayedName = motherName;
                displayedDescription = motherDescription;
            }
        }

        if (isDragging && selectedImage) {
            selectedImage.x = mouseX - canvasOffset.x;
            selectedImage.y = mouseY - canvasOffset.y;
            displayedName = selectedImage.name;
            displayedDescription = selectedImage.description;
        }

        drawImages();
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawImages();
    }

    // Start of processing-------------------------------------------------------
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let canvasOffset = canvas.getBoundingClientRect();
    let isDragging = false;
    let selectedImage = null;
    let displayedName = null;
    let displayedDescription = null;
    let allPlacedCorrectly = false;
    const fontSize = 30;

    const imageName = [];
    imageName[0] = 'CPU';
    imageName[1] = 'CPUファン';
    imageName[2] = 'GPU';
    imageName[3] = 'HDD';
    imageName[4] = 'ヒートシンク';
    imageName[5] = 'メモリ';
    imageName[6] = 'メモリ';
    imageName[7] = 'DVD(BD)プレイヤー';
    imageName[8] = '電源';
    imageName[9] = 'SSD';

    // 要素の出現回数をカウント
    const elementCount = imageName.reduce((acc, element) => {
        acc[element] = (acc[element] || 0) + 1;
        return acc;
    }, {});

    // 2回以上出現する要素のインデックスを抽出
    const duplicateIndices = imageName
        .map((element, index) => (elementCount[element] > 1 ? index : -1))
        .filter(index => index !== -1);

    let deleteDuplicates = duplicateIndices;

    // motherImg(bgX,bgY)からみた相対的座標
    // 目標範囲の描画座標
    const goalX = [];       const goalY = [];
    goalX[0] = 210;         goalY[0] = -80;
    goalX[1] = 353;         goalY[1] = -100;
    goalX[2] = 23;          goalY[2] = -100;
    goalX[3] = -97;         goalY[3] = 330;
    goalX[4] = -127;        goalY[4] = 162;
    goalX[5] = 373;         goalY[5] = 40;
    goalX[6] = 373;         goalY[6] = 200;
    goalX[7] = 63;          goalY[7] = 330;
    goalX[8] = -200;        goalY[8] = -38;
    goalX[9] = 223;         goalY[9] = 330;

    // 引き出し線の始点
    const startLineX = [];      const startLineY = [];
    startLineX[0] = 48;        startLineY[0] = 2;
    startLineX[1] = 48;        startLineY[1] = 2;
    startLineX[2] = -28;       startLineY[2] = -23;
    startLineX[3] = -60;       startLineY[3] = 67;
    startLineX[4] = -68;       startLineY[4] = 42;
    startLineX[5] = 67;        startLineY[5] = 42;
    startLineX[6] = 67;        startLineY[6] = 65;
    startLineX[7] = -60;       startLineY[7] = 67;
    startLineX[8] = -83;       startLineY[8] = -7;
    startLineX[9] = -60;       startLineY[9] = 67;

    let coordinateTimeX = null;
    let coordinateTimeY = null;

    const imageDescriptions = [];
    imageDescriptions[0] = 'パソコンの演算装置、人間で例えると脳'
    imageDescriptions[1] = 'CPUを冷やす部品'
    imageDescriptions[2] = '映像を処理する部品'
    imageDescriptions[3] = 'データを保存する記憶装置'
    imageDescriptions[4] = '熱を逃がす部品'
    imageDescriptions[5] = '作業に必要なデータを並べる、主記憶装置'
    imageDescriptions[6] = '作業に必要なデータを並べる、主記憶装置'
    imageDescriptions[7] = 'DVDやBDを再生する装置'
    imageDescriptions[8] = '電気を変換して供給する装置'
    imageDescriptions[9] = '従来より高速な記憶装置'

    // motherboard Setting
    let motherImg = new Image();
    const motherName = 'マザーボード';
    const motherDescription = '様々な部品をつなぐ基盤';
    motherImg.src = './../images/mother.png'
    // motherImg.src = './../images/formermother.png'
    let bgX;    let bgY;
    let motherOK = false;
    motherImg.onload = function() {
        motherOK = true;
    }
    
    const img = [];
    let images = []; // 画像オブジェクト
    const imageSources = []; // 画像のパス
    let imagesLoaded = 0; // 読み込み完了した画像数
    let imagesOK = false;
    for (let i = 0; i < 10; i++) {
        imageSources[i] = './../images/part' + i + '.png';
    }


    // 画像を読み込み、初期位置と目標位置を設定
    imageSources.forEach(function(source, index) {
        img[index] = new Image();
        img[index].src = source;
        img[index].onload = function() {
            // すべての画像が読み込まれたか否か
            imagesLoaded++;
            if (imagesLoaded === imageSources.length) {
                imagesOK = true;
            }
        };
    });

    const ready = setInterval(loading,1); // 全画像の読み込みが終わるまでloadingを呼び出す
});

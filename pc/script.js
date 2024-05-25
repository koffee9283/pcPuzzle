document.addEventListener('DOMContentLoaded',() => {
    // declarations-----------------------------------------------------------------
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 30;
    const rectMargin = 12;
    const nameSize = 12;

    const componentNames = [];
    componentNames[0] = 'CPU';
    componentNames[1] = 'CPUファン';
    componentNames[2] = 'GPU';
    componentNames[3] = 'HDD';
    componentNames[4] = 'ヒートシンク';
    componentNames[5] = 'メモリ';
    componentNames[6] = 'メモリ';
    componentNames[7] = 'DVD(BD)プレイヤー';
    componentNames[8] = '電源';
    componentNames[9] = 'SSD';

    // motherImg(bgX,bgY)からみた相対的座標
    // 目標範囲の描画座標
    const targetCoordsX = [];       const targetCoordsY = [];
    targetCoordsX[0] = 210;         targetCoordsY[0] = -80;
    targetCoordsX[1] = 353;         targetCoordsY[1] = -100;
    targetCoordsX[2] = 23;          targetCoordsY[2] = -100;
    targetCoordsX[3] = -97;         targetCoordsY[3] = 330;
    targetCoordsX[4] = -127;        targetCoordsY[4] = 162;
    targetCoordsX[5] = 373;         targetCoordsY[5] = 40;
    targetCoordsX[6] = 373;         targetCoordsY[6] = 200;
    targetCoordsX[7] = 63;          targetCoordsY[7] = 330;
    targetCoordsX[8] = -200;        targetCoordsY[8] = -38;
    targetCoordsX[9] = 223;         targetCoordsY[9] = 330;

    // 引き出し線の始点
    const lineStartCoordsX = [];      const lineStartCoordsY = [];
    lineStartCoordsX[0] = 48;        lineStartCoordsY[0] = 2;
    lineStartCoordsX[1] = 48;        lineStartCoordsY[1] = 2;
    lineStartCoordsX[2] = -28;       lineStartCoordsY[2] = -23;
    lineStartCoordsX[3] = -60;       lineStartCoordsY[3] = 67;
    lineStartCoordsX[4] = -68;       lineStartCoordsY[4] = 42;
    lineStartCoordsX[5] = 67;        lineStartCoordsY[5] = 42;
    lineStartCoordsX[6] = 67;        lineStartCoordsY[6] = 65;
    lineStartCoordsX[7] = -60;       lineStartCoordsY[7] = 67;
    lineStartCoordsX[8] = -83;       lineStartCoordsY[8] = -7;
    lineStartCoordsX[9] = -60;       lineStartCoordsY[9] = 67;

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

    const images = []; // 画像情報のオブジェクト
    const imageSources = Array.from({ length: 10 }, (_, i) => `./../images/part${i}.png`);

    let motherImg = null; // マザーボードのオブジェクト
    const motherName = 'マザーボード';
    const motherDescription = '様々な部品をつなぐ基盤';
    const motherSource = './../images/mother.png'


    let canvasOffset = canvas.getBoundingClientRect();
    let isDragging = false;
    let selectedImage = null;
    let displayedName = null;
    let displayedDescription = null;
    let allPlacedCorrectly = false;

    // 要素の出現回数をカウント
    const elementCount = componentNames.reduce((acc, element) => {
        acc[element] = (acc[element] || 0) + 1;
        return acc;
    }, {});

    // 2回以上出現する要素のインデックスを抽出
    const duplicateIndices = componentNames
        .map((element, index) => (elementCount[element] > 1 ? index : -1))
        .filter(index => index !== -1);

    let deleteDuplicates = duplicateIndices;

    // functions--------------------------------------------------------------------
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }

    function drawImages() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 上部の説明文
        ctx.font = `${fontSize}px Arial`;
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

            const rectColor = (images[i].isPlacedCorrectly) ? '#9FFAFE' : '#CFF16B';
            ctx.fillStyle = rectColor;
            ctx.fillRect(images[i].glX - rectMargin, images[i].glY - rectMargin, images[i].width + rectMargin, images[i].height + rectMargin)

            ctx.font = `${nameSize}px Arial`;
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
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'start';
            ctx.fillText(displayedName+'：'+displayedDescription, 10, canvas.height - 24);
        }

        // 完成メッセージ
        if (allPlacedCorrectly) {
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = '#FF3F35';
            ctx.textAlign = 'center';
            ctx.fillText('完成！おめでとう！', canvas.width / 2, canvas.height - 24);
        }

        // 各パーツ
        images.forEach((imgObj) => {
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
                deleteDuplicates.forEach((duplicate) => {
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
                    selectedImage.x = selectedImage.glX - rectMargin / 2;
                    selectedImage.y = selectedImage.glY - rectMargin / 2;
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
            images.forEach((imgObj) => {
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
    Promise.all([...imageSources, motherSource].map(loadImage)).then(img => {
        motherImg = img.pop();
        const imgWidth = 100;
        const imgHeight = 100;
        const margin = 10;
        const padding = 72; // canvas左右のゆとり幅
        const coordinateTimeX = motherImg.width / 182;
        const coordinateTimeY = motherImg.height / 148;

        bgX = (screen.width - motherImg.width) / 2;
        bgY = (screen.height - motherImg.height) / 3;

        img.forEach((img, index) => {
            let positionX, positionY;
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
                name: componentNames[index],
                x: positionX, y: positionY,
                glX: bgX + targetCoordsX[index], glY: bgY + targetCoordsY[index],
                lineX: coordinateTimeX * lineStartCoordsX[index],
                lineY: coordinateTimeY * lineStartCoordsY[index],
                width: img.width, height: img.height,
                description: imageDescriptions[index],
                isStuckPiece: false,
                isPlacedCorrectly: false
            });
        });

        resizeCanvas(); // canvasSizeをwindowSizeに合わせる
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', resizeCanvas);

    }).catch(error => {
        console.error('Failed to load some images', error);
        alert('Failed to load some images')
    });
});

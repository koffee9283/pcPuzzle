document.addEventListener('DOMContentLoaded',() => {

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }
    
    const imageSources = []; // 画像のパス
    for (let i = 0; i < 10; i++) {
        imageSources[i] = './../images/part${i}.png';
    }
    const motherSource = './../images/mother.png'
    imageSources.push(motherSource);

    let loadImages = imageSources.map(src => loadImage(src));
    Promise.all(loadImages).then(img => {
        const motherImg = img.pop();
        console.log(img);
        console.log(motherImg);
    }).catch(error => {
        console.error('Failed to load some images', error);
    });
});
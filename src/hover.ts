
function showImage(elem: HTMLElement, imgSrc: string) {
    const popImage = new Image();
    popImage.src = imgSrc;
    popImage.style.position = "absolute";
    popImage.style.zIndex = "1";
    elem.appendChild(popImage);
}
function hideImage(elem: HTMLElement) {
  elem.replaceChildren("");
}

function imbueHoverImage(elem: HTMLElement, imgSrc: string) {
    elem.onmouseover = () => { showImage(elem, imgSrc); }
    elem.onmouseout = () => { hideImage(elem); };
}
export const CARD_HEIGHT = "476";
export const CARD_WIDTH = "342";
function showImage(elem: HTMLElement, imgSrc: string) {
  const popImage = new Image();
  popImage.src = imgSrc;
  popImage.style.position = "absolute";
  popImage.style.zIndex = "1";
  popImage.style.width = CARD_WIDTH;
  popImage.style.height = CARD_HEIGHT;
  const sourceLoc = elem.getBoundingClientRect();

  if (sourceLoc.left > window.innerWidth / 2) {
    // pop up image to the left
    popImage.style.left = "" + (sourceLoc.left + (-CARD_WIDTH));
  }
  const bottomEdge = window.innerHeight + window.scrollY;
  if (sourceLoc.top + +CARD_HEIGHT > window.innerHeight) {
    popImage.style.top = "" + (bottomEdge + (-CARD_HEIGHT));
  }
  elem.appendChild(popImage);
}
function hideImage(elem: HTMLElement) {
  if (!elem.lastChild) { return; }
  elem.removeChild(elem.lastChild);
}

export function imbueHoverImage(elem: HTMLElement, imgSrc: string) {
  elem.onmouseover = () => { showImage(elem, imgSrc); }
  elem.onmouseout = () => { hideImage(elem); };
}